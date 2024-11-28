import {PartnerCategoryConnect, Partners, PartnersCategories} from '../models.js';
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

    // console.log(data)
    const categoriesIdArr = data.categories;

    const createPartner = await Partners.create({
      title: data.title,
      description: data.description,
      links: JSON.stringify(data.links),
      phones: JSON.stringify(data.phones),
      address_text: data.address_text,
      address_coordinates: JSON.stringify(data.address_coordinates),
      status: userInfo.user_admin
    });

    await Partners.findByPk(createPartner.id)
      .then(partner => {
        if(!partner) return;

        categoriesIdArr.map(categoryId => {
          PartnersCategories.findByPk(categoryId)
          .then(category => {

            partner.addPartnersCategories(category);
          })
        })
      })

    return true;
  } catch (err) {
    console.error('Ошибка при добавлении партнера', err);
    throw err; // Для дальнейшей обработки ошибки
  }
};

export const getCategoryDataById = async (categoryId) => {
  try {
    const categoryData = await PartnersCategories.findByPk(categoryId);
    return categoryData;
  } catch (err) {
    console.error('Ошибка при получения инфо о категории партнера', err);
    throw err; // Для дальнейшей обработки ошибки
  }
}

export const getPartnersWithCategories = async () => {
  try {
    // Запрашиваем партнеров с их категориями
    const partners = await Partners.findAll({
      order: [["status", "ASC"]],
      include: {
        model: PartnersCategories,
        through: { attributes: [] }, // Не включать данные промежуточной таблицы
        // attributes: ['id', 'label', 'value'], // Включить только ID категорий
      }
    });

    // Преобразуем данные, чтобы категории были массивом
    const result = partners.map((partner) => ({
      id: partner.id,
      title: partner.title,
      description: partner.description,
      links: JSON.parse(partner.links),
      phones: JSON.parse(partner.phones),
      address_text: partner.address_text,
      address_coordinates: JSON.parse(partner.address_coordinates),
      images: partner.images,
      status: partner.status,
      rejected: partner.rejected,
      categories: partner.partnersCategories.map((cat) => ({
        id: cat.id,
        label: cat.label,
        value: cat.value,
      })), // Список ID категорий
    }));

    return result;
  } catch (error) {
    console.error('Ошибка при получении партнеров с категориями:', error);
    throw error;
  }
}

