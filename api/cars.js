import express from "express";
import {cars} from "../utils/consts.js";
import logger from "../functions/logger.js";
import {v4 as uuidv4} from "uuid";
import fs from "fs";
import path from "path";
import resizeImage from "../functions/resizeImage.js";

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

      // Сохраняем
      await image.mv(filePath);

      const data = await resizeImage(filePath, carsDir, tempDir);

      if (data.optimizedFile) {
        /*try {
          await fs.unlink(filePath, err => {
            if (err) return console.log(err)
            console.log('Оригинал удален')
          })
        } catch (err) {
          console.log(err)
        }*/
        return res.json(data.optimizedFile);
      }
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
    const pathFile = path.resolve('img/cars', imageFile);

    await deleteFile(pathFile);

    return res.status(200).send(); // Отправляем пустой ответ с успешным статусом
  } catch (err) {
    logger("Ошибка удаления изображения", err);
    return res.status(500).send(err.message);
  }
});

export default router;
