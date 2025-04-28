import {PartnerCategoryConnect, Partners, PartnersCategories} from '../models.js';
import {getUserInfo} from "./user-methods.js";
import {getRandomColor} from "../functions/randomColor.js";
import {translite} from "../functions/translite.js";
import logger from "../functions/logger.js";
import {Op} from "sequelize";


const adminId = process.env.ADMIN;

export const getPartnersCategories = async () => {
  try {

    const partnersCategories = await PartnersCategories.findAll({
      order: [["label", "ASC"]],
    });
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

      const partner = await getCategoryDataById(categoryId)

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

export const createUpdatePartner = async (chatId, data, partnerId) => {
  try {
    const userInfo = await getUserInfo(chatId);

    const categoriesIdArr = data.categories;

    if (!partnerId) {
      // Если партнер не найден, создаем нового
      const createPartner = await Partners.create({
        title: data.title,
        slug: translite(data.title),
        description: data.description,
        links: JSON.stringify(data.links),
        phones: JSON.stringify(data.phones),
        address_text: data.address_text,
        address_coordinates: JSON.stringify(data.address_coordinates),
        active: userInfo.user_admin,
      });

      // Находим созданного партнера
      const partner = await Partners.findByPk(createPartner.id);
      if (!partner) return;

      // Привязываем категории к партнеру
      for (const categoryId of categoriesIdArr) {
        const category = await PartnersCategories.findByPk(categoryId);
        if (category) {
          await partner.addPartnersCategories(category);
        }
      }

      return { success: true, message: 'Партнер успешно добавлен' };
    } else {
      // Если партнер существует, обновляем его данные
      const checkPartner = await Partners.findByPk(partnerId);
      if (checkPartner) {
        // Обновляем партнера
        await checkPartner.update({
          title: data.title,
          slug: translite(data.title),
          description: data.description,
          links: JSON.stringify(data.links),
          phones: JSON.stringify(data.phones),
          address_text: data.address_text,
          address_coordinates: JSON.stringify(data.address_coordinates),
          active: userInfo.user_admin,
        });

        // Удаляем существующие связи с категориями, чтобы привязать новые
        await checkPartner.setPartnersCategories([]);

        // Привязываем новые категории
        for (const categoryId of categoriesIdArr) {
          const category = await PartnersCategories.findByPk(categoryId);
          if (category) {
            await checkPartner.addPartnersCategories(category);
          }
        }

        return { success: true, message: 'Обновление информации о партнере прошло успешно' };
      }
    }
  } catch (err) {
    console.error('Ошибка при добавлении/удалении партнера', err);
    return { success: false, message: 'Ошибка при добавлении/удалении партнера' };
  }
};

export const deletePartner = async (chatId, partnerId) => {
  try {

    const userInfo = await getUserInfo(chatId);

    if (userInfo.user_admin) {
      // Находим партнера
      const partner = await Partners.findByPk(partnerId);

      if (!partner) {
        console.log(`Партнер с id ${partnerId} не найден`);
        return { success: false, message: `Партнер не найден` };
      }

      // Удаляем связи с категориями
      await partner.setPartnersCategories([]);

      // Удаляем партнера
      await partner.destroy();
      logger(`Партнер "${partner.title}" был удален пользователем ${userInfo.user_name} c id:${userInfo.id}`, '')

      return { success: true, message: 'Партнер успешно удален' };
    }
  } catch (error) {
    console.error('Ошибка при удалении партнера:', error);
    return { success: false, message: 'Ошибка при удалении партнера' };
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
      order: [["active", "ASC"]],
      include: {
        model: PartnersCategories,
        through: {attributes: []}, // Не включать данные промежуточной таблицы
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
      active: partner.active,
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

export const getPartnersForUsers = async () => {
  try {
    // Запрашиваем партнеров с их категориями
    const partners = await Partners.findAll({
      where: {
        active: true
      },
      order: [["title", "ASC"]],
      include: {
        model: PartnersCategories,
        through: { attributes: [] }, // Не включать данные промежуточной таблицы
        // attributes: ['id', 'label', 'value'], // Включить только ID категорий
      },
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
      active: partner.active,
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

export const updatePartnerStatus = async (chatId, partnerId, data) => {
  try {
    const userInfo = await getUserInfo(chatId);

    if (userInfo.user_admin && partnerId) {
      // Если партнер существует, обновляем его данные
      const checkPartner = await Partners.findByPk(partnerId);

      if (checkPartner) {
        // Обновляем статусы партнера
        await checkPartner.update(data);

        return { success: true, message: 'Обновление информации о партнере прошло успешно' };
      }
    }
  } catch (err) {
    console.error('Ошибка при добавлении/удалении партнера', err);
    return { success: false, message: 'Ошибка при добавлении/удалении партнера' };
  }
};

//site

/*export const getPartners = async (filter) => {

  try {
    const filterQuery = {
      active: true,
      [Op.and]: [
        filter?.label && {
          title: {
            [Op.iLike]: `%${filter.label}%`,
          },
        },
        !!filter?.categories?.length && {
          '$categories.value$': {
            [Op.in]: filter.categories,
          },
        },
      ].filter(Boolean), // Убираем null или undefined значения
    };
    // Запрашиваем партнеров с их категориями
    return await Partners.findAll({
      where: filter ? filterQuery : { active: true },
      order: [["createdAt", "ASC"]],
      include: {
        model: PartnersCategories,
        through: { attributes: [] }, // Не включать данные промежуточной таблицы
        required: !!filter?.categories?.length,
        // attributes: ['id', 'label', 'value'], // Включить только ID категорий
      },
    });

    /!*const updatePartner = async (partner) => {
      const checkPartner = await Partners.findByPk(partner.id);

      await checkPartner.update({
        slug: translite(checkPartner.title)
      })
    }

    if (!!partners.length) {
      partners.map(async (partner) => {

        if (partner.slug === null) {
          await updatePartner(partner)
        }

      })
    }*!/

    // return partners;

  } catch (error) {
    console.error('Ошибка при получении партнеров с категориями:', error);
    throw error;
  }
}*/

export const getPartners = async (filter) => {
  try {
    const where = {
      active: true,
    };

    if (filter?.label) {
      where.title = {
        [Op.iLike]: `%${filter.label}%`,
      };
    }

    const include = [
      {
        model: PartnersCategories,
        through: { attributes: [] }, // Не включаем данные промежуточной таблицы
      }
    ];

    if (filter?.categories?.length) {
      include[0].where = {
        value: {
          [Op.in]: filter.categories,
        },
      };
      include[0].required = true; // Важно! Иначе фильтр работать не будет
    }

    return await Partners.findAll({
      where,
      include,
      order: [["createdAt", "ASC"]],
    });

  } catch (error) {
    console.error('Ошибка при получении партнеров с категориями:', error);
    throw error;
  }
}

export const getPartner = async (slug) => {
  try {

    if (!slug) {
      return null
    }

    // Запрашиваем партнера с его категориями
    const partner = await Partners.findOne({
      where: {
        active: true,
        slug: slug, // Ищем активного партнера по slug
      },
      // attributes: ["id", "name", "slug", "description", "createdAt"], // Указываем, какие поля возвращать
      // order: [["createdAt", "ASC"]], // Сортировка по дате создания
      include: {
        model: PartnersCategories, // Подключаем связанные категории
        through: { attributes: [] }, // Исключаем данные из промежуточной таблицы
        attributes: ["id", "label", "value"], // Возвращаем только нужные поля категорий
      },
    });

    // Если партнер не найден, выбрасываем ошибку
    if (!partner) {
      throw new Error("Партнер не найден");
    }

    return partner; // Возвращаем найденного партнера
  } catch (error) {
    console.error("Ошибка при получении партнера с категориями:", error);
    throw error; // Пробрасываем ошибку дальше
  }
};
