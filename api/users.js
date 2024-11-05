import express from "express";
import logger from "../functions/logger.js";
import {Cars, Users} from "../models.js";


const router = express.Router();

export const createUser = async (chatId, data) => {
  try {
    return await Users.create({
      chat_id: chatId,
      user_name: data.name.trim()
    });
  } catch (error) {
    console.error('Ошибка при создании пользователя', error);
  }
}

export const createUserCar = async (chatId, cars) => {
  try {
    if (cars.length) {
      cars.map(async (car) => {
        return await Cars.create({
          car_brand: car.brand,
          car_model: car.model,
          car_year: car.car_year,
          car_number: car.car_number,
          car_note: car.notation,
          car_images: car.images,
          chat_id: chatId,
        });
      })
    }
  } catch (error) {
    console.error('Ошибка при создании авто', error);
  }
}

router.post("/create-user", async (req, res) => {
  try {
    const userData = req.body.data;

    if (userData) {
      console.log(userData);

      const userChatId = userData.user.chatId;
      const userName = userData.user.name;

      console.log(userChatId)

      await createUser(userChatId, userData.user);
      await createUserCar(userChatId, userData.cars);

      return res.status(200).send("OK");
    }

  } catch (err) {
    console.log('Ошибка при создании пользователя - ' + err);
    logger('Ошибка при создании пользователя', err);
    return res.status(500).send(err);
  }
})

export default router;
