import express from "express";
import {verifyToken} from "../functions/authorization.js";
import {getAllUsers, getUserInfo, deleteUser, sendUserMessage, updateUserInfo} from "../db/user-methods.js";

const protectRouter = express.Router();

protectRouter.use('/protect', (req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  console.log('Request Type:', req.method);
  next();
});

export const authenticateAccessToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'jwt expired' });
    }

    const accessToken = authHeader.split(' ')[1];

    try {
      // Проверяем токен на валидность
      const decoded = await verifyToken(accessToken);
      req.user = decoded; // Сохраняем данные пользователя в объекте запроса
      return next(); // Продолжаем выполнение маршрута
    } catch (tokenError) {
      return res.status(403).json({ error: 'jwt no verified' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'jwt expired' });
  }
};

protectRouter.use('/protect', authenticateAccessToken);

protectRouter.post('/protect/user', async (req, res) => {

  if (req.headers?.authorization) {
    const accessToken = req.headers.authorization.split('Bearer ')[1];
    const decoded = await verifyToken(accessToken);

    if (!decoded) {
      return res.status(401).json({ error: 'jwt invalid' });
    }

    const userData = await getUserInfo(decoded.chatId);

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: { data: userData, userPhoto: decoded.photo } });

  }
});

export default protectRouter;
