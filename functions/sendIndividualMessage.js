import {bot} from "../index.js";


export const sendIndividualMessage = (chatId, text) => {
  try {
    return bot.sendMessage(chatId, text);
  } catch (error) {
    return bot.sendMessage(process.env.ADMIN, error);
  }
}
