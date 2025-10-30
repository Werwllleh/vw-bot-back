import {Users, Cars} from '../models.js';

export const updateUserInfo = async (chatId, values) => {
  try {
    const user = await Users.findOne({ where: { chat_id: chatId } });

    if (!user || (String(user.chat_id) !== String(chatId) && chatId !== process.env.ADMIN)) {
      return {
        status: 500,
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


