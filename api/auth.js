import express from "express";
import {AuthDataValidator} from "@telegram-auth/server";
import {objectToAuthDataMap} from "@telegram-auth/server/utils";
import {generateAccessToken, generateRefreshToken, verifyToken} from "../functions/authorization.js";


const router = express.Router();

/*
router.post("/validate-user", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    const validator = new AuthDataValidator({
      botToken: process.env.BOT_AUTH_TOKEN,
    });

    const userData = objectToAuthDataMap(data);

    const result = await validator.validate(userData);

    if (!result) {
      return res.status(401).json({ error: 'Invalid hash' });
    }

    // Возвращаем данные пользователя
    return res.status(200).send(result);

  } catch (err) {
    console.error('Error validating user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
})
*/

router.post('/auth/login', async (req, res) => {
  try {

    const {data} = req.body;

    const validator = new AuthDataValidator({
      botToken: process.env.BOT_AUTH_TOKEN,
    });

    const userData = objectToAuthDataMap(data);

    console.log(userData);

    const result = await validator.validate(userData);

    if (!result) {
      return res.status(401).json({error: 'Invalid hash'});
    }

    const jwt = {
      chatId: result.id,
      photo: result.photo_url,
      hash: result.hash,
    }

    // Создание токенов
    const accessToken = await generateAccessToken(jwt);
    const refreshToken = await generateRefreshToken(jwt);

    // Отправка токенов
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      domain: '.vagclub21.ru',
      sameSite: 'strict',
      secure: true, // Обязательно для sameSite: 'none'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: false,
      domain: '.vagclub21.ru',
      sameSite: 'strict',
      secure: true, // Только для HTTPS
      maxAge: 60 * 60 * 1000, // 15 мин
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).send({error: 'Internal server error'});
  }
});

router.post('/auth/access-token', async (req, res) => {
  try {
    const {refreshToken} = req.cookies;

    if (!refreshToken) {
      return res.status(401).send({error: 'Refresh token not provided'});
    }

    // Проверка Refresh Token
    const decoded = await verifyToken(refreshToken);

    // Создание новых токенов
    const accessToken = await generateAccessToken(decoded);
    const newRefreshToken = await generateRefreshToken(decoded);

    // Обновление Refresh Token в куки
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      domain: '.vagclub21.ru',
      sameSite: 'strict',
      secure: true, // Обязательно для sameSite: 'none'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: false,
      domain: '.vagclub21.ru',
      sameSite: 'strict',
      secure: true, // Только для HTTPS
      maxAge: 60 * 60 * 1000, // 15 мин
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error('Error refreshing tokens:', err);
    return res.status(401).send({error: 'Invalid refresh token'});
  }
});


export default router;
