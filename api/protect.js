import express from "express";
import {authenticateAccessToken, verifyToken} from "../services/auth.js";
import {updateUserInfo} from "../db/user-methods.js";
import {getUserInfo} from "../services/users.js";
import {updateUserCar} from "../services/cars.js";


export const protectRouter = express.Router();

protectRouter.use('/protect', (req, res, next) => {
  /*console.log('Request URL:', req.originalUrl);
  console.log('Request Type:', req.method);*/
  next();
});



export const validateData = async (req, res) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'jwt expired' });
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return res.status(401).json({ error: 'jwt invalid' });
  }

  return decoded;
}


protectRouter.use('/protect', authenticateAccessToken);

protectRouter.post('/protect/user', async (req, res) => {

  const hashData = await validateData(req, res);

  const userData = await getUserInfo(hashData.chatId);

  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json({ user: { data: userData, userPhoto: hashData.photo } });

  /*const accessToken = req.cookies.accessToken;

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

  res.status(200).json({ user: { data: userData, userPhoto: decoded.photo } });*/
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

  const update = await updateUserInfo(userChatId, data);

  return res.status(update.status).json({ text: update.text });
});

/*protectRouter.post('/protect/change-car-info', async (req, res) => {

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
});*/

export default protectRouter;
