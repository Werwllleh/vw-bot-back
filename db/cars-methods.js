import { Op } from 'sequelize';
import {Users, Cars} from '../models.js';
import path from "path";
import fs from "fs";
import resizeImage from "../functions/resizeImage.js";
import {access, constants, unlink} from "fs/promises";

//Фотки перемешаются в основную директорию только после успешной регистрации
export const resizedRegImages = async (imagesArray) => {
  const carsDir = path.resolve("img/cars");
  const tempDir = path.resolve("img/temp");

  if (!fs.existsSync(carsDir)) {
    fs.mkdirSync(carsDir, {recursive: true});
  }

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, {recursive: true});
  }

  let resizedImages = [];

  // const parsedImages = JSON.parse(imagesArray);

  if (imagesArray.length) {
    for (const image of imagesArray) {
      const filePath = path.resolve(tempDir, image);
      const compressImage = await resizeImage(filePath, carsDir, tempDir);

      if (compressImage) {
        resizedImages.push(compressImage.optimizedFile);
      }
    }
  }
  return resizedImages;
};

//добавление авто пользователя в БД
export const createUserCar = async (chatId, data) => {
  try {
    if (data) {
      const images = await resizedRegImages(data.images);

      if (images.length) {
        await Cars.create({
          car_brand: data.brand,
          car_model: data.model,
          car_year: data.carYear.trim(),
          car_number: data.carNumber.trim().toUpperCase(),
          car_note: data.carNote.trim(),
          car_images: JSON.stringify(images),
          chat_id: chatId,
        });
      }

    }
  } catch (error) {
    console.error('Ошибка при создании авто', error);
  }
};

export const getCarInfo = async (car_number) => {
  try {
    const carData = await Cars.findOne({
      where: {car_number: car_number},
      include: Users, // Включая владельца авто
    });

    if (!carData) {
      return null; // Если авто не найден, возвращаем null
    }

    return carData;

  } catch (err) {
    console.error('Ошибка при получении инфо автомобиля', err);
  }
}

export const getUsersCars = async (number) => {
  try {

    // Определяем условия для поиска
    const whereCondition = number ? {
        car_number: {
          [Op.like]: `%${number}%`, // Ищем значения, содержащие `number`
        },
      } : {}; // Если `number` не передан, условия отсутствуют

    return await Cars.findAll({
      where: whereCondition,
      include: Users, // Включая владельца авто
      order: [['createdAt', 'DESC']]
    });

  } catch (err) {
    console.error('Ошибка при получении всех автомобилей', err);
  }
}

export const updateUserCar = async (chat_id, car_id, car_data) => {
  try {
    const car = await Cars.findByPk(car_id);

    if (car && String(car.chat_id) === String(chat_id) || car && chat_id === process.env.ADMIN) {

      if (car_data.carNumber !== car.car_number) {
        const checkCar = await getCarInfo(car_data.carNumber);
        console.log(checkCar)

        if (!checkCar) {
          await car.update({car_number: car_data.carNumber.trim()});
        } else {
          return {
            status: 203,
            text: 'Данный номер зарегистрирован'
          };
        }
      }

      if (car_data.carBrand !== car.car_brand) {
        await car.update({car_brand: car_data.carBrand});
      }
      if (car_data.carModel !== car.car_model) {
        await car.update({car_model: car_data.carModel});
      }
      if (car_data.carYear !== car.car_year) {
        await car.update({car_year: car_data.carYear.trim()});
      }
      if (car_data.carNote !== car.car_note) {
        await car.update({car_note: car_data.carNote.trim()});
      }
      if (car_data.carDrive2 !== car.car_drive2) {
        await car.update({car_drive2: car_data.carDrive2.trim()});
      }

      return {
        status: 200,
        text: 'Данные авто обновлены'
      };

    }

  } catch (err) {
    console.error('Ошибка обновления данных об авто', err);
  }
}

export const deleteUserCar = async (chatId, carId) => {
  try {

    const car = await Cars.findByPk(carId);

    if (car && chatId === car.chat_id) {

      const images = JSON.parse(car.car_images);

      if (images.length > 0) {
        images.map(async (image) => {
          const imgPath = path.resolve('img/cars', image);

          if (imgPath) {
            await access(imgPath, constants.F_OK, async (err) => {
              if (!err) {
                await unlink(imgPath)
              }
            });
          }

        })
      }

      await car.destroy();

    }

  } catch (err) {
    console.error('Ошибка обновления данных об авто', err);
  }
}
