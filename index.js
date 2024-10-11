require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const express = require("express");
const cors = require("cors");
const dbConnect = require("./functions/dbConnect");
const { Users } = require("./models");

const token = process.env.TOKEN_TEST;
const port = process.env.PORT;

process.env["NTBA_FIX_350"] = 1;

const app = express();
const bot = new TelegramBot(token, { polling: true });

app.use(express.json());
app.use(cors());
app.listen(port, () => console.log(`App is listening on port ${port}.`));


const start = async () => {

  await dbConnect();

}

start();
