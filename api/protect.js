import express from "express";
import {verifyToken} from "../functions/authorization.js";
import {getUserInfo, updateUserInfo} from "../db/user-methods.js";
import {updateUserCar} from "../db/cars-methods.js";
import {getPartner, getPartners, getPartnersForUsers} from "../db/partners-methods.js";

const protectRouter = express.Router();

protectRouter.use('/protect', (req, res, next) => {
  /*console.log('Request URL:', req.originalUrl);
  console.log('Request Type:', req.method);*/
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
      req.user = await verifyToken(accessToken); // Сохраняем данные пользователя в объекте запроса
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

  const accessToken = req.cookies.accessToken;

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

  res.status(200).json({ user: { data: userData, userPhoto: decoded.photo } });
});

protectRouter.post('/protect/update-user', async (req, res) => {

  const {accessToken} = req.cookies;

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

  const {accessToken} = req.cookies;

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

protectRouter.post('/protect/partners', async (req, res) => {

  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'jwt expired' });
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return res.status(401).json({ error: 'jwt invalid' });
  }

  const partners = await getPartners();

  if (!partners) {
    return res.status(404).json({ error: 'Partners not found' });
  }

  res.status(200).json(partners);
});

protectRouter.post('/protect/partner', async (req, res) => {

  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'jwt expired' });
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return res.status(401).json({ error: 'jwt invalid' });
  }

  const {slug} = req.body;


  const partner = await getPartner(slug);

  if (!partner) {
    return res.status(404).json({ error: 'Partner not found' });
  }

  res.status(200).json(partner);
});

export default protectRouter;
