import express from "express";
import logger from "../functions/logger.js";
import {Users} from "../models.js";
import {getAllUsers, getUserInfo, deleteUser, sendUserMessage, updateUserInfo} from "../db/user-methods.js";
import {getRandomColor} from "../functions/randomColor.js";
import {verifyToken} from "../functions/authorization.js";

const adminId = process.env.ADMIN;


const router = express.Router();

//создание пользователя в БД
export const createUser = async (chatId, userName) => {
  try {
    return await Users.create({
      chat_id: chatId,
      user_name: userName.trim(),
      user_color: getRandomColor(),
      user_admin: String(chatId) === String(adminId),
    });
  } catch (error) {
    console.error('Ошибка при создании пользователя', error);
  }
}


router.post("/create-user", async (req, res) => {
  try {
    const userData = req.body;

    const userChatId = userData.chat_id;
    const userName = userData.username;

    console.log(userData)


    const checkUser = await getUserInfo(userChatId);

    if (checkUser) {
      logger('Пользователь уже был создан')
      return res.status(500).json({
        message: 'User was created',
        success: false,
      });
    } else {
      await createUser(userChatId, userName)
        .then(() => {
          return res.status(200).send(true);
        })
        .catch((err) => {
          logger('Ошибка создания пользователя', err)
          return res.status(500).send(false).message('error user create');
        })
    }


    /*if (userData) {

      const userChatId = userData.user.chatId;
      const userName = userData.user.name;

      const checkUser = await getUserInfo(userChatId);

      //проверяем есть ли пользователь
      if (!checkUser) {
        await createUser(userChatId, userData.user);
        await createUserCar(userChatId, userData.car);

        return res.status(200).send("OK");
      } else {
        // await createUserCar(userChatId, userData.cars);
        // return res.status(200).send("OK");
        return res.status(200).send("User already exists");
      }
    }*/
  } catch (err) {
    console.log('Ошибка при создании пользователя - ' + err);
    logger('Ошибка при создании пользователя', err);
    return res.status(500).send(err);
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
