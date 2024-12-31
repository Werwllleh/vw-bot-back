import {bot} from "../index.js";


export const sendIndividualMessage = async (chatId, text) => {
  try {
    return await bot.sendMessage(chatId, text);
  } catch (error) {
    return await bot.sendMessage(process.env.ADMIN, error);
  }
}
