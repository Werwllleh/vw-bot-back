import logger from "../functions/logger.js";

const sendMessage = (bot, chatId, text, photo, keyboard) => {
  try {
    if (photo) {
      return bot.sendPhoto(chatId, photo, keyboard ? keyboard : '');
    } else {
      logger('Ошибка отправки сообщения', text)
      return bot.sendMessage(chatId, text, keyboard ? keyboard : '');
    }
  } catch (err) {
    logger('Ошибка отправки сообщения', err)
    console.log(err)
  }
}

export default sendMessage;
