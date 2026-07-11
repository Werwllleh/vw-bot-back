import { webcrypto } from 'crypto';
// globalThis.crypto = webcrypto;
import {jwtVerify, SignJWT} from "jose";

// Секретный ключ для подписи токенов
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

// Генерация Access Token
export const generateAccessToken = async (payload) => {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Срок действия: 15 минут
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

export const authenticateAccessToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: 'missing token' });
    }

    const decoded = await verifyToken(accessToken);
    req.user = decoded;

    console.log(req.user)
    console.log('----------------------------')
    console.log(decoded)
    console.log('-- -- -- --- --- -- -- --- --- -- ----')

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({ error: 'jwt expired' });
    }
    return res.status(403).json({ error: 'invalid token' });
  }
};
