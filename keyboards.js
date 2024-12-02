import 'dotenv/config';

const webAppUrl = process.env.URL;

export const keyBoard = {
  // menu: {
  // 	reply_markup: {
  // 		// Добавляем все кнопки
  // 		keyboard: [
  // 			[{ text: 'Ближайшая встреча' }, { text: 'Партнеры' }],
  // 			[{ text: 'Наши авто' }, { text: 'Продажа авто' }],
  // 			[{ text: 'Поиск авто' }, { text: 'Запросить помощь' }],
  // 			[{ text: 'Профиль' }, { text: 'Поддержать клуб' }],
  // 		],
  // 	}
  // },
  menu: {
    reply_markup: {
      keyboard: [
        [
          {text: "Ближайшая встреча"},
          {
            text: "Партнеры",
            web_app: {url: webAppUrl + "/partners"},
            request_location: true
          },
        ],
        [
          {
            text: "Профиль",
            web_app: {url: webAppUrl + "/profile"},
            request_location: true
          },
          {text: "Регистрация"}
        ],
      ],
    },
  },
  partners: {
    reply_markup: {
      keyboard: [
        [
          {
            text: "Партнеры",
            web_app: {url: webAppUrl + "/partners"},
            // request_location: true
          },
        ],
      ],
      /*inline_keyboard: [
        [
          {
            text: "Список партнеров",
            web_app: { url: webAppUrl + "/partners" },
            request_location:true
          },
        ],
      ],*/
    },
  },
  reg: {
    reply_markup: {
      keyboard: [
        [
          {
            text: "Регистрация",
            web_app: {url: webAppUrl + "/registration"},
          },
        ],
      ],
    },
  },
  // ourcars: {
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "Автомобили участников клуба",
  //           web_app: { url: webAppUrl },
  //         },
  //       ],
  //     ],
  //   },
  // },
  // searchcar: {
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "Поиск автомобиля участника клуба",
  //           web_app: { url: webAppUrl + "/searchcar" },
  //         },
  //       ],
  //     ],
  //   },
  // },
  // profile: {
  //   reply_markup: {
  //     keyboard: [
  //       [
  //         { text: "Посмотреть мой профиль" },
  //         { text: "Отредактировать профиль" },
  //       ],
  //       [{ text: "УДАЛИТЬ профиль" }],
  //       [{ text: "Меню" }],
  //     ],
  //   },
  // },
  // deleteProfile: {
  //   reply_markup: {
  //     keyboard: [
  //       [
  //         { text: "Нет, вернуться в меню" },
  //         { text: "Да, хочу удалить профиль" },
  //       ],
  //     ],
  //   },
  // },
  // changeProfile: {
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "Страница изменения данных",
  //           web_app: { url: webAppUrl + "/form/change" },
  //         },
  //       ],
  //     ],
  //   },
  // },
  // editprofile: {
  //   reply_markup: {
  //     keyboard: [
  //       [{ text: "Изменить авто" }, { text: "Изменить номер авто" }],
  //       [{ text: "Изменить год авто" }, { text: "Изменить примечание" }],
  //       [{ text: "Меню" }],
  //     ],
  //   },
  // },
  // stickers: {
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "Магазин",
  //           web_app: { url: webAppUrl + "/stickers" },
  //         },
  //       ],
  //     ],
  //   },
  // },
  // cart: {
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "Корзина",
  //           web_app: { url: webAppUrl + "/cart" },
  //         },
  //       ],
  //     ],
  //   },
  // },
  // feedListAdmin: {
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "Список новых отзывов",
  //           web_app: { url: webAppUrl + "/feedback-list" },
  //         },
  //       ],
  //     ],
  //   },
  // },
};
