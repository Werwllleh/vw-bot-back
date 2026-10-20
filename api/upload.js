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

    const uploadDir = path.resolve(process.env.UPLOAD_DIR);

    // Если директории не существует, создаем её
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {recursive: true});
    }

    const hashData = await validateData(req, res);
    const chatId = hashData.chatId;
    const uploadCategory = req.body.type;

    const carId = req.body.carId;

    if (!req.files || !Object.keys(req.files).length) {
      return res.status(400).json({ message: "Файлы не переданы" });
    }

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
      const car = await Cars.findOne({ where: { id: carId } });
      if (car && (String(car.chatId) === String(chatId) || String(process.env.ADMIN) === String(chatId))) {
        await Promise.all(
          results.filter(carImg => carImg?.filename).map(carImg => addCarImage(carId, carImg.filename))
        );
      }
    }

    return res.status(200).json({
      message: "Загружено",
      files: results
    });

  } catch (err) {
    console.log(err)
    logger("Ошибка загрузки изображения", err);
    res.status(500).json({message: 'Ошибка загрузки изображения'});
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
      const carImage = await CarsImages.findOne({
        where: { source: filename },
        include: [{ model: Cars, required: false }]
      });

      if (!carImage) {
        return res.status(404).json({ message: "Файл не найден" });
      }

      // Проверка прав: только владелец автомобиля или администратор
      const isOwner = carImage.car && String(carImage.car.chatId) === String(chatId);
      const isAdmin = String(process.env.ADMIN) === String(chatId);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Нет доступа для удаления этого файла" });
      }

      const folder = process.env.IMAGES_DIR;
      removeFile(filename, folder);

      await CarsImages.destroy({
        where: { id: carImage.id },
      });

      return res.status(200).json({
        message: "Файл удален",
      });
    }

    return res.status(200).json({
      message: "Удалено",
      filename
    });


  } catch (err) {
    logger("Ошибка удаления файла", err);
    return res.status(500).json({
      message: "Ошибка удаления файла",
    });
  }
});

export default router;
