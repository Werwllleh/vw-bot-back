import {Cars, CarsImages, Users} from "../models.js";
import {randomColor} from "../functions/randomColor.js";
import {sendIndividualMessage} from "../functions/sendIndividualMessage.js";
import logger from "../functions/logger.js";
import {verifyToken} from "./auth.js";

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

//отправка сообщения пользователю через телеграм бот
export const sendUserMessage = async (chat_id, message) => {
  try {
    return await sendIndividualMessage(chat_id, message);
  } catch (err) {
    logger('Ошибка отправки индивидуального сообщения', err)
    console.error('Ошибка отправки индивидуального сообщения', err)
  }
}

//удаление пользователя со всеми связями
// TODO: доделать
export const deleteUser = async (chatId) => {
  try {
    // Находим пользователя с машинами
    const userData = await Users.findOne({
      where: { chatId: chatId },
      include: [Cars, CarsImages],
    });

    if (!userData) {
      console.log(`Пользователь с chatId ${chatId} не найден.`);
      return;
    }

    // Сначала удаляем связанные машины
    if (userData.cars && userData.cars.length > 0) {
      await Cars.destroy({
        where: { chat_id: chatId }, // или user_id, если поле называется иначе
      });
      console.log(`Удалено ${userData.cars.length} машин для chatId ${chatId}`);
    }

    // Потом удаляем пользователя
    await Users.destroy({
      where: { chat_id: chatId },
    });

    return `Пользователь успешно удалён.`
  } catch (err) {
    logger('Ошибка удаления пользователя', err);
    console.error('Ошибка удаления пользователя:', err);
  }
};

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
              model: CarsImages
            }
          ]
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

export const userRolesVerification = async (accessToken) => {

  if (!accessToken) {
    return { error: 'jwt expired' };
  }

  const decoded = await verifyToken(accessToken);

  if (!decoded) {
    return { error: 'jwt invalid' };
  }

  const userChatId = decoded.chatId;



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
