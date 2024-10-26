import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import dbConnect from './functions/dbConnect.js';
import { createUser, createUserCar, getUserInfo } from './db/user-methods.js';
import fileUpload from 'express-fileupload';


import carsRouter from './api/cars.js';
import sendMessage from './functions/sendMessage.js';
import logger from './functions/logger.js';
import {keyBoard} from "./keyboards.js";

const token = process.env.TOKEN_TEST;
const port = process.env.PORT;

process.env["NTBA_FIX_350"] = 1;

const app = express();
const bot = new TelegramBot(token, { polling: true });

app.use(express.json());
app.use(fileUpload());
app.use(cors());

app.listen(port, () => console.log(`App is listening on port ${port}.`));

app.get("/api", async (req, res) => {
  return res.json("work");
});

app.use("/api", carsRouter);

const start = async () => {
  await dbConnect(); // Подключаем базу данных

  await bot.setMyCommands([
    { command: "/info", description: "О клубе" },
    { command: "/go", description: "Тест функция" },
    { command: "/start", description: "Обновление/перезапуск бота" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    console.log(text);
    console.log(chatId);

    const data = {
      chat_id: chatId,
      user_name: 'Алексей',
      user_birthday: '1999-10-05',
    };

    const carInfo = {
      car_brand: 'Skoda',
      car_model: 'Octavia',
      car_year: 2017,
      car_number: 'К868ОР21',
      car_note: 'Тачка админа тест',
      car_images: JSON.stringify(['image1.jpg', 'image2.jpg']),
    };

    try {
      if (text === "/start") {
        sendMessage(bot, chatId, 'Test log', null, keyBoard.menu);
      }

      if (text === "/go") {
        return bot.sendMessage(chatId, `ywefyfew`, keyBoard.menu);
        // const user = await getUserInfo(chatId);
        //
        // if (user) {
        //   await createUserCar(chatId, carInfo);
        // } else {
        //   await createUser(data);
        // }
        //
        // console.log(user.dataValues);
      }

    } catch (err) {
      logger("Не отработал сценарий чата", err);
      console.log(err);
    }
  });
};

start();
