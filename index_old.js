require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TOKEN;
const admins = process.env.ADMINS;

const adminsArr = admins.split(",").map(Number);

process.env["NTBA_FIX_350"] = 1;

const bot = new TelegramBot(token, { polling: true });
const {
  menu,
  reg,
  partners,
  ourcars,
  searchcar,
  profile,
  changeProfile,
  deleteProfile,
  stickers,
  feedListAdmin,
} = require("./keyboards");
const sequelize = require("./db");

const { Users, Feedbacks } = require("./models");

const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const { access, unlink, readdir } = require("fs");
const { v4: uuidv4 } = require("uuid");
const mv = require("mv");
const path = require("path");
const sharp = require("sharp");
const { json } = require("body-parser");
const e = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.use("/api/image/anims", express.static("img/anims"));
app.use("/api/image/stickers", express.static("img/stickers"));
app.use("/api/image", express.static("img/users_cars"));
app.use("/api/image/small", express.static("img/users_small"));

app.use("/api/icons", express.static("img/icons"));

app.use(cors());

app.use(fileUpload({}));

const port = process.env.PORT;

function sendIndividualMessage(chatId, text, photo) {
  try {
    if (photo) {
      bot.sendPhoto(chatId, photo);
    }
    return bot.sendMessage(chatId, text);
  } catch (error) {
    return bot.sendMessage(446012794, error);
  }
}

app.listen(port, () => console.log(`App is listening on port ${port}.`));

app.get("/api", async (req, res) => {
  return res.json("work");
});

/* ================== API для работы с пользователями ======================== */

// API получения данных пользователей из БД
app.post("/api/data", async (req, res) => {
  try {
    let data = await Users.findAll({
      order: [["id", "ASC"]],
    });
    return res.json(data);
  } catch (e) {
    res.status(500).send(e);
  }
});

// API обновления данных пользователей в БД
app.post("/api/updated-data", async (req, res) => {
  try {
    const updatedData = req.body;
    const chatId = updatedData.chatId;
    const column = updatedData.column;
    const value = updatedData.value;

    // Создаем объект с динамическими данными для обновления
    const updateFields = {};
    updateFields[column] = value;

    // Обновляем запись в таблице Users
    await Users.update(updateFields, {
      where: { chatId: chatId },
    });

    return res.status(200).send("OK");
  } catch (e) {
    return res.status(500).send(e);
  }
});

app.post("/api/delete-user", async (req, res) => {
  try {

    const userId = req.body.userId;

    await Users.destroy({
      where: { id: req.body.userId },
    });

    deleteUserImages(userId)

    return res.status(200).send("OK");
  } catch (error) {
    return res.status(500).send(e);
  }
})

/* ================== /API для работы с пользователями ======================== */

// API обновления кол-ва стикеров
app.post("/api/stickers-update", async (req, res) => {
  try {
    const response = axios.post(
      "https://script.google.com/macros/s/AKfycbwTu6m3wl_ZHt1_MHMbdQFi18KsDSCAF-9tz4U_5EclwrUAXy5LiTBCdb9imwvUS7Ev5w/exec",
      req.body
    );
    res.json(response.data);
  } catch (e) {
    res.status(500).send(e);
  }
});


/* ================== API отзывов ======================== */

// API добавления отзывов
app.post("/api/add-feedback", async (req, res) => {
  try {
    const response = req.body;
    let user = await Users.findOne({ where: { chatId: response.chatId } });

    let checkFeedback = await Feedbacks.findOne({
      where: { chatId: response.chatId },
    });

    const currentTime = require("./utils/getCurrentTime.js");

    if (!checkFeedback) {
      await Feedbacks.create({
        chatId: response.chatId,
        user: user.userName,
        rate: Number(response.data.rate),
        text: response.data.text.trimEnd(),
        anonymous: response.data.anonymous,
        date: new Date(),
      });
    } else {
      await Feedbacks.update(
        {
          rate: Number(response.data.rate),
          text: response.data.text.trimEnd(),
          anonymous: response.data.anonymous,
          date: new Date(),
          status: false,
          verified: false,
        },
        {
          where: { chatId: response.chatId },
        }
      );
    }

    adminsArr.map((chatId) => {
      sendIndividualMessage(chatId, "Добавлен новый отзыв", feedListAdmin);
    });

    return res.status(200).send("OK");
  } catch (e) {
    res.status(500).send(e);
  }
});

// API получения отзывов
app.post("/api/get-feedback", async (req, res) => {
  try {
    if (req.body.chatId) {
      const userChatId = req.body.chatId;

      const userFeedback = await Feedbacks.findOne({
        where: { chatId: userChatId },
      });

      const feedbacks = await Feedbacks.findAll({
        where: {
          verified: true,
          status: true,
        },
        order: [["date", "DESC"]],
      });

      const request = {
        currentFeedback: userFeedback,
        feedbacks: feedbacks,
      };

      return res.json(request);
    } else {
      const feedbacks = await Feedbacks.findAll({
        where: {
          verified: false,
        },
        order: [["date", "ASC"]],
      });

      const request = {
        feedbacks: feedbacks,
      };

      return res.json(request);
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

app.post("/api/history-feedbacks", async (req, res) => {
  try {
    const feedbacks = await Feedbacks.findAll({
      where: {
        verified: true,
      },
      order: [["date", "DESC"]],
    });

    const request = {
      feedbacks: feedbacks,
    };

    return res.json(request);
  } catch (e) {
    return res.status(500).send(e);
  }
});

// API одобрения отзывов
app.post("/api/verify-feedback", async (req, res) => {
  try {
    const verifyStatus = req.body.verifyStatus;
    const feedbackId = req.body.feedbackId;

    if (verifyStatus) {
      await Feedbacks.update(
        {
          status: true,
          verified: true,
        },
        {
          where: { id: feedbackId },
        }
      );
    } else {
      await Feedbacks.update(
        {
          status: false,
          verified: true,
        },
        {
          where: { id: feedbackId },
        }
      );
    }

    return res.status(200).send("OK");
  } catch (e) {
    return res.status(500).send("Internal Server Error");
  }
});

/* ================== /API отзывов ======================== */



app.post("/api/searchcar", async (req, res) => {
  try {
    const searchName = req.body.searcheble;
    if (searchName !== "") {
      let searchCarNum = await Users.findOne({ where: { carGRZ: searchName } });
      return res.json(searchCarNum);
    } else {
      return res.json(null);
    }
  } catch (e) {
    res.status(500).send(e);
  }
});

app.post("/api/set-location", async (req, res) => {
  try {
    return res.json('Место принято');
  } catch (error) {
    res.status(500).send(e);
  }
})

app.get("/api/stickers", async (req, res) => {
  try {
    readdir(
      path.resolve(__dirname, "..", "bot-back/img/stickers"),
      (err, files) => {
        let stickers = [];

        files.forEach((fileName) => {
          stickers.push(fileName);
        });

        res.json({
          files: stickers,
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/upload", async (req, res) => {
  try {
    if (req.files.avatar) {
      let { avatar } = req.files;
      let type = avatar.name.split(".").pop();
      let fileName = uuidv4(avatar.name) + "." + type;
      await avatar.mv(
        path.resolve(__dirname, "..", "bot-back/img/users_cars", fileName)
      );

      return res.json(fileName);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

async function resizeImage() {
  try {
    readdir(
      path.resolve(__dirname, "..", "bot-back/img/users_cars"),
      (err, files) => {
        files.forEach((smallCard) => {
          const metadata = sharp(
            path.resolve(__dirname, "..", "bot-back/img/users_cars", smallCard)
          ).metadata();

          metadata.then(function (photoData) {
            let orientationPhoto = photoData.orientation;

            let wPhoto = Math.ceil(
              photoData.width - (photoData.width * 60) / 100
            );
            let hPhoto = Math.ceil(
              photoData.height - (photoData.height * 60) / 100
            );

            if (orientationPhoto === 6) {
              sharp(
                path.resolve(
                  __dirname,
                  "..",
                  "bot-back/img/users_cars",
                  smallCard
                )
              )
                .rotate(90)
                .resize(wPhoto, hPhoto)
                .toFormat("jpeg", { mozjpeg: true, quality: 65 })
                .toFile(
                  path.resolve(
                    __dirname,
                    "..",
                    "bot-back/img/users_small",
                    smallCard + "_" + "small.jpeg"
                  )
                );
            } else if (orientationPhoto === 3) {
              sharp(
                path.resolve(
                  __dirname,
                  "..",
                  "bot-back/img/users_cars",
                  smallCard
                )
              )
                .rotate(180)
                .resize(wPhoto, hPhoto)
                .toFormat("jpeg", { mozjpeg: true, quality: 65 })
                .toFile(
                  path.resolve(
                    __dirname,
                    "..",
                    "bot-back/img/users_small",
                    smallCard + "_" + "small.jpeg"
                  )
                );
            } else {
              sharp(
                path.resolve(
                  __dirname,
                  "..",
                  "bot-back/img/users_cars",
                  smallCard
                )
              )
                .resize(wPhoto, hPhoto)
                .toFormat("jpeg", { mozjpeg: true, quality: 65 })
                .toFile(
                  path.resolve(
                    __dirname,
                    "..",
                    "bot-back/img/users_small",
                    smallCard + "_" + "small.jpeg"
                  )
                );
            }
          });
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
}

app.post("/api/upload/remove", async (req, res) => {
  try {
    let { response } = req.body;
    if (response !== " ") {
      access(
        path.resolve(__dirname, "..", "bot-back/img/users_cars", response),
        (err) => {
          if (err) {
            return res.json("err");
          }
          unlink(
            path.resolve(__dirname, "..", "bot-back/img/users_cars", response),
            (err) => {
              if (err) return console.log(err);
              // console.log("file deleted successfully");
            }
          );
        }
      );
    }
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/change", async (req, res) => {
  try {
    let changedData = req.body.changedData; //получаем новые данные
    let searchUser = await Users.findOne({
      where: { chatId: changedData.curUser },
    }); //смотрим старые данные в БД

    if (searchUser.carImage) {
      unlink(
        path.resolve(
          __dirname,
          "..",
          "bot-back/img/users_cars",
          searchUser.carImage
        ),
        (err) => {
          if (err) console.log(err);
          console.log("original photo was deleted");
        }
      );
    }

    if (searchUser.carImage + "_" + "small.jpeg" !== undefined) {
      unlink(
        path.resolve(
          __dirname,
          "..",
          "bot-back/img/users_small",
          searchUser.carImage + "_" + "small.jpeg"
        ),
        (err) => {
          if (err) console.log(err);
          console.log("preview photo was deleted");
        }
      );
    }

    const metadata = sharp(
      path.resolve(
        __dirname,
        "..",
        "bot-back/img/users_cars",
        changedData.carImage
      )
    ).metadata();

    metadata.then(function (photoData) {
      let orientationPhoto = photoData.orientation;

      let wPhoto = Math.ceil(photoData.width - (photoData.width * 60) / 100);
      let hPhoto = Math.ceil(photoData.height - (photoData.height * 60) / 100);

      if (orientationPhoto === 6) {
        sharp(
          path.resolve(
            __dirname,
            "..",
            "bot-back/img/users_cars",
            changedData.carImage
          )
        )
          .rotate(90)
          .resize(wPhoto, hPhoto)
          .toFormat("jpeg", { mozjpeg: true, quality: 65 })
          .toFile(
            path.resolve(
              __dirname,
              "..",
              "bot-back/img/users_small",
              changedData.carImage + "_" + "small.jpeg"
            )
          );
      } else if (orientationPhoto === 3) {
        sharp(
          path.resolve(
            __dirname,
            "..",
            "bot-back/img/users_cars",
            changedData.carImage
          )
        )
          .rotate(180)
          .resize(wPhoto, hPhoto)
          .toFormat("jpeg", { mozjpeg: true, quality: 65 })
          .toFile(
            path.resolve(
              __dirname,
              "..",
              "bot-back/img/users_small",
              changedData.carImage + "_" + "small.jpeg"
            )
          );
      } else {
        sharp(
          path.resolve(
            __dirname,
            "..",
            "bot-back/img/users_cars",
            changedData.carImage
          )
        )
          .resize(wPhoto, hPhoto)
          .toFormat("jpeg", { mozjpeg: true, quality: 65 })
          .toFile(
            path.resolve(
              __dirname,
              "..",
              "bot-back/img/users_small",
              changedData.carImage + "_" + "small.jpeg"
            )
          );
      }
    });

    await Users.update(
      {
        carbrand: changedData.carBrand,
        carModel: changedData.carModel,
        carYear: changedData.carYear.trimEnd(),
        carGRZ: changedData.carNum.trimEnd(),
        carNote: changedData.carNote.toLowerCase().trimEnd(),
        carImage: changedData.carImage,
      },
      {
        where: { chatId: changedData.curUser },
      }
    );
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/order", async (req, res) => {
  try {
    let orderData = req.body.orderData;
    console.log(orderData);

    let textForSeller = `ОСТАВЛЕНА НОВАЯ ЗАЯВКА❗️❗️❗️\n\n${orderData?.user?.username
      ? `Покупатель - @${orderData?.user?.username}`
      : ""
      }\n${`Телефон: ${orderData?.phone.replace(
        /[ ()]/g,
        ""
      )}`}\n\nХочет купить:\n\n${orderData?.cart?.map(
        (item) => `${item?.title} - ${item?.count} шт\n`
      )}\nРайон самовывоза - ${orderData.selectedPlace}\n${orderData.comment.length ? `Комментарий: ${orderData.comment}` : ""
      }\n\nИтого:\nОбщее количество: ${orderData.cartTotalCount} шт\nСумма: ${orderData.cartTotalSum
      } ₽`;

    sendIndividualMessage(orderData?.sellerChatId, textForSeller);

    let textForBuyer = `Спасибо за заказ🤗\n\nС вами свяжутся в ближайшее время`;

    sendIndividualMessage(orderData?.user?.id, textForBuyer);
  } catch (error) {
    console.log(error);
  }
});

// const users = [446012794, 446012794, 446012794, 446012794];

async function deleteUserImages(userId) {

  try {
    let user = await Users.findOne({
      where: { id: userId },
    });

    const photo = user.dataValues.carImage;

    if (photo) {

      unlink(
        path.resolve(
          __dirname,
          "..",
          "bot-back/img/users_cars",
          photo
        ),
        (err) => {
          if (err) console.log(err);
          console.log("original photo was deleted");
        }
      );
    }

    if (photo + "_" + "small.jpeg" !== undefined) {
      unlink(
        path.resolve(
          __dirname,
          "..",
          "bot-back/img/users_small",
          photo + "_" + "small.jpeg"
        ),
        (err) => {
          if (err) console.log(err);
          console.log("preview photo was deleted");
        }
      );
    }


  } catch (error) {
    console.log(error);
  }

}

async function checkUser(chatId) {
  try {

    let user = await Users.findOne({
      where: { chatId: chatId },
    });

    return user;

  } catch (error) {
    console.log(error);
  }
}

const mailing = async (msgText, notifyDate, place) => {
  try {
    let index = 0;
    const users = await Users.findAll();

    const sendMessages = () => {
      if (index < users.length) {
        const user = users[index];
        let chatId = user.chatId;
        bot.sendMessage(chatId, msgText);
        if (place) {
          bot.sendLocation(chatId, place[0], place[1]);
        }

        index++;
      } else {
        // Если достигнут конец массива, останавливаем интервал
        clearInterval(checkTime);
        sendIndividualMessage(446012794, "Рассылка завершена");
      }
    };

    let checkTime = setInterval(() => {
      let currentDate = Date.parse(new Date());

      // Сравнение текущей даты с заданной датой
      if (currentDate >= notifyDate) {
        sendMessages();
      } else {
        console.log("Еще нет");
      }
    }, 3000); // Интервал в миллисекундах
  } catch (error) {
    console.log(error);
  }
};

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Connection has been established successfully.");
  } catch (e) {
    console.log("Подключение к бд сломалось", e);
  }

  bot.setMyCommands([
    { command: "/info", description: "О клубе" },
    { command: "/faq", description: "Что случилось с ботом?" },
    { command: "/start", description: "Обновление/перезапуск бота" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {

      if (text === "/send_notify" && chatId === 446012794) {
        const msgText =
          "Привет, встреча состоится сегодня в 18:00 на парковке ТРК Контур";
        const notifyDate = new Date("2024-08-25T13:00:00.000Z"); // считать +3ч от сервера, формат YYYY-MM-DD
        // const place = [56.136203, 47.238343]; //Каскад Нижняя Парковка
        // const place = [56.143734, 47.237596]; //ТОиБ
        const place = [56.129498, 47.163266]; //ТРК Контур

        mailing(msgText, notifyDate, place);

        return bot.sendMessage(chatId, `Таймер запущен успешно`, menu);
      }

      if (text === "/start") {
        return bot.sendMessage(
          chatId,
          `Добро пожаловать в телеграм бота VAG клуба Чебоксар!`,
          menu
        );

        // let userChatId = await Users.findOne({ where: { chatId: chatId } });
        // if (userChatId)
        // {
        //   return bot.sendMessage(chatId, `Привет, что тебя интересует? `, menu);
        // } else
        // {
        //   return bot.sendMessage(
        //     chatId,
        //     `Добро пожаловать в телеграм бота VAG клуба Чебоксар!\nПожалуйста пройди регистрацию`,
        //     reg
        //   );
        // }
      }

      if (text === "/info") {
        return bot.sendMessage(
          chatId,
          `Привет привееет!\nНа связи VW/SK CLUB 21 - крупнейшее автосообщество ваговодов Чувашии☝🏻\n\nМы - одна большая семья, которая держится друг за друга, делится своими радостями и неудачами, а все остальные переживают это, помогают в решении вопроса и поддерживают!\nВсе любят покрасоваться своими ласточками и мы не исключение💥\nВвиду этого у нас стабильно проходят автовстречи, где собирается вся наша дружная семья и обсуждает все события в большом кругу.\nА затем флаги в руки и в конвой.\nМы проезжаем по центральным улицам Чебоксар, чтобы показать нашу активность и дружность.\nНе забудем сказать и про партнеров, которых у нас немало. И этот список постоянно пополняется. От доставки еды до ремонта турбины - огромное количество сфер готовы предоставить клубную скидку для таких умничек и молодцов😂😂\n\nУ тебя нет ВАГа, но ты настоящий фанат немецкого автопрома? Не переживай и приходи на встречу🥰 Мы любим и уважаем каждого участника.\nДумаем, что стало немного понятнее.\nПоэтому чего ждать - добро пожаловать к нам в клуб!!!🎉🎊🎉🎊🎉`
        );

      }

      if (text === "/faq" | (text === "Что с ботом?")) {
        return bot.sendMessage(
          chatId,
          `Привет!\n\nПереживать не стоит, Бот ушел на очередное обновление. Ты по прежнему можешь узнать дату встречи клуба или ознакомиться со списком партнеров, а мы за это время постараемся сделать Бота еще удобнее и интереснее.\n\nСпасибо за понимание!`
        );

      }

      if ((text === "КВЕСТ!") | (text === "Ближайшая встреча")) {
        // await bot.sendPhoto(chatId, './img/event.jpeg');
        // await bot.sendLocation(chatId, 56.135323, 47.24285);
        // return bot.sendMessage(
        //   chatId,
        //   `Дата: 10/03/2024\nВремя: 20:00\nМесто: ТЦ Карусель`,
        //   menu
        // );

        // bot.sendPhoto(chatId, './img/event.jpeg');
        // bot.sendLocation(chatId, 56.129498, 47.163266); //ТРК Контур
        // return bot.sendMessage(
        //   chatId,
        //   `Дата: 25/08/2024\nВремя: 18:00\nМесто: Парковка ТРК Контур`,
        //   menu
        // );

        // bot.sendPhoto(chatId, "./img/event.jpeg");
        // bot.sendLocation(chatId, 56.143734, 47.237596);
        // return bot.sendMessage(
        //   chatId,
        //   `Дата: 29/09/2024\nВремя: 20:00\nМесто: Театр Оперы и Балета`,
        //   menu
        // );

        // await bot.sendLocation(chatId, 56.128866, 47.494701);
        // return (
        //   bot.sendMessage(
        //     chatId,
        //     `Дата: 29/10/2023\nВремя: 20:00\nМесто: г. ​Новочебоксарск, Нижняя набережная`,
        //     menu
        //   )
        // )

        // await bot.sendPhoto(chatId, "./img/event.jpeg");
        // return bot.sendLocation(chatId, 56.143734, 47.237596, menu);

        return bot.sendMessage(chatId, `Встречаемся в октябре✌️`, menu);

        // await bot.sendLocation(chatId, 56.136373, 47.238436);
        // return (
        // 	bot.sendMessage(
        // 		chatId,
        // 		`Приглашаем тебя на квест 28 апреля😉\nДата: 06/08/2023\nВремя: 20:00\nМесто: Театр Оперы и Балета`,
        // 		menu
        // 	)
        // )

        /* 56.135323, 47.242850 */ //карусель
        /* 56.129276, 47.299828 */ //Фердинанд-моторс
        /* 56.143734, 47.237596 */ //ТОиБ

        // await bot.sendVideo(chatId, './img/preview-quest.mp4', options = { has_spoiler: true });
        // await bot.sendLocation(chatId, 56.129276, 47.299828);
        // return (
        // 	bot.sendMessage(
        // 		chatId,
        // 		`Дата: 22/04/2023\nВремя: 12:00\nАдрес: Чебоксары, Марпосадское шоссе, 3Д\nЗдание: Фердинанд Моторс Альянс-авто`,
        // 		menu
        // 	)
        // )
      }

      if (text === "Партнеры") {
        return bot.sendMessage(
          chatId,
          `Выбери партнера и получи скидку 👇`,
          partners
        );
      }

      // if (text === "Наши авто") {
      //   return bot.sendMessage(
      //     chatId,
      //     `Фотографии автомобилей участников 👇`,
      //     ourcars
      //   );
      // }
      // if (text === "Поиск авто") {
      //   return bot.sendMessage(
      //     chatId,
      //     `Перейди, если хочешь найти авто по номеру 👇`,
      //     searchcar
      //   );
      // }
      // if (text === "Профиль") {
      //   return bot.sendMessage(
      //     chatId,
      //     `Что хочешь сделать с профилем?`,
      //     profile
      //   );
      // }
      // if (text === "Отредактировать профиль") {
      //   return bot.sendMessage(
      //     chatId,
      //     "Перейди, если хочешь изменить данные своего профиля  👇",
      //     changeProfile
      //   );
      // }
      // if (text === "УДАЛИТЬ профиль") {
      //   return bot.sendMessage(chatId, "Вы уверены?", deleteProfile);
      // }
      // if (text === "Нет, вернуться в меню") {
      //   return bot.sendMessage(chatId, `Что тебя интересует?`, menu);
      // }
      // if (text === "Меню") {
      //   return bot.sendMessage(chatId, `Что тебя интересует?`, menu);
      // }
      // if (
      //   (text === "Купить клубную наклейку/ароматизатор") |
      //   (text === "Клубная атрибутика")
      // ) {
      //   return bot.sendMessage(chatId, `Клубная атрибутика там 👇`, stickers);
      // }

      // if (text === "Посмотреть мой профиль") {
      //   try {
      //     let profile = await Users.findOne({ where: { chatId: chatId } });
      //     if (profile.carImage) {
      //       await bot.sendPhoto(
      //         chatId,
      //         path.resolve(
      //           __dirname,
      //           "..",
      //           "bot-back/img/users_cars",
      //           profile.carImage
      //         )
      //       );
      //     }
      //     return bot.sendMessage(
      //       chatId,
      //       `Вы: ${profile.userName}\nВаше авто: ${profile.carbrand} ${profile.carModel
      //       }\nГод выпуска: ${profile.carYear}\nНомер авто: ${profile.carGRZ
      //       }\n${profile.carNote ? "Примечание: " + profile.carNote : ""}`,
      //       profile
      //     );
      //   } catch (error) {
      //     console.log(error);
      //   }
      // }

      // if (text === "Да, хочу удалить профиль") {
      //   try {
      //     let profile = await Users.findOne({ where: { chatId: chatId } });
      //     unlink(
      //       path.resolve(
      //         __dirname,
      //         "..",
      //         "bot-back/img/users_cars",
      //         profile.carImage
      //       ),
      //       (err) => {
      //         if (err) console.log(err);
      //       }
      //     );
      //     unlink(
      //       path.resolve(
      //         __dirname,
      //         "..",
      //         "bot-back/img/users_small",
      //         profile.carImage + "_" + "small.jpeg"
      //       ),
      //       (err) => {
      //         if (err) console.log(err);
      //       }
      //     );
      //     await Users.destroy({
      //       where: {
      //         chatId: chatId,
      //       },
      //     });
      //   } catch (error) {
      //     console.log(error);
      //   }
      //   await bot.sendMessage(
      //     chatId,
      //     `Ваш профиль удален, нельзя отворачиваться от семьи 😢😭`
      //   );
      //   return bot.sendMessage(chatId, `Пожалуйста пройди регистрацию 🙏`, reg);
      // }

    } catch (error) {
      return bot.sendMessage(chatId, "Произошла какая то ошибка!", menu);
    }

    if (msg?.web_app_data?.data) {
      try {
        const data = await JSON.parse(msg?.web_app_data?.data);

        await Users.create({
          chatId: chatId,
          userName: data.name.trimEnd(),
          carModel: data.carModel,
          carYear: data.carYear.trimEnd(),
          carGRZ: data.carNum.trimEnd(),
          carNote: data.carNote.toLowerCase().trimEnd(),
          carImage: data.carImage,
          carbrand: data.carBrand,
        });

        const metadata = await sharp(
          path.resolve(
            __dirname,
            "..",
            "bot-back/img/users_cars",
            data.carImage
          )
        ).metadata();
        let orientationPhoto = metadata.orientation;
        let wPhoto = Math.ceil(metadata.width - (metadata.width * 60) / 100);
        let hPhoto = Math.ceil(metadata.height - (metadata.height * 60) / 100);

        if (orientationPhoto === 6) {
          await sharp(
            path.resolve(
              __dirname,
              "..",
              "bot-back/img/users_cars",
              data.carImage
            )
          )
            .rotate(90)
            .resize(wPhoto, hPhoto)
            .toFormat("jpeg", { mozjpeg: true, quality: 65 })
            .toFile(
              path.resolve(
                __dirname,
                "..",
                "bot-back/img/users_small",
                data.carImage + "_" + "small.jpeg"
              )
            );
        } else if (orientationPhoto === 3) {
          await sharp(
            path.resolve(
              __dirname,
              "..",
              "bot-back/img/users_cars",
              data.carImage
            )
          )
            .rotate(180)
            .resize(wPhoto, hPhoto)
            .toFormat("jpeg", { mozjpeg: true, quality: 65 })
            .toFile(
              path.resolve(
                __dirname,
                "..",
                "bot-back/img/users_small",
                data.carImage + "_" + "small.jpeg"
              )
            );
        } else {
          await sharp(
            path.resolve(
              __dirname,
              "..",
              "bot-back/img/users_cars",
              data.carImage
            )
          )
            .resize(wPhoto, hPhoto)
            .toFormat("jpeg", { mozjpeg: true, quality: 65 })
            .toFile(
              path.resolve(
                __dirname,
                "..",
                "bot-back/img/users_small",
                data.carImage + "_" + "small.jpeg"
              )
            );
        }

        sendIndividualMessage(446012794, `Новая регистрация - ${data.carBrand} ${data.carModel}\nВладелец - ${data.name}`, `${path.resolve(__dirname, "..", "bot-back/img/users_cars", data.carImage)}`);
        return bot.sendMessage(
          chatId,
          `Добро пожаловать ${data.name.trimEnd()}!\nЧто тебя интересует?`,
          menu
        );
      } catch (e) {
        console.log(e);
      }
    }
  });
};

start();
