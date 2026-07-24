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
import uploadRouter from './api/upload.js';
import partnersRouter from './api/partners.js';
import cmsRouter from "./api/cms.js";
import protectRouter from './api/protect.js';
import {apiLimiter} from './functions/rateLimit.js';

import logger from './functions/logger.js';
import {authenticateAccessToken} from "./services/auth.js";


const token = process.env.TOKEN;
const port = process.env.PORT;

process.env["NTBA_FIX_350"] = 1;

const app = express();

// Приложение работает за nginx — доверяем первому прокси,
// чтобы rate-limit и логика видели реальный IP клиента (X-Forwarded-For).
app.set('trust proxy', 1);

// const bot = new Bot(token);
export const bot = new TelegramBot(token, {polling: true});

const allowedOrigins = [
    process.env.URL_TEST,
    process.env.URL_FRONT,
    process.env.URL_FRONT_QA,
    process.env.URL_BOT,
    process.env.URL_CMS,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cookieParser());
app.use(express.json());

app.use(fileUpload({}));

app.listen(port, () => console.log(`App is listening on port ${port}.`));

app.get("/api", async (req, res) => {
    return res.json("work");
});

app.use("/api/car", express.static("img/cars"));
app.use("/api/image", express.static(process.env.IMAGES_DIR));
app.use("/api/bot", express.static("img/bot-data"));


// Общий rate-limit на всё API (кроме статики выше)
app.use("/api", apiLimiter);

app.use("/api", authRouter);
app.use("/api", carsRouter);
app.use("/api", userRouter);
app.use("/api", uploadRouter);
app.use("/api", partnersRouter);
app.use("/api", cmsRouter);

app.use('/api', authenticateAccessToken, protectRouter);


const start = async () => {
    await dbConnect(); // Подключаем базу данных
}

start();
