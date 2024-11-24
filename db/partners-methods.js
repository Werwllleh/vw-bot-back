import {Partners, PartnersCategories} from '../models.js';
import {getUserInfo} from "./user-methods.js";
import {getRandomColor} from "../functions/randomColor.js";


const adminId = process.env.ADMIN;

export const partnersCategories = [
  {
    label: '',
    value: '',
  },

]

export const getPartnersCategories = async () => {
  try {

    const partnersCategories = await Partners.findAll();
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
        label: category.label,
        value: category.value,
      });

      return true;
    } else {
      return false;
    }


  } catch (err) {
    console.error('Ошибка при получении категорий партнеров', err);
  }
}
