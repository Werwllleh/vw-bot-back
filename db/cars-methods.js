import {Users, Cars} from '../models.js';

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
