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

      const folder = process.env.IMAGES_DIR;

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

export default router;
