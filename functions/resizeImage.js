import path from 'path';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import logger from "./logger.js";
import { access, constants } from "fs/promises";
import sharp from 'sharp';

const resizeImage = async (imagePath, saveDirectory) => {
  try {
    const filePath = path.resolve(saveDirectory, imagePath);

    // Проверка существования файла
    await access(filePath, constants.F_OK)
      .catch((err) => {
        logger('Файл для оптимизации не найден', err);
        throw new Error('Файл не найден');
      });

    // Изменение размера изображения
    /*await sharp(filePath)
      .resize(1000, 1000, {
        fit: 'inside',           // Пропорциональное уменьшение
        withoutEnlargement: true // Не увеличивать, если меньше
      })
      .toFile(path.resolve(saveDirectory, path.basename('resized__' + filePath)))
      .catch((err) => {
        logger('Ошибка изменения размера изображения', err);
        throw new Error('Ошибка изменения размера');
      });*/

    // Сжатие изображения
    const webpImage = await imagemin([filePath], {
      destination: saveDirectory,
      plugins: [imageminWebp({ quality: 50 })],
    });

    const optimizedImage = path.basename(webpImage[0].destinationPath);
    return optimizedImage;

  } catch (err) {
    logger(`Ошибка конвертации изображения в WebP: ${imagePath}`, err);
    throw new Error(`Ошибка обработки изображения: ${imagePath}`);
  }
};

export default resizeImage;
