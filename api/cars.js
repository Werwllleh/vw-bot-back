import express from "express";
import {BRANDS, MODELS} from "../utils/consts.js";
import logger from "../functions/logger.js";
import {v4 as uuidv4} from "uuid";
import fs from "fs";
import path from "path";
import {
  createUserCar,
  deleteUserCar,
  getCarInfo,
  getUsersCars,
  updateUserCar
} from "../db/cars-methods.js";
import {Cars} from "../models.js";
import resizeImage from "../functions/resizeImage.js";
import {sendIndividualMessage} from "../functions/sendIndividualMessage.js";

const adminId = process.env.ADMIN;

const router = express.Router();

export const deleteFile = async (imageFile) => {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.access(path.resolve(imageFile), (err) => {
        if (err) {
          console.log("Ошибка удаления изображения, файл не найден", err)
          logger("Ошибка удаления изображения, файл не найден", err);
          return reject(err);
        }
        fs.unlink(path.resolve(imageFile), (err) => {
          if (err) {
            console.log("Ошибка удаления изображения", err)
            logger("Ошибка удаления изображения", err);
            return reject(err);
          }
          resolve();
        });
      });
    } catch (err) {
      console.log("Ошибка при удалении изображения", err)
      logger("Ошибка при удалении изображения", err);
    }
  });
};

router.post("/add-car", async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const carData = req.body.data;

    if (chatId && carData) {
      await createUserCar(chatId, carData)
        .then(() => {
          sendIndividualMessage(process.env.ADMIN, `Новый авто: ${carData?.brand} ${carData?.model} - ${carData?.carNumber.trim().toUpperCase()} `)
          return res.status(200).send("OK")
        })
        .catch(() => {
          return res.status(500).send("Ошибка при добавлении авто")
        })
    }


  } catch (e) {
    return res.status(500).send(e);
  }
});

router.post("/delete-car", async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const carId = req.body.carId;

    if (chatId && carId) {
      await deleteUserCar(chatId, carId)
        .then(() => {
          return res.status(200).send("OK")
        })
        .catch(() => {
          return res.status(500).send("Ошибка при удалении авто")
        })
    }


  } catch (e) {
    return res.status(500).send(e);
  }
});

router.get("/get-cars", async (req, res) => {
  try {
    const cars = {
      brands: BRANDS,
      models: MODELS
    }
    return res.json(cars);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/get-car-info", async (req, res) => {
  try {
    const car_number = req.body.car_number;
    const car = await getCarInfo(car_number);

    console.log(car)
    return res.status(200).send(car);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/get-users-cars", async (req, res) => {
  try {
    const cars = await getUsersCars();

    return res.status(200).send(cars);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/change-car-data", async (req, res) => {
  try {
    const chatId = req.body.chatId;
    const carId = req.body.carId;
    const carData = req.body.data;

    if (chatId && carId && carData) {
      const updateCarStatus = await updateUserCar(chatId, carId, carData);

      res.status(updateCarStatus.status).send(updateCarStatus.text);
    }


  } catch (e) {
    return res.status(500).send(e);
  }
});


//site
router.get("/cars", async (req, res) => {
  try {

    const number = req.query.number;

    if (number) {
      const cars = await getUsersCars(number);
      return res.status(200).send(cars);
    }

    const cars = await getUsersCars();
    return res.status(200).send(cars);
  } catch (e) {
    res.status(500).send(e);
  }
});

export default router;
