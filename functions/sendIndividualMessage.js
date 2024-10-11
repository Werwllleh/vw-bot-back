

const sendIndividualMessage = (bot, chatId, text, photo) => {
  try {
    if (photo) {
      bot.sendPhoto(chatId, photo);
    }
    return bot.sendMessage(chatId, text);
  } catch (error) {
    return bot.sendMessage(446012794, error);
  }
}

module.exports = sendIndividualMessage;
