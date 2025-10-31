import {v4 as uuidv4} from "uuid";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import logger from "../functions/logger.js";

export const fileProcessing = async (file) => {
  if (!file) throw new Error('Файл отсутствует');

  const fileMimetype = file.mimetype || '';
  const fileFormat = (file.name || '').trim().split('.').pop() || '';

  const imagesDir = path.resolve('upload/image');
  const applicationsDir = path.resolve('upload/application');
  const tempDir = path.resolve('upload/temp');

  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, {recursive: true});
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, {recursive: true});
  if (!fs.existsSync(applicationsDir)) fs.mkdirSync(applicationsDir, {recursive: true});

  if (fileMimetype.startsWith('image')) {
    const baseName = uuidv4();
    const outName = `${baseName}.webp`;
    const tmpName = `${baseName}-orig.${fileFormat || 'tmp'}`;

    const tmpPath = path.join(tempDir, tmpName);   // временный исходник
    const outPath = path.join(imagesDir, outName);   // итоговый webp

    await file.mv(tmpPath);

    try {
      const optimizedImageData = await optimizeImageToWebp(tmpPath, outPath);

      if (optimizedImageData && Object.values(optimizedImageData).length) {
        try {
          if (!fs.existsSync(tmpPath)) throw new Error('Файл не найден: ' + tmpPath);
          fs.unlink(tmpPath, (e) => {
            if (e) return logger('Ошибка удаления оригинального изображения', e);
          });
        } catch (e) {
          console.error(e);
        }
      }
      return {path: outPath, filename: outName};
    } catch (err) {
      console.error('Оптимизация завершилась с ошибкой:', err);
      return {path: tmpPath, filename: tmpName};
    }
  }

  if (fileMimetype.startsWith('application') || fileFormat) {
    const outName = `${uuidv4()}.${fileFormat || 'bin'}`;
    const outPath = path.join(applicationsDir, outName);
    await file.mv(outPath);
    return {path: outPath, filename: outName};
  }

  throw new Error('Неподдерживаемый файл');
};

export const optimizeImageToWebp = async (inputPath, outputPath, opts = {}) => {
  const {quality = 85} = opts;

  if (!fs.existsSync(inputPath)) throw new Error('Файл не найден: ' + inputPath);

  return sharp(inputPath)
    .rotate() // использовать Exif
    .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      }
    )
    .webp({quality})
    .withMetadata()
    .toFile(outputPath);
};
