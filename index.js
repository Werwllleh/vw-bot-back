import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import dbConnect from './functions/dbConnect.js';
import fileUpload from 'express-fileupload';

import cookieParser from "cookie-parser";
import authRouter from './api/auth.js';
import carsRouter from './api/cars.js';
import userRouter from './api/users.js';
import rolesRouter from './api/roles.js';
import uploadRouter from './api/upload.js';
import partnersRouter from './api/partners.js';
import protectRouter from './api/protect.js';

import logger from './functions/logger.js';
import {} from "./db/user-methods.js";
import {getUserInfo} from "./services/users.js";
import {authenticateAccessToken} from "./services/auth.js";

const token = process.env.TOKEN;
const port = process.env.PORT;

process.env["NTBA_FIX_350"] = 1;

const app = express();

// const bot = new Bot(token);
export const bot = new TelegramBot(token, {polling: true});

const allowedOrigins = [
    process.env.URL_TEST,
    process.env.URL_FRONT,
    process.env.URL_FRONT_QA,
    process.env.URL_BOT,
    process.env.URL_CMS,
];

app.use(cors({
    origin: [
        process.env.URL_FRONT,
        process.env.URL_FRONT_QA,
        process.env.URL_BOT,
        process.env.URL_CMS,
        process.env.URL_TEST,
    ],
    credentials: true, // Разрешить отправку кук
}));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    // console.log(`Request origin: ${origin}`); // Логируем origin для диагностики
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        // console.log(`CORS allowed for origin: ${origin}`); // Логируем успешное добавление заголовка
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204); // Возвращаем preflight-ответ
    }
    next();
});


app.use(express.json());
app.use(cookieParser());

app.use(fileUpload({}));

app.listen(port, () => console.log(`App is listening on port ${port}.`));

app.get("/api", async (req, res) => {
    return res.json("work");
});

app.use("/api/car", express.static("img/cars"));
app.use("/api/image", express.static("upload/image"));
app.use("/api/bot", express.static("img/bot-data"));


app.use("/api", authRouter);
app.use("/api", carsRouter);
app.use("/api", userRouter);
app.use("/api", rolesRouter);
app.use("/api", uploadRouter);
app.use("/api", partnersRouter);
// app.use("/api", protectRouter);

app.use('/api', authenticateAccessToken, protectRouter);


const start = async () => {
    await dbConnect(); // Подключаем базу данных
}

start();