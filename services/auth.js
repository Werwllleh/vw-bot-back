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
    .setExpirationTime('1h') // Срок действия access-токена: 1 час
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

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.code === 'ERR_JWT_EXPIRED') {
      return res.status(401).json({ error: 'jwt expired' });
    }
    return res.status(403).json({ error: 'invalid token' });
  }
};

// Guard по ролям. Ставится ПОСЛЕ authenticateAccessToken (нужен req.user.chatId).
// Грузит эффективные роли пользователя, кладёт req.currentUser и проверяет доступ.
export const requireRole = (...allowed) => async (req, res, next) => {
  // ленивый импорт, чтобы избежать циклической зависимости services/roles -> models -> db
  const {getUserWithRoles} = await import('./roles.js');

  try {
    const chatId = req.user?.chatId;
    if (chatId == null) {
      return res.status(401).json({error: 'unauthorized'});
    }

    const current = await getUserWithRoles(chatId);
    if (!current) {
      return res.status(401).json({error: 'user not found'});
    }

    req.currentUser = current;

    const ok = allowed.some((role) => current.roles.includes(role));
    if (!ok) {
      return res.status(403).json({error: 'forbidden'});
    }

    return next();
  } catch (err) {
    console.error('requireRole error:', err);
    return res.status(500).json({error: 'role check failed'});
  }
};
