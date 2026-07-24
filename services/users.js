import {Cars, CarsImages, UserCompanies, Users} from "../models.js";
import {randomColor} from "../functions/randomColor.js";

//создание пользователя в БД
export const createUser = async (payload) => {

  try {
    return await Users.create({
      chatId: payload.chatId,
      name: payload.name.trim(),
      instagram: payload.instagram.trim(),
      color: randomColor(),
    });
  } catch (error) {
    console.error('Ошибка при создании пользователя', error);
  }
}

//обновление пользователя в БД
export const updateUser = async (chatId, payload) => {

  try {

    const user = await Users.findOne({ where: { chatId } });
    return await user.update(payload);

  } catch (error) {
    console.error('Ошибка при обновлении пользователя', error);
  }
}

//получение информации о пользователе со всеми связанными полями
export const getUserInfo = async (chatId) => {
  try {
    const userData = await Users.findOne({
      where: { chatId },
      include: [
        {
          model: Cars,
          include: [
            {
              model: CarsImages,
            }
          ]
        },
        {
          model: UserCompanies,
          as: 'companies',
        }
      ]
    });

    if (userData === null) {
      return null; // Если пользователь не найден, возвращаем null
    }

    return userData;
  } catch (err) {
    console.error('Ошибка при получении инфо пользователя', err);
  }
}

//получение информации об авто у пользователя со всеми связанными полями
export const userCarsData = async (chatId) => {

  try {
    return await Cars.findAll({
      where: {chatId},
      include: [
        {
          model: CarsImages,
        }
      ]
    });
  } catch (error) {
    console.error('Ошибка при получении user cars', error);
  }
}
