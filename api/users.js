import express from "express";
import logger from "../functions/logger.js";
import {getAllUsers, updateUserInfo} from "../db/user-methods.js";
import {verifyToken} from "../functions/authorization.js";
import {createUser, getUserInfo, deleteUser, sendUserMessage,} from "../services/users.js";

const router = express.Router();


router.post("/create-user", async (req, res) => {
  try {
    const userData = req.body;

    const userChatId = userData.chat_id;
    const userName = userData.username;

    const checkUser = await getUserInfo(userChatId);

    if (checkUser !== null) {
      logger('Пользователь уже был создан')
      return res.status(409).json({
        message: 'Пользователь уже был создан',
      });
    } else {
      const resCreateUser = await createUser(userChatId, userName);

      if (Object.entries(resCreateUser).length) {
        return res.status(200).json({
          message: 'Пользователь создан',
        });
      } else {
        return res.status(500).json({
          message: 'Ошибка при создании пользователя',
        });
      }
    }
  } catch (err) {
    console.log(err);
    logger('Ошибка при создании пользователя', err);
    return res.status(500).json({
      message: 'Ошибка при создании пользователя',
    });
  }
})

router.post("/update-user", async (req, res) => {
  try {
    const userData = req.body;

    const userChatId = userData.chat_id;
    const userValues = userData.data;

    const update = await updateUserInfo(userChatId, userValues);

    // console.log(update)

    return res.status(update.status).send(update.text);

  } catch (err) {
    console.log('Ошибка обновления данных пользователя - ' + err);
    logger('Ошибка обновления данных пользователя', err);
    return res.status(500).send(err);
  }
})

router.post("/about-user", async (req, res) => {
  try {

    if (req.headers?.authorization) {

      const accessToken = req.headers.authorization.split('Bearer ')[1];

      const decoded = await verifyToken(accessToken);

      if (decoded.chatId) {
        const data = await getUserInfo(decoded.chatId);
        return res.status(200).send(data);
      }

    } else {
      const chatId = req.body.chatId;

      const data = await getUserInfo(chatId);
      return res.status(200).send(data);
    }
  } catch (err) {
    return res.status(500).send(err);
  }
})

router.post("/delete-user", async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const data = await deleteUser(chatId);
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send(err);
  }
})

router.post("/all-users", async (req, res) => {
  try {
    const data = await getAllUsers();
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send(err);
  }
})

router.post("/send-message", async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const message = req.body.message;

    const data = await sendUserMessage(chatId, message);
    return res.status(200).send(data);
  } catch (err) {
    return res.status(500).send(err);
  }
})

export default router;
