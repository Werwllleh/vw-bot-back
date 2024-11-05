import {Users, Cars} from '../models.js';

export const getUserInfo = async (chatId) => {
  try {
    return await Users.findOne({
      where: {chat_id: chatId},
      include: Cars, // Включаем связанные автомобили
    });
  } catch (error) {
    console.error('Ошибка при получении инфо пользователя', error);
  }
}
