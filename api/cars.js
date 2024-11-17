import express from "express";
import {cars} from "../utils/consts.js";
import logger from "../functions/logger.js";
import {v4 as uuidv4} from "uuid";
import fs from "fs";
import path from "path";
import {access, constants} from "fs/promises";
import {getCarInfo, getUsersCars} from "../db/cars-methods.js";

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


router.get("/get-cars", async (req, res) => {
  try {
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

router.post("/upload", async (req, res) => {
  try {
    if (Object.values(req.files)[0].name) {
      const image = Object.values(req.files)[0];
      const format = image.name.split(".").pop();
      const imageFinalFile = `${uuidv4(image.name)}.${format}`;

      image.name = imageFinalFile;

      const carsDir = path.resolve("img/cars");
      const tempDir = path.resolve("img/temp");

      // Проверяем, существует ли директория
      if (!fs.existsSync(carsDir)) {
        // Если директория не существует, создаем её
        fs.mkdirSync(carsDir, {recursive: true});
      }

      if (!fs.existsSync(tempDir)) {
        // Если директория не существует, создаем её
        fs.mkdirSync(tempDir, {recursive: true});
      }

      const filePath = path.resolve(tempDir, imageFinalFile);

      // Сохраняем во временную папку
      await image.mv(filePath);

      const fileName = path.basename(filePath);
      return res.json(fileName);

      /*const data = await resizeImage(filePath, carsDir, tempDir);
      if (data.optimizedFile) {
        return res.json(data.optimizedFile);
      }*/
    }
  } catch (err) {
    console.log(err)
    logger("Ошибка загрузки изображения", err);
    res.status(500).send(err);
  }
});

router.post("/upload/remove", async (req, res) => {
  try {
    const imageFile = req.body.fileName;
    const pathFile = path.resolve('img/temp', imageFile);

    await access(pathFile, constants.F_OK);
    await deleteFile(pathFile);

    return res.status(200).send(); // Отправляем пустой ответ с успешным статусом
  } catch (err) {
    logger("Ошибка удаления изображения", err);
    return res.status(500).send(err.message);
  }
});


export default router;
