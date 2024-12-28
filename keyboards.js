import 'dotenv/config';

const webAppUrl = process.env.URL;


export const keyBoard = {
  menu: {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Открыть приложение",
            web_app: {url: webAppUrl},
            // request_location: true
          },
          {
            text: "Партнеры",
            web_app: {url: webAppUrl + "/partners"},
            // request_location: true
          },
          {
            text: "Встреча клуба",
            web_app: {url: webAppUrl + "/meet"},
            // request_location:true
          },
        ],
      ],
    },
  },
  partners: {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Партнеры",
            web_app: {url: webAppUrl + "/partners"},
            // request_location:true
          },
        ],
      ],
    },
  },
  meet: {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Встреча клуба",
            web_app: {url: webAppUrl + "/meet"},
            // request_location:true
          },
        ],
      ],
    },
  },
  reg: {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Регистрация",
            web_app: {url: webAppUrl},
          },
        ],
      ],
    },
  },
};
