import {Cars} from "../models.js";

export const addUserCar = async (chatId, data) => {
  if (!data) throw new Error("Нет данных для добавления автомобиля");

  return await Cars.create({
    brand: data.brand,
    model: data.model,
    year: parseInt(data.year),
    number: data.number.trim().toUpperCase(),
    note: data.note?.trim(),
    drive2: data.drive2?.trim(),
    chatId,
  });
};
