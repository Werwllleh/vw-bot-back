const {Users, Cars} = require("../models");

const createUser = async (data) => {
  try {
    return await Users.create({
      chat_id: data.chat_id,
      user_name: data.user_name.trim(),
      user_birthday: data.user_birthday,
    });
  } catch (error) {
    console.error('Ошибка при создании пользователя', error);
  }
}

const createUserCar = async (chatId, data) => {
  try {
    return await Cars.create({
      car_brand: data.car_brand,
      car_model: data.car_model,
      car_year: data.car_year,
      car_number: data.car_number,
      car_note: data.car_note,
      car_images: data.car_images,
      chat_id: chatId,
    });
  } catch (error) {
    console.error('Ошибка при создании авто', error);
  }
}

const getUserInfo = async (chatId) => {
  try {
    return await Users.findOne({
      where: {chat_id: chatId},
      include: Cars, // Включаем связанные автомобили
    });
  } catch (error) {
    console.error('Ошибка при получении инфо пользователя', error);
  }
}

module.exports = {createUser, createUserCar, getUserInfo}
