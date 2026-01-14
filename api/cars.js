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
import {addUserCar, getUserCar, otherCars, updateUserCar} from "../services/cars.js";
import {Cars, CarsImages} from "../models.js";

const adminId = process.env.ADMIN;

const router = express.Router();

router.post("/add-car", authenticateAccessToken, async (req, res) => {
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

router.post("/update-car", authenticateAccessToken, async (req, res) => {
  try {

    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;

    const carId = req.body.carId;
    const newCarInfo = req.body.data;

    if (!chatId || !carId || !newCarInfo || !Object.values(newCarInfo).length) {
      return res.status(400).json({ message: "Некорректные данные" });
    }

    try {
      const checkCarData = await getUserCar(null, carId);

      if (String(chatId) !== checkCarData.chatId) {
        return res.status(403).json({
          message: "Нет доступа",
        });
      }

      const update = await updateUserCar(carId, newCarInfo);

      if (update) {
        return res.status(200).json({
          message: "Данные обновлены",
        });
      } else {
        return res.status(500).json({
          message: "Что-то пошло не так",
        });
      }

    } catch (error) {
      console.error("Ошибка при обновлении авто:", error);
      return res.status(500).json({
        message: "Произошла ошибка, попробуйте позже",
      });
    }
  } catch (e) {
    console.error("Ошибка в update-car маршруте:", e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/delete-car", authenticateAccessToken, async (req, res) => {
  try {
    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;

    const carId = req.body.carId;

    if (!chatId || !carId) {
      return res.status(400).json({ message: "Некорректные данные" });
    }

    try {
      const carData = await getUserCar(null, carId);

      if (!carData) {
        return res.status(404).json({
          message: "Авто не найдено",
        });
      }

      if (String(chatId) !== carData.chatId) {
        return res.status(403).json({
          message: "Нет доступа",
        });
      }

      if (carData.carsImages.length) {
        for (const img of carData.carsImages) {
          const imgPath = path.resolve("upload/image", img.source);

          if (fs.existsSync(imgPath)) {
            try {
              fs.unlinkSync(imgPath);
            } catch (err) {
              console.error("Ошибка удаления файла:", err);
            }
          }
        }
      }

      await CarsImages.destroy({
        where: { carId: carData.id }
      });

      await Cars.destroy({
        where: { id: carData.id }
      });

      return res.status(200).json({
        message: "Автомобиль удалён",
        carId: carData.id
      });

    } catch (error) {
      console.error("Ошибка при удалении авто:", error);
      return res.status(500).json({
        message: "Произошла ошибка, попробуйте позже",
      });
    }

  } catch (e) {
    console.error("Ошибка в delete-car маршруте:", e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

router.post("/car-info", async (req, res) => {
  try {

    const {carId, carNumber} = req.body;

    if (!carId && !carNumber) {
      return res.status(400).json({ message: "Данные для поиска не переданы" });
    }

    try {
      const carData = await getUserCar(carNumber, carId);

      if (!carData) {
        return res.status(404).json({
          message: "Авто не найдено",
        });
      }

      return res.status(200).json(carData);

    } catch (error) {
      console.error("Ошибка при поиске авто:", error);
      return res.status(500).json({
        message: "Произошла ошибка, попробуйте позже",
      });
    }

  } catch (e) {
    console.error("Ошибка в car-info маршруте:", e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
})

router.post("/other-cars", async (req, res) => {
  try {

    const {count} = req.body;

    try {
      const otherCarsData = await otherCars(count);

      if (!otherCarsData) {
        return res.status(404).json({
          message: "Авто не найдено",
        });
      }

      return res.status(200).json(otherCarsData);

    } catch (error) {
      console.error("Ошибка при поиске автомобилей:", error);
      return res.status(500).json({
        message: "Произошла ошибка, попробуйте позже",
      });
    }

  } catch (e) {
    console.error("Ошибка в other-cars маршруте:", e);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
})


/*router.post("/delete-car", async (req, res) => {
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
});*/

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
router.get('/cars', async (req, res) => {
  try {
    const { number, page = 1, limit = 20 } = req.query;

    const result = await getUsersCars({
      number,
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
