import rateLimit from 'express-rate-limit';

// Строгий лимитер для аутентификации (логин/refresh) — защита от брутфорса.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 30,                  // не более 30 запросов с IP за окно
  standardHeaders: true,
  legacyHeaders: false,
  message: {error: 'Слишком много запросов, попробуйте позже'},
});

// Общий лимитер для остального API.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 120,            // не более 120 запросов с IP в минуту
  standardHeaders: true,
  legacyHeaders: false,
  message: {error: 'Слишком много запросов, попробуйте позже'},
});
