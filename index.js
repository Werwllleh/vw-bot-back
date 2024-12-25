import 'dotenv/config';
import {Bot} from "grammy";
import express from 'express';
import cors from 'cors';
import dbConnect from './functions/dbConnect.js';
import fileUpload from 'express-fileupload';

import carsRouter from './api/cars.js';
import userRouter from './api/users.js';
import partnersRouter from './api/partners.js';

import logger from './functions/logger.js';
import {keyBoard} from "./keyboards.js";
import {getUserInfo} from "./db/user-methods.js";

const adminId = process.env.ADMIN;
const token = process.env.TOKEN_TEST;
const port = process.env.PORT;

process.env["NTBA_FIX_350"] = 1;

const app = express();

const bot = new Bot(token);

app.use(express.json());
app.use(fileUpload());

const allowedOrigins = ['https://vagclub21.ru', 'https://bot.vagclub21.ru', 'https://cms.vagclub21.ru'];
app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Разрешенные HTTP-методы
  allowedHeaders: ['Content-Type', 'Authorization'] // Разрешенные заголовки
}));

app.listen(port, () => console.log(`App is listening on port ${port}.`));

app.get("/api", async (req, res) => {
  return res.json("work");
});

app.use("/api/car", express.static("img/cars"));
app.use("/api/bot", express.static("img/bot-data"));

app.use("/api", carsRouter);
app.use("/api", userRouter);
app.use("/api", partnersRouter);

const start = async () => {
  await dbConnect(); // Подключаем базу данных

  await bot.api.setMyCommands([
    {command: "start", description: "Обновление/перезапуск бота"},
    {command: "info", description: "О клубе"},
    {command: "partners", description: "Партнеры"},
  ]);

  bot.command(
    "info",
    (ctx) => ctx.reply("Текст о клубе"),
  );

  bot.on("message", async (ctx) => {
    // const text = msg.text.toLowerCase();

    try {
      const chatId = ctx.chat.id;
      const message = ctx.message.text;

      if (String(chatId) !== String(adminId)) {
        return await bot.api.sendMessage(chatId, "Привет! Бот уже совсем скоро заработает, еще чуть-чуть");
      }

      const userData = await getUserInfo(chatId);

      if (userData) {
        if (message.toLowerCase() === "/start") {
          return await bot.api.sendMessage(chatId, 'Ознакомиться с клубными партнерами можно тут', keyBoard.partners);
        }
        if (message.toLowerCase() === "/partners") {
          return await bot.api.sendMessage(chatId, 'Ознакомиться с клубными партнерами можно тут', keyBoard.partners);
        }
      } else {
        return await bot.api.sendMessage(chatId, 'Привет! Пожалуйста пройди регистрацию для полноценного использования', keyBoard.reg);
      }


      /*if (message.toLowerCase() === "/партнеры") {
        return bot.api.sendMessage(chatId, 'Партнеры тут', keyBoard.partners);
      }*/

    } catch (err) {
      logger("Не отработал сценарий бота", err);
      console.log(err);
    }


    /*const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text.toLowerCase() === "/start") {
        return sendMessage(bot, chatId, 'Воспользуйся кнопками', null, keyBoard.menu);
      }

      if (text.toLowerCase() === "регистрация") {
        return sendMessage(bot, chatId, 'Test log', null, keyBoard.reg);
      }

      if (text.toLowerCase() === "партнеры") {
        return sendMessage(bot, chatId, 'Партнеры тут', null, keyBoard.partners);
      }


    } catch (err) {
      logger("Не отработал сценарий бота", err);
      console.log(err);
    }*/


  });

  bot.start();
};


start();
