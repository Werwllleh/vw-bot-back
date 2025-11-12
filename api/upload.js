import express from "express";
import path from "path";
import fs from "fs";
import {Cars, CarsImages} from "../models.js";
import logger from "../functions/logger.js";
import {deleteFile, fileProcessing, removeFile} from "../services/upload.js";
import {authenticateAccessToken} from "../services/auth.js";
import {validateData} from "./protect.js";
import {addCarImage} from "../services/cars.js";

const router = express.Router();

router.post("/upload", authenticateAccessToken, async (req, res) => {
  try {

    const uploadDir = path.resolve("upload");

    // Если директории не существует, создаем её
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {recursive: true});
    }

    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;
    const uploadCategory = req.body.type;

    const carId = req.body.carId;

    if (!req.files) return;

    const files = Object.values(req.files)[0];
    // Обработка: если массив — несколько файлов, если нет — один
    const filesArray = Array.isArray(files) ? files : [files];

    const results = await Promise.all(
      filesArray.map(async (file) => {
        const { path, filename } = await fileProcessing(file);
        return { filename, path };
      })
    );

    if (uploadCategory === 'car' && carId) {
      results?.map(car => {
        addCarImage(carId, car.filename)
      })
    }

    return res.status(200).json({
      message: "Загружено",
      files: results
    });

    /*if (Object.values(req.files)[0].length) {

      const uploadArray = [];

      const uploadData = Object.values(req.files)[0];

      uploadData.map((file) => {
        const {path, filename} = fileProcessing(file);
        uploadArray.push({path, filename});
      })

      return res.status(200).json({
        message: "Загружено",
        files: uploadArray
      });

    } else {
      const file = Object.values(req.files)[0];
      const {path, filename} = await fileProcessing(file);

      return res.status(200).json({
        message: "Загружено",
        files: [
          {
            name: filename,
            path: path
          }
        ]
      });
    }*/


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

router.post("/remove", authenticateAccessToken, async (req, res) => {
  try {

    const filename = req.body.filename;
    const removeType = req.body.type;

    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;


    if (!chatId) {
      return res.status(403).json({
        message: "Не авторизован",
      });
    }

    if (!filename) {
      return res.status(500).json({
        message: "Данные для удаления не переданы",
      });
    }


    if (removeType === 'car') {

      const folder = 'upload/image';

      const fileRemoved = removeFile(filename, folder);

      /*if (!fileRemoved) {
        return res.status(500).json({
          message: "Ошибка при удалении файла",
        });
      }*/

      await CarsImages.destroy({
        where: { source: filename },
      });

      return res.status(200).json({
        message: "Файл удален",
        /*file: filename,
        dbRecordsDeleted: deleted,
        fileRemoved,*/
      });
    }

    return res.status(200).json({
      message: "Удалено",
      fileName
    });


  } catch (err) {
    logger("Ошибка удаления файла", err);
    return res.status(500).json({
      message: "Ошибка удаления файла",
    });
  }
});

/*if (chat_id && car_id) {
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
 }*/

export default router;
