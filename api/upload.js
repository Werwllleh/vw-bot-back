import express from "express";
import path from "path";
import fs from "fs";
import {Cars} from "../models.js";
import logger from "../functions/logger.js";
import {deleteFile} from "./cars.js";
import {fileProcessing} from "../services/upload.js";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {

    const uploadDir = path.resolve("upload");

    // Если директории не существует, создаем её
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {recursive: true});
    }

    const chatId = req.body.chatId;
    const car_id = req.body.carId;

    if (!req.files) return;

    if (Object.values(req.files)[0].length) {

      const uploadData = Object.values(req.files)[0];

      uploadData.map((file) => {
        fileProcessing(file)
      })
    } else {
      const file = Object.values(req.files)[0];
      await fileProcessing(file)
    }

    return res.status(200).json({
      message: "Отправлено",
    });

    /*if (Object.values(req.files)[0].name) {
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


      /!*const data = await resizeImage(filePath, carsDir, tempDir);
      if (data.optimizedFile) {
        return res.json(data.optimizedFile);
      }*!/
    }*/
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

      const car = await Cars.findByPk(car_id);

      if (Number(car.chat_id) === Number(chat_id) || Number(chat_id) === Number(adminId)) {
        let images = JSON.parse(car.car_images);
        images.splice(images.indexOf(imageFile), 1);
        await car.update({car_images: JSON.stringify(images)});

        await deleteFile(pathFile);

        return res.status(200).send();
      }
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
