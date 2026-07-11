import express from "express";
import logger from "../functions/logger.js";
import {getAllUsers, updateUserInfo} from "../db/user-methods.js";
import {authenticateAccessToken, verifyToken} from "../services/auth.js";
import {createUser, getUserInfo, deleteUser, sendUserMessage, userCarsData, updateUser,} from "../services/users.js";
import {validateData} from "./protect.js";

const router = express.Router();


router.post("/create-user", authenticateAccessToken, async (req, res) => {
  try {

    const hashData = await validateData(req, res);

    const userData = req.body.data;

    const chatId = hashData.chatId;
    const name = userData.name.trim();
    const instagram = userData?.instagram.trim() || null;

    if (!chatId) {
      return res.status(500).json({
        message: 'Ошибка при создании пользователя',
      });
    }

    const checkUser = await getUserInfo(chatId);

    if (checkUser !== null) {
      logger('Пользователь уже был создан')
      return res.status(409).json({
        message: 'Пользователь уже был создан',
      });
    } else {

      if (!name) {
        return res.status(500).json({
          message: 'Имя не указано',
        });
      }

      const payload = {
        chatId: chatId,
        name: name,
        instagram: instagram,
      }

      const resCreateUser = await createUser(payload);


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
    logger('Ошибка при создании пользователя', err);
    return res.status(500).json({
      message: 'Ошибка при создании пользователя',
    });
  }
})

router.post("/user-cars", authenticateAccessToken, async (req, res) => {
  try {

    const hashData = await validateData(req, res);

    const userData = req.body.data;

    const chatId = hashData.chatId;

    if (!chatId) {
      return res.status(500).json({
        message: 'Ошибка при получении данных пользователя',
      });
    }

    const data = await userCarsData(chatId);

    if (data.length) {
      return res.status(200).json(data);
    } else {
      return res.status(200).json(null);
    }
  } catch (err) {
    console.log(err);
    logger('Ошибка при получении авто пользователя', err);
    return res.status(500).json({
      message: 'Ошибка при получении авто пользователя',
    });
  }
})

router.post("/update-user", authenticateAccessToken, async (req, res) => {
  try {
    const hashData = await validateData(req, res);

    const userData = req.body.data;

    const chatId = hashData.chatId;
    const name = userData.name.trim();
    const instagram = userData?.instagram.trim() || null;

    if (!chatId) {
      return res.status(500).json({
        message: 'Ошибка при обновлении пользователя',
      });
    }

    const checkUser = await getUserInfo(chatId);

    if (!checkUser) {
      return res.status(500).json({
        message: 'Пользователь не найден',
      });
    }

    if (!name) {
      return res.status(500).json({
        message: 'Имя не указано',
      });
    }

    const payload = {
      name: name,
      instagram: instagram,
    }

    const resUpdateUser = await updateUser(chatId, payload);

    if (Object.entries(resUpdateUser).length) {
      return res.status(200).json({
        message: 'Данные обновлены',
      });
    } else {
      return res.status(500).json({
        message: 'Ошибка при обновлении пользователя',
      });
    }
  } catch (err) {
    logger('Ошибка при обновлении пользователя', err);
    return res.status(500).json({
      message: 'Ошибка при обновлении пользователя',
    });
  }
})

router.post("/attach-company", authenticateAccessToken, async (req, res) => {
  try {

    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;

    if (!chatId) {
      return res.status(500).json({
        message: 'Ошибка при прикреплении компании',
      });
    }

    const checkUser = await getUserInfo(chatId);

  } catch (err) {
    logger('Ошибка при прикреплении компании', err);
    return res.status(500).json({
      message: 'Ошибка при прикреплении компании',
    });
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
