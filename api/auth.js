import express from "express";
import {AuthDataValidator} from "@telegram-auth/server";
import {objectToAuthDataMap} from "@telegram-auth/server/utils";
import {generateAccessToken, generateRefreshToken, verifyToken} from "../services/auth.js" ;
import {authLimiter} from "../functions/rateLimit.js";


const router = express.Router();

// Базовые опции кук: httpOnly (недоступны из JS → защита от кражи через XSS),
// secure (только по HTTPS), sameSite strict. domain — общий для поддоменов *.vagclub21.
const baseCookieOptions = {
  domain: process.env.URL_COOKIE_DOMAIN,
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
};

const refreshCookieOptions = {
  ...baseCookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
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

    return res.status(200).send();
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).send({error: 'Internal server error'});
  }
});

router.post('/auth/refresh-token', authLimiter, async (req, res) => {
  try {

    const {refreshToken} = req.cookies;

    if (!refreshToken) {
      return res.status(401).send({error: 'Refresh token not provided'});
    }

    // Проверка Refresh Token
    const decoded = await verifyToken(refreshToken);

    // Ротация: только полезная нагрузка, без служебных полей старого токена (iat/exp)
    const payload = {chatId: decoded.chatId, photo: decoded.photo};

    // Создание новых токенов (ротация refresh)
    const accessToken = await generateAccessToken(payload);
    const newRefreshToken = await generateRefreshToken(payload);

    // Обновление Refresh Token в куки
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);
    res.cookie('accessToken', accessToken, accessCookieOptions);

    return res.status(200).send();
  } catch (err) {
    console.error('Error refreshing tokens:', err);
    return res.status(401).send({error: 'Invalid refresh token'});
  }
});

router.post('/auth/access-token', authLimiter, async (req, res) => {
  try {

    const {refreshToken} = req.cookies;

    if (!refreshToken) {
      return res.status(401).send({error: 'Refresh token not provided'});
    }

    // Проверка Refresh Token
    const decoded = await verifyToken(refreshToken);

    // Создание нового access-токена
    const payload = {chatId: decoded.chatId, photo: decoded.photo};
    const accessToken = await generateAccessToken(payload);

    res.cookie('accessToken', accessToken, accessCookieOptions);

    return res.status(200).send();
  } catch (err) {
    console.error('Error refreshing tokens:', err);
    return res.status(401).send({error: 'Invalid refresh token'});
  }
});

router.post('/auth/logout', async (req, res) => {
  try {

    // Очистка кук (атрибуты должны совпадать с установленными)
    res.cookie('refreshToken', '', {...baseCookieOptions, expires: new Date(0)});
    res.cookie('accessToken', '', {...baseCookieOptions, expires: new Date(0)});

    return res.status(200).send();
  } catch (err) {
    console.error('Error logout:', err);
    return res.status(401).send({error: 'Logout not complete'});
  }
});


export default router;
