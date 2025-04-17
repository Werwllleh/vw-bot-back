import { webcrypto } from 'crypto';
// globalThis.crypto = webcrypto;
import { SignJWT, jwtVerify } from 'jose';

// Секретный ключ для подписи токенов
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// Генерация Access Token
export const generateAccessToken = async (payload) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // Срок действия: 15 минут
    .sign(secretKey);
};

// Генерация Refresh Token
export const generateRefreshToken = async (payload) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Срок действия: 7 дней
    .sign(secretKey);
};

// Проверка токена
export const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
