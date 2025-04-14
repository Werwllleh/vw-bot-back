import express from "express";
import {getAuthorizationField, verifyToken} from "../functions/authorization.js";
import {getAllUsers, getUserInfo, deleteUser, sendUserMessage, updateUserInfo} from "../db/user-methods.js";
import {updateUserCar} from "../db/cars-methods.js";

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

  const accessToken = getAuthorizationField(req);

  if (!accessToken) {
    return res.status(401).json({ error: 'jwt expired' });
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return res.status(401).json({ error: 'jwt invalid' });
  }

  const userData = await getUserInfo(decoded.chatId);

  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: { data: userData, userPhoto: decoded.photo } });
});

protectRouter.post('/protect/update-user', async (req, res) => {

  const accessToken = getAuthorizationField(req);

  if (!accessToken) {
    return res.status(401).json({ error: 'jwt expired' });
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return res.status(401).json({ error: 'jwt invalid' });
  }

  const userChatId = decoded.chatId;
  const {data} = req.body;

  console.log(userChatId)
  console.log(data)

  const update = await updateUserInfo(userChatId, data);

  console.log(update);

  return res.status(update.status).json({ text: update.text });
});

protectRouter.post('/protect/change-car-info', async (req, res) => {

  const accessToken = getAuthorizationField(req);

  if (!accessToken) {
    return res.status(401).json({ error: 'jwt expired' });
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return res.status(401).json({ error: 'jwt invalid' });
  }

  const userChatId = decoded.chatId;
  const {carId, data} = req.body;

  const updateCarStatus = await updateUserCar(userChatId, carId, data);

  res.status(updateCarStatus.status).send(updateCarStatus.text);
});

export default protectRouter;
