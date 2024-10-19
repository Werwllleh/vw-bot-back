require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const cors = require("cors");
const dbConnect = require("./functions/dbConnect");
const {Users, Cars} = require("./models");
const {menu} = require("./keyboards");
const {createUser, createUserCar, getUserInfo} = require("./db/user-methods");

const token = process.env.TOKEN_TEST;
const port = process.env.PORT;

process.env["NTBA_FIX_350"] = 1;

const app = express();
const bot = new TelegramBot(token, {polling: true});

app.use(express.json());
app.use(cors());
app.listen(port, () => console.log(`App is listening on port ${port}.`));

app.get("/api", async (req, res) => {
  return res.json("work");
});

const carsRouter = require("./api/cars");
app.use("/api", carsRouter);

const start = async () => {

  await dbConnect(); //Подключаем базу данных

  await bot.setMyCommands([
    {command: "/info", description: "О клубе"},
    {command: "/go", description: "Тест функция"},
    {command: "/start", description: "Обновление/перезапуск бота"},
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    console.log(chatId)

    const data = {
      chat_id: chatId,
      user_name: 'Алексей',
      user_birthday: '1999-10-05',
    }

    const carInfo = {
      car_brand: 'Skoda',
      car_model: 'Octavia',
      car_year: 2017,
      car_number: 'К868ОР21',
      car_note: 'Тачка админа тест',
      car_images: JSON.stringify(['image1.jpg', 'image2.jpg']),
    }

    try {

      if (text === "/start") {
        return bot.sendMessage(
          chatId,
          `Добро пожаловать в телеграм бота VAG сообщества Чебоксар!`,
          menu
        );
      }

      if (text === "/go") {
        // const user = await getUserInfo(chatId);
        //
        // if (user) {
        //   await createUserCar(chatId, carInfo)
        // } else {
        //   await createUser(data);
        // }
        //
        // console.log(user.dataValues)

      }

    } catch (error) {
      return bot.sendMessage(chatId, "Произошла какая то ошибка!", menu);
    }
  })

}

start();

