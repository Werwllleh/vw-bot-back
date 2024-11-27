import {Partners, PartnersCategories} from '../models.js';
import {getUserInfo} from "./user-methods.js";
import {getRandomColor} from "../functions/randomColor.js";
import {translite} from "../functions/translite.js";


const adminId = process.env.ADMIN;

export const getPartnersCategories = async () => {
  try {

    const partnersCategories = await PartnersCategories.findAll();
    return partnersCategories;

  } catch (err) {
    console.error('Ошибка при получении категорий партнеров', err);
  }
}

export const addPartnerCategory = async (chatId, category) => {
  try {

    const userInfo = await getUserInfo(chatId);

    if (userInfo.user_admin) {
      await PartnersCategories.create({
        label: category.value,
        value: translite(category.value),
      });

      return true;
    } else {
      return false;
    }

  } catch (err) {
    console.error('Ошибка при добавлении категории партнеров', err);
  }
}

export const deletePartnerCategory = async (chatId, categoryId) => {
  try {

    const checkUser = await getUserInfo(chatId);

    if (checkUser && checkUser.user_admin) {
      await PartnersCategories.destroy({
        where: {id: categoryId},
      });
      return true;
    } else {
      return false;
    }

  } catch (err) {
    console.error('Ошибка при получении категорий партнеров', err);
  }
}

export const createPartner = async (chatId, data) => {
  try {
    const userInfo = await getUserInfo(chatId);

    if (!userInfo.user_admin) {
      return false;
    }

    // Создаем партнера
    const partner = await Partners.create({
      title: data.title,
      description: data.description,
      links: JSON.stringify(data.links),
      phones: JSON.stringify(data.phones),
      address_text: data.address_text,
      address_coordinates: JSON.stringify(data.address_coordinates),
    });

    // Добавляем категории
    for (const categoryValue of data.categories) {
      const partnerCategory = await PartnersCategories.findOne({
        where: { value: categoryValue },
      });

      if (!partnerCategory) {
        console.error(`Категория с value "${categoryValue}" не найдена.`);
        continue; // Пропустить эту категорию
      }

      await partner.addPartnersCategory(partnerCategory);
    }

    // Возвращаем партнера с категориями
    const result = await Partners.findOne({
      where: { id: partner.id },
      include: {
        model: PartnersCategories,
        through: { attributes: [] },
      },
    });

    return result;
  } catch (err) {
    console.error('Ошибка при добавлении партнера', err);
    throw err; // Для дальнейшей обработки ошибки
  }
};
