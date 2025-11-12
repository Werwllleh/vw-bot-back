import express from "express";
import {AUTOMOBILES, BRANDS, MODELS} from "../utils/consts.js";
import logger from "../functions/logger.js";
import {v4 as uuidv4} from "uuid";
import fs from "fs";
import path from "path";
import {
  deleteUserCar,
  getCarInfo,
  getUsersCars,
} from "../db/cars-methods.js";
import {authenticateAccessToken} from "../services/auth.js";
import {validateData} from "./protect.js";
import {addUserCar, getUserCar, updateUserCar} from "../services/cars.js";

const adminId = process.env.ADMIN;

const router = express.Router();

router.post("/protect/add-car", authenticateAccessToken, async (req, res) => {
  try {

    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;

    const carInfo = req.body;

    if (!chatId || !carInfo || !Object.values(carInfo).length) {
      return res.status(400).json({ message: "Некорректные данные" });
    }

    try {
      const checkCarData = await getUserCar(carInfo.number);

      if (!checkCarData) {
        const data = await addUserCar(chatId, carInfo);
        return res.status(200).json({
          carId: data.id
        });
      } else {
        return res.status(409).json({
          carId: checkCarData.id,
          message: "Данный номер авто уже зарегистрирован, добавьте фото",
        });
      }
    } catch (error) {
      /*if (error?.name === "SequelizeUniqueConstraintError" || error?.original?.code === "23505") {
        return res.status(409).json({
          message: "Данный номер авто уже зарегистрирован, добавьте фото",
        });
      }*/

      console.error("Ошибка при добавлении авто:", error);
      return res.status(500).json({
        message: "Произошла ошибка, попробуйте позже",
      });
    }
  } catch (e) {
    console.error("Ошибка в add-car маршруте:", e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/protect/update-car", authenticateAccessToken, async (req, res) => {
  try {

    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;

    const newCarInfo = req.body;

    if (!chatId || !newCarInfo || !Object.values(newCarInfo).length) {
      return res.status(400).json({ message: "Некорректные данные" });
    }

    try {
      const checkCarData = await updateUserCar(newCarInfo.number);

      if (chatId !== checkCarData.chatId) {
        return res.status(403).json({
          message: "Нет доступа",
        });
      }

      await updateUserCar(chatId, newCarInfo);

      if (!checkCarData) {

        return res.status(200);
      } else {
        return res.status(409).json({
          message: "Данный номер авто уже зарегистрирован, добавьте фото",
        });
      }
    } catch (error) {
      /*if (error?.name === "SequelizeUniqueConstraintError" || error?.original?.code === "23505") {
        return res.status(409).json({
          message: "Данный номер авто уже зарегистрирован, добавьте фото",
        });
      }*/

      console.error("Ошибка при добавлении авто:", error);
      return res.status(500).json({
        message: "Произошла ошибка, попробуйте позже",
      });
    }
  } catch (e) {
    console.error("Ошибка в add-car маршруте:", e);
    return res.status(500).json({ message: "Ошибка сервера" });
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

router.get("/register-cars", async (req, res) => {
  try {
    return res.json({
      brands: BRANDS,
      models: MODELS
    });
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
      const updateCarStatus = await updateUserCar(chatId, carData);

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
