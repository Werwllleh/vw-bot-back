import express from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {Op} from "sequelize";
import {AuthDataValidator} from "@telegram-auth/server";
import {objectToAuthDataMap} from "@telegram-auth/server/utils";
import {authenticateAccessToken, generateAccessToken, generateRefreshToken, verifyToken} from "../services/auth.js" ;
import {authLimiter} from "../functions/rateLimit.js";
import {Users, Roles, UserRoles, PasswordResetTokens} from "../models.js";
import {ROLES} from "../services/roles.js";
import {randomColor} from "../functions/randomColor.js";
import {logEvent, EVENT_TYPES} from "../services/events.js";
import {sendPasswordResetEmail, isEmailConfigured} from "../services/email.js";


const router = express.Router();

// Базовые опции кук: httpOnly (недоступны из JS → защита от кражи через XSS),
// secure (только по HTTPS), sameSite 'lax' (для корректной передачи при переходе по внешним ссылкам).
const baseCookieOptions = {
  domain: process.env.URL_COOKIE_DOMAIN,
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней для бесшовной долгой сессии
};

const accessCookieOptions = {
  ...baseCookieOptions,
  maxAge: 60 * 60 * 1000, // 1 час
};

router.post('/auth/login', authLimiter, async (req, res) => {
  try {

    const {data} = req.body;

    const validator = new AuthDataValidator({
      botToken: process.env.BOT_AUTH_TOKEN,
    });

    const userData = objectToAuthDataMap(data);

    const result = await validator.validate(userData);
    // 'Error: Unauthorized! The data has expired.'

    if (!result) {
      return res.status(401).json({error: 'Invalid hash'});
    }

    const jwt = {
      chatId: result.id,
      photo: result.photo_url,
    }

    // Создание токенов
    const accessToken = await generateAccessToken(jwt);
    const refreshToken = await generateRefreshToken(jwt);

    // Отправка токенов
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.cookie('accessToken', accessToken, accessCookieOptions);

    return res.status(200).json({accessToken, chatId: result.id});
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({error: 'Internal server error'});
  }
});

// Регистрация по Email + Пароль
router.post('/auth/register-credentials', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    const trimmedName = name?.trim();
    const normalizedEmail = email?.trim()?.toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({ error: 'Имя должно содержать не менее 2 символов' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Некорректный адрес электронной почты' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const existingUser = await Users.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'Пользователь с таким email уже зарегистрирован' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Уникальный отрицательный chatId для связей по внешним ключам (cars, events) без коллизий с реальными TG ID
    const syntheticChatId = -(Date.now() * 1000 + Math.floor(Math.random() * 1000));

    const user = await Users.create({
      chatId: syntheticChatId,
      name: trimmedName,
      email: normalizedEmail,
      password: passwordHash,
      color: randomColor(),
    });

    const userRole = await Roles.findOne({ where: { value: ROLES.USER } });
    if (userRole) {
      await UserRoles.findOrCreate({
        where: { userId: user.id, roleId: userRole.id },
        defaults: { userId: user.id, roleId: userRole.id },
      });
    }

    await logEvent(EVENT_TYPES.USER_REGISTERED, {
      chatId: user.chatId,
      payload: { name: user.name, email: user.email },
    });

    const jwt = {
      chatId: user.chatId,
      email: user.email,
    };

    const accessToken = await generateAccessToken(jwt);
    const refreshToken = await generateRefreshToken(jwt);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.cookie('accessToken', accessToken, accessCookieOptions);

    return res.status(200).json({
      user: {
        id: user.id,
        chatId: user.chatId,
        name: user.name,
        email: user.email,
        color: user.color,
      },
      accessToken,
    });
  } catch (err) {
    console.error('Error registering with credentials:', err);
    return res.status(500).json({ error: 'Ошибка при регистрации' });
  }
});

// Авторизация по Email + Пароль
router.post('/auth/login-credentials', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = email?.trim()?.toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Укажите email и пароль' });
    }

    const user = await Users.findOne({ where: { email: normalizedEmail } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    if (user.banned) {
      return res.status(403).json({ error: 'Пользователь заблокирован', reason: user.banReason });
    }

    const jwt = {
      chatId: user.chatId,
      email: user.email,
    };

    const accessToken = await generateAccessToken(jwt);
    const refreshToken = await generateRefreshToken(jwt);

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.cookie('accessToken', accessToken, accessCookieOptions);

    return res.status(200).json({
      user: {
        id: user.id,
        chatId: user.chatId,
        name: user.name,
        email: user.email,
        color: user.color,
      },
      accessToken,
    });
  } catch (err) {
    console.error('Error during login with credentials:', err);
    return res.status(500).json({ error: 'Ошибка при входе' });
  }
});

// Привязка/смена Email и пароля для авторизованного пользователя
router.post('/auth/set-credentials', authenticateAccessToken, async (req, res) => {
  try {
    const chatId = req.user?.chatId;
    if (!chatId) {
      return res.status(401).json({ error: 'Требуется авторизация' });
    }

    const { email, password, currentPassword } = req.body || {};
    const normalizedEmail = email?.trim()?.toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Некорректный адрес электронной почты' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const user = await Users.findOne({ where: { chatId } });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Если у пользователя уже был задан пароль — требуем подтверждения текущего пароля
    if (user.password) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Введите текущий пароль для подтверждения' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Неверный текущий пароль' });
      }
    }

    const otherUser = await Users.findOne({ where: { email: normalizedEmail } });
    if (otherUser && otherUser.id !== user.id) {
      return res.status(409).json({ error: 'Этот email уже привязан к другому аккаунту' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await user.update({
      email: normalizedEmail,
      password: passwordHash,
    });

    return res.status(200).json({
      message: 'Email и пароль успешно сохранены',
      email: user.email,
    });
  } catch (err) {
    console.error('Error setting credentials:', err);
    return res.status(500).json({ error: 'Ошибка сохранения данных' });
  }
});

router.post('/auth/refresh-token', authLimiter, async (req, res) => {
  try {

    const {refreshToken} = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({error: 'Refresh token not provided'});
    }

    // Проверка Refresh Token
    const decoded = await verifyToken(refreshToken);

    // Ротация: только полезная нагрузка, без служебных полей старого токена (iat/exp)
    const payload = {chatId: decoded.chatId, photo: decoded.photo, email: decoded.email};

    // Создание новых токенов (ротация refresh)
    const accessToken = await generateAccessToken(payload);
    const newRefreshToken = await generateRefreshToken(payload);

    // Обновление Refresh Token в куки
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);
    res.cookie('accessToken', accessToken, accessCookieOptions);

    return res.status(200).json({accessToken, refreshToken: newRefreshToken});
  } catch (err) {
    console.error('Error refreshing tokens:', err);
    return res.status(401).json({error: 'Invalid refresh token'});
  }
});

router.post('/auth/access-token', authLimiter, async (req, res) => {
  try {

    const {refreshToken} = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({error: 'Refresh token not provided'});
    }

    // Проверка Refresh Token
    const decoded = await verifyToken(refreshToken);

    // Создание нового access-токена
    const payload = {chatId: decoded.chatId, photo: decoded.photo, email: decoded.email};
    const accessToken = await generateAccessToken(payload);

    res.cookie('accessToken', accessToken, accessCookieOptions);

    return res.status(200).json({accessToken});
  } catch (err) {
    console.error('Error refreshing tokens:', err);
    return res.status(401).json({error: 'Invalid refresh token'});
  }
});

router.post('/auth/logout', async (req, res) => {
  try {

    // Очистка кук (атрибуты должны совпадать с установленными)
    res.cookie('refreshToken', '', {...baseCookieOptions, expires: new Date(0)});
    res.cookie('accessToken', '', {...baseCookieOptions, expires: new Date(0)});

    return res.status(200).json({message: 'Logged out'});
  } catch (err) {
    console.error('Error logout:', err);
    return res.status(401).json({error: 'Logout not complete'});
  }
});

// Запрос на сброс пароля (по Email)
router.post('/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = email?.trim()?.toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Укажите адрес электронной почты' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Некорректный адрес электронной почты' });
    }

    const genericResponse = {
      message: 'Если указанный email зарегистрирован, ссылка для сброса пароля будет отправлена в течение нескольких минут.'
    };

    const user = await Users.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      // Защита от перебора email: одинаковый ответ
      return res.status(200).json(genericResponse);
    }

    if (user.banned) {
      return res.status(403).json({ error: 'Пользователь заблокирован', reason: user.banReason });
    }

    // Аннулируем все предыдущие активные токены сброса
    await PasswordResetTokens.update(
      { used: true },
      { where: { userId: user.id, used: false } }
    );

    // Генерируем новый токен
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await PasswordResetTokens.create({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    const frontUrl = process.env.URL_FRONT || 'https://vagclub21.ru';
    const resetUrl = `${frontUrl}/reset-password?token=${token}`;

    let deliveredVia = [];

    // 1. Отправка через Telegram бота авторизации VW21AuthBot (если привязан реальный аккаунт TG)
    const hasTelegram = user.chatId && Number(user.chatId) > 0;
    if (hasTelegram) {
      try {
        const { authBot, bot } = await import("../index.js");
        const targetBot = authBot || bot;
        const message = `🔑 <b>Сброс пароля на VAGClub21</b>\n\nЗдравствуйте, <b>${user.name || 'пользователь'}</b>!\nВы запросили сброс пароля для входа по email: <code>${user.email}</code>.\n\nДля создания нового пароля перейдите по ссылке:\n👉 <a href="${resetUrl}"><b>Сбросить пароль</b></a>\n\n⏳ <i>Ссылка действительна 1 час. Если это были не вы, просто проигнорируйте данное сообщение.</i>`;
        await targetBot.sendMessage(user.chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
        deliveredVia.push('telegram-authbot');
      } catch (tgErr) {
        console.error('[auth] Ошибка отправки ссылки через VW21AuthBot:', tgErr?.message);
        // Резервная попытка через основного бота
        try {
          const { bot } = await import("../index.js");
          if (bot) {
            await bot.sendMessage(user.chatId, message, {
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            });
            deliveredVia.push('telegram-mainbot');
          }
        } catch (fallbackErr) {
          console.error('[auth] Ошибка отправки ссылки в Telegram:', fallbackErr?.message);
        }
      }
    }

    // 2. Отправка через Email (если SMTP настроен)
    if (isEmailConfigured()) {
      try {
        await sendPasswordResetEmail({
          to: user.email,
          resetUrl,
          userName: user.name,
        });
        deliveredVia.push('email');
      } catch (mailErr) {
        console.error('[auth] Ошибка отправки email для сброса пароля:', mailErr?.message);
      }
    } else {
      console.warn(`[auth] SMTP не настроен. Токен для ${user.email} сгенерирован (resetUrl: ${resetUrl})`);
    }

    await logEvent(EVENT_TYPES.USER_UPDATED, {
      chatId: user.chatId,
      payload: { action: 'forgot_password_requested', deliveredVia },
    });

    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error('Error during forgot-password:', err);
    return res.status(500).json({ error: 'Ошибка при отправке ссылки для сброса пароля' });
  }
});

// Установка нового пароля по токену
router.post('/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Токен сброса пароля не передан' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    const resetToken = await PasswordResetTokens.findOne({
      where: {
        token,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: Users,
          as: 'user',
        },
      ],
    });

    if (!resetToken || !resetToken.user) {
      return res.status(400).json({
        error: 'Ссылка для сброса пароля недействительна или срок её действия истёк'
      });
    }

    const user = resetToken.user;
    if (user.banned) {
      return res.status(403).json({ error: 'Пользователь заблокирован', reason: user.banReason });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await user.update({ password: passwordHash });
    await resetToken.update({ used: true });

    await logEvent(EVENT_TYPES.USER_UPDATED, {
      chatId: user.chatId,
      payload: { action: 'password_reset_completed' },
    });

    return res.status(200).json({
      message: 'Пароль успешно обновлён! Теперь вы можете войти с новым паролем.'
    });
  } catch (err) {
    console.error('Error during reset-password:', err);
    return res.status(500).json({ error: 'Ошибка при установке нового пароля' });
  }
});

export default router;
