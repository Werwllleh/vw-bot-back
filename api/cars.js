import express from "express";
import {BRANDS, MODELS} from "../utils/consts.js";
import logger from "../functions/logger.js";
import {v4 as uuidv4} from "uuid";
import fs from "fs";
import path from "path";
import {access, constants} from "fs/promises";
import {createUserCar, deleteUserCar, getCarInfo, getUsersCars, resizedRegImages} from "../db/cars-methods.js";
import {Cars} from "../models.js";
import resizeImage from "../functions/resizeImage.js";

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

router.post("/upload", async (req, res) => {
  try {

    const downloadType = req.body.downloadType;
    const chat_id = req.body.chat_id;
    const car_id = req.body.car_id;

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

      if (downloadType !== 'non-stop') {
        return res.json(fileName);
      } else {

        if (chat_id && car_id) {
          const carsDir = path.resolve("img/cars");
          const tempDir = path.resolve("img/temp");

          const compressImage = await resizeImage(filePath, carsDir, tempDir);

          if (compressImage.optimizedFile) {

            const car = await Cars.findByPk(car_id);

            if (car) {
              let imagesArr = JSON.parse(car.car_images);
              imagesArr.push(compressImage.optimizedFile);

              await car.update({car_images: JSON.stringify(imagesArr)});
            }
          }

          return res.status(200).send();

        }
      }


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

    const chat_id = req.body?.data?.chat_id;
    const car_id = req.body?.data?.car_id;

    if (chat_id && car_id) {
      // const user = await getUserInfo(chat_id);
      const pathFile = path.resolve('img/cars', imageFile);

      await access(pathFile, constants.F_OK, async (err) => {
        if (!err) {
          const car = await Cars.findByPk(car_id);

          if (Number(car.chat_id) === Number(chat_id) || Number(chat_id) === Number(adminId)) {
            let images = JSON.parse(car.car_images);
            images.splice(images.indexOf(imageFile), 1);
            await car.update({car_images: JSON.stringify(images)});

            await deleteFile(pathFile);
            return res.status(200).send(); // Отправляем пустой ответ с успешным статусом
          }
        }
      });
    } else {
      const pathFile = path.resolve('img/temp', imageFile);
      await deleteFile(pathFile);

      return res.status(200).send(); // Отправляем пустой ответ с успешным статусом
    }

  } catch (err) {
    logger("Ошибка удаления изображения", err);
    return res.status(500).send(err.message);
  }
});


export default router;
