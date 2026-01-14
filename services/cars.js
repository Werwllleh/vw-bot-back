import {Cars, CarsImages, Users} from "../models.js";
import {getRandomItems} from "../utils/utils.js";

export const addUserCar = async (chatId, data) => {
  if (!data) throw new Error("Нет данных для добавления автомобиля");

  return await Cars.create({
    brand: data.brand,
    model: data.model,
    year: parseInt(data.year),
    number: data.number.trim().toUpperCase(),
    note: data.note?.trim(),
    drive2: data.drive2?.trim(),
    chatId,
  });
};

export const getUserCar = async (number, carId) => {

  if (number) {
    return await Cars.findOne({
      where: {number},
      include: [
        {
          model: Users,
          required: false,
        },
        {
          model: CarsImages,
          required: false,
        }
      ]
    });
  }

  if (carId) {
    return await Cars.findOne({
      where: {id: carId},
      include: [
        {
          model: Users,
          required: false,
        },
        {
          model: CarsImages,
          required: false,
        }
      ]
    });
  }

  if (!number || !carId) throw new Error("Данные по авто не переданы");

}

export const otherCars = async (count) => {
  const allCars = await Cars.findAll({
    include: [
      {
        model: CarsImages,
      }
    ]
  });

  if (count) {
    return getRandomItems(allCars, count);
  }

  return allCars;
}

export const updateUserCar = async (carId, data) => {

  if (!carId) throw new Error("Не передан Id авто");

  const car = await Cars.findOne({
    where: {id: carId},
    include: [
      {
        model: CarsImages,
        required: false,
      }
    ]
  });

  if (!car) throw new Error("Автомобиль не найден");

  if (data.number !== car.number) {
    const checkCar = await getUserCar(data.number);

    if (!checkCar) {
      await car.update({number: data.number.trim()});
    } else {
      throw new Error("Данный номер зарегистрирован");
    }
  }

  if (data.brand !== car.brand) {
    await car.update({brand: data.brand});
  }
  if (data.model !== car.model) {
    await car.update({model: data.model});
  }
  if (data.year !== car.year) {
    await car.update({year: data.year});
  }
  if (data.note !== car.note) {
    await car.update({note: data.note.trim()});
  }
  if (data.drive2 !== car.drive2) {
    await car.update({drive2: data.drive2.trim()});
  }

  return car;
}

export const addCarImage = async (carId, sources) => {
  try {
    // Если пришёл один файл — делаем массив
    const imageArray = Array.isArray(sources) ? sources : [sources];

    return await Promise.all(
      imageArray.map(source => {

          const path = source

          CarsImages.create({
            carId,
            source: path,
          })
        }
      )
    );
  } catch (error) {
    console.error('Ошибка при добавлении изображений автомобиля:', error);
    throw error;
  }
};
