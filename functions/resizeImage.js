import path from 'path';
import fs from "fs";
import logger from "./logger.js";
import {access, copyFile, unlink, rm, constants} from "fs/promises";
import sharp from 'sharp';

const resizeImage = async (filePath, originalDir, tempDir) => {
  try {

    const fileData = path.basename(filePath).split('.');
    const optimizedFileName = `${fileData[0]}.webp`;

    await access(filePath, constants.F_OK);

    /*const metadata = await sharp(filePath).metadata();
    console.log(metadata);*/

    await sharp(filePath)
      .rotate() // Автоматически корректирует ориентацию изображения на основе данных Exif
      .resize(1000, 1000, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({quality: 50})
      .withMetadata()
      .toFile(path.resolve(tempDir, optimizedFileName))

    await copyFile(path.resolve(tempDir, optimizedFileName), path.resolve(originalDir, optimizedFileName))

    await unlink(path.resolve(tempDir, optimizedFileName))
    // await rm(filePath, {recursive: true})
    // await unlink(filePath)

    return {optimizedFile: optimizedFileName};

  } catch (err) {
    logger(`Ошибка обработки изображения:`, err);
    throw new Error(`Ошибка обработки изображения: ${err}`);
  }
};

export default resizeImage;
