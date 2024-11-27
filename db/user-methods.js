import {Users, Cars} from '../models.js';

export const getUserInfo = async (chatId) => {
  try {
    const userData = await Users.findOne({
      where: {chat_id: chatId},
      include: Cars, // Включаем связанные автомобили
    });


    if (userData === null) {
      return null; // Если пользователь не найден, возвращаем null
    } else {
      const userInfo = {
        id: userData.id,
        chat_id: userData.chat_id,
        user_name: userData.user_name,
        user_color: userData.user_color,
        user_admin: userData.user_admin,
        cars: userData?.cars.length && userData?.cars.map((car) => ({
          car_id: car.id,
          car_brand: car.car_brand,
          car_model: car.car_model,
          car_year: car.car_year,
          car_number: car.car_number,
          car_note: car.car_note,
          car_images: JSON.parse(car.car_images)
        }))
      }

      return userInfo;
    }
  } catch (err) {
    console.error('Ошибка при получении инфо пользователя', err);
  }
}

export const getAllUsers = async () => {
  try {

    const usersData = await Users.findAll({
      include: Cars,
    });

    return usersData;

  } catch (err) {
    console.error('Ошибка при получении всех пользователей', err);
  }
}