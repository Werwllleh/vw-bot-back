import express from "express";
import {AuthDataValidator} from "@telegram-auth/server";
import {objectToAuthDataMap} from "@telegram-auth/server/utils";
import {generateAccessToken, generateRefreshToken, verifyToken} from "../functions/authorization.js";


const router = express.Router();

router.post('/auth/login', async (req, res) => {
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
    res.cookie('refreshToken', refreshToken, {
      domain: process.env.URL_COOKIE_DOMAIN,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.cookie('accessToken', accessToken, {
      domain: process.env.URL_COOKIE_DOMAIN,
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 15 мин
    });

    return res.status(200).send();
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).send({error: 'Internal server error'});
  }
});

router.post('/auth/refresh-token', async (req, res) => {
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
    res.cookie('refreshToken', newRefreshToken, {
      domain: process.env.URL_COOKIE_DOMAIN,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.cookie('accessToken', accessToken, {
      domain: process.env.URL_COOKIE_DOMAIN,
      sameSite: 'strict',
      maxAge: 2 * 60 * 1000,
    });


    return res.status(200).send();
  } catch (err) {
    console.error('Error refreshing tokens:', err);
    return res.status(401).send({error: 'Invalid refresh token'});
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

    res.cookie('accessToken', accessToken, {
      domain: process.env.URL_COOKIE_DOMAIN,
      sameSite: 'strict',
      maxAge: 2 * 60 * 1000,
    });

    return res.status(200).send();
  } catch (err) {
    console.error('Error refreshing tokens:', err);
    return res.status(401).send({error: 'Invalid refresh token'});
  }
});

router.post('/auth/logout', async (req, res) => {
  try {

    // Обновление Refresh Token в куки
    res.cookie('refreshToken', '', {
      domain: process.env.URL_COOKIE_DOMAIN,
      sameSite: 'strict',
      expires: new Date(0),
    });

    res.cookie('accessToken', '', {
      domain: process.env.URL_COOKIE_DOMAIN,
      sameSite: 'strict',
      expires: new Date(0),
    });

    return res.status(200).send();
  } catch (err) {
    console.error('Error logout:', err);
    return res.status(401).send({error: 'Logout not complete'});
  }
});


export default router;
