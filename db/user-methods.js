import {Users, Cars} from '../models.js';
import {sendIndividualMessage} from "../functions/sendIndividualMessage.js";
import logger from "../functions/logger.js";

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
        user_telegram: userData.user_telegram,
        user_instagram: userData.user_instagram,
        user_color: userData.user_color,
        user_admin: userData.user_admin,
        cars: userData?.cars.length && userData?.cars.map((car) => ({
          car_id: car.id,
          car_brand: car.car_brand,
          car_model: car.car_model,
          car_year: car.car_year,
          car_number: car.car_number,
          car_note: car.car_note,
          car_drive2: car.car_drive2,
          car_images: JSON.parse(car.car_images)
        }))
      }

      return userInfo;
    }
  } catch (err) {
    console.error('Ошибка при получении инфо пользователя', err);
  }
}

export const updateUserInfo = async (chatId, values) => {
  try {
    const user = await Users.findOne({ where: { chat_id: chatId } });

    if (!user || (String(user.chat_id) !== String(chatId) && chatId !== process.env.ADMIN)) {
      return {
        status: 403,
        text: 'Доступ запрещен',
      };
    }

    const updates = {};

    if (user.user_name !== values.userName) {
      updates.user_name = values.userName.trim();
    }
    if (user.user_instagram !== values.userInstagram.replace(/^@/, "").trim()) {
      updates.user_instagram = values.userInstagram.replace(/^@/, "").trim();
    }

    if (Object.keys(updates).length > 0) {
      await user.update(updates);
      return {
        status: 200,
        text: 'Данные пользователя обновлены',
      };
    }

    return {
      status: 200,
      text: 'Изменений нет',
    };
  } catch (err) {
    return {
      status: 500,
      text: 'Ошибка обновления данных пользователя',
    };
  }
};

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

export const deleteUser = async (chatId) => {
  try {
    const userData = await Users.findOne({
      where: {chat_id: chatId},
      include: Cars,
    });


    console.log(userData)

    if (!userData) {
      console.log(`Пользователь с chatId ${chatId} не найден.`);
      return;
    }

    // Удаляем пользователя
    await Users.destroy({
      where: { chat_id: chatId },
    });

    if (!!userData.cars.length) {
      // Удаляем связанные записи в таблице Cars
      await Cars.destroy({
        where: { chat_id: chatId }, // Фильтруем по user_id
      });
    }

  } catch (err) {
    logger('Ошибка удаления пользователя', err)
    console.error('Ошибка удаления пользователя', err)
  }
}

export const sendUserMessage = async (chat_id, message) => {
  try {
    return await sendIndividualMessage(chat_id, message);
  } catch (err) {
    logger('Ошибка отправки индивидуального сообщения', err)
    console.error('Ошибка отправки индивидуального сообщения', err)
  }
}
