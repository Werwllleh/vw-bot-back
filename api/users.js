import express from "express";
import logger from "../functions/logger.js";
import {Cars, Users} from "../models.js";
import {getAllUsers, getUserInfo} from "../db/user-methods.js";
import {getRandomColor} from "../functions/randomColor.js";
import resizeImage from "../functions/resizeImage.js";
import path from "path";
import fs from "fs";


const router = express.Router();

//создание пользователя в БД
export const createUser = async (chatId, data) => {
  try {
    return await Users.create({
      chat_id: chatId,
      user_name: data.name.trim(),
      user_color: getRandomColor()
    });
  } catch (error) {
    console.error('Ошибка при создании пользователя', error);
  }
}

//Фотки перемешаются в основную директорию только после успешной регистрации
const resizedRegImages = async (imagesArray) => {
  const carsDir = path.resolve("img/cars");
  const tempDir = path.resolve("img/temp");

  if (!fs.existsSync(carsDir)) {
    fs.mkdirSync(carsDir, { recursive: true });
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  let resizedImages = [];

  const parsedImages = JSON.parse(imagesArray);
  if (parsedImages.length) {
    for (const image of parsedImages) {
      const filePath = path.resolve(tempDir, image);
      const compressImage = await resizeImage(filePath, carsDir, tempDir);

      if (compressImage) {
        resizedImages.push(compressImage.optimizedFile);
      }
    }
  }

  return resizedImages;
};

//добавление авто пользователя в БД
export const createUserCar = async (chatId, cars) => {
  try {
    if (cars.length) {
      for (const car of cars) {
        const images = await resizedRegImages(car.images);

        if (images.length) {
          await Cars.create({
            car_brand: car.brand,
            car_model: car.model,
            car_year: car.car_year.trim(),
            car_number: car.car_number.trim().toUpperCase(),
            car_note: car.notation,
            car_images: JSON.stringify(images),
            chat_id: chatId,
          });
        }
      }
    }
  } catch (error) {
    console.error('Ошибка при создании авто', error);
  }
};


router.post("/create-user", async (req, res) => {
  try {
    const userData = req.body.data;

    if (userData) {

      const userChatId = userData.user.chatId;
      const userName = userData.user.name;

      const checkUser = await getUserInfo(userChatId);

      //проверяем есть ли пользователь
      if (!checkUser) {
        await createUser(userChatId, userData.user);
        await createUserCar(userChatId, userData.cars);

        return res.status(200).send("OK");
      } else {
        // await createUserCar(userChatId, userData.cars);
        // return res.status(200).send("OK");
        return res.status(200).send("User already exists");
      }
    }
  } catch (err) {
    console.log('Ошибка при создании пользователя - ' + err);
    logger('Ошибка при создании пользователя', err);
    return res.status(500).send(err);
  }
})

router.post("/about-user", async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const data = await getUserInfo(chatId);
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

export default router;
