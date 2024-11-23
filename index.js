import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import dbConnect from './functions/dbConnect.js';
import fileUpload from 'express-fileupload';


import carsRouter from './api/cars.js';
import userRouter from './api/users.js';


import sendMessage from './functions/sendMessage.js';
import logger from './functions/logger.js';
import {keyBoard} from "./keyboards.js";
import {getUserInfo} from "./db/user-methods.js";

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

app.use("/api/car", express.static("img/cars"));
app.use("/api/bot", express.static("img/bot-data"));

app.use("/api", carsRouter);
app.use("/api", userRouter);

const start = async () => {
  await dbConnect(); // Подключаем базу данных

  await bot.setMyCommands([
    { command: "/info", description: "О клубе" },
    { command: "/go", description: "Тест функция" },
    { command: "/start", description: "Обновление/перезапуск бота" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text.toLowerCase();
    const chatId = msg.chat.id;

    console.log(text);
    console.log(chatId);

    try {
      if (text === "/start") {
        return sendMessage(bot, chatId, 'Test log', null, keyBoard.menu);
      }

      if (text === "регистрация") {
        return sendMessage(bot, chatId, 'Test log', null, keyBoard.reg);
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
