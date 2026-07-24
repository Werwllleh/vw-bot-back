import {Op} from 'sequelize';
import {Events} from '../models.js';

// Типы событий журнала дашборда.
export const EVENT_TYPES = {
  USER_REGISTERED: 'user_registered',
  CAR_ADDED: 'car_added',
  PARTNER_CREATED: 'partner_created',
  USER_UPDATED: 'user_updated',
  COMPANY_UPDATED: 'company_updated',
};

// Записывает событие в журнал. Fire-and-forget: любые ошибки логируются,
// но НЕ пробрасываются — журнал не должен ломать основную операцию.
export const logEvent = async (type, {chatId = null, payload = null} = {}) => {
  try {
    await Events.create({type, chatId, payload});
  } catch (error) {
    console.error(`Не удалось записать событие ${type}:`, error.message);
  }
};

// Keyset-пагинация по (createdAt DESC, id DESC).
// cursor — строка "createdAtISO|id" из предыдущей страницы (nextCursor).
const decodeCursor = (cursor) => {
  if (!cursor) return null;
  const idx = String(cursor).lastIndexOf('|');
  if (idx === -1) return null;
  const createdAt = new Date(String(cursor).slice(0, idx));
  const id = Number(String(cursor).slice(idx + 1));
  if (isNaN(createdAt.getTime()) || !Number.isInteger(id)) return null;
  return {createdAt, id};
};

const encodeCursor = (event) => `${new Date(event.createdAt).toISOString()}|${event.id}`;

export const listEvents = async ({cursor, limit = 15} = {}) => {
  const take = Math.min(Math.max(Number(limit) || 15, 1), 50);
  const decoded = decodeCursor(cursor);

  const where = decoded
    ? {
        [Op.or]: [
          {createdAt: {[Op.lt]: decoded.createdAt}},
          {createdAt: decoded.createdAt, id: {[Op.lt]: decoded.id}},
        ],
      }
    : {};

  const rows = await Events.findAll({
    where,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: take + 1, // +1 — чтобы понять, есть ли ещё
  });

  const hasMore = rows.length > take;
  const events = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? encodeCursor(events[events.length - 1]) : null;

  return {
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      chatId: e.chatId,
      payload: e.payload,
      createdAt: e.createdAt,
    })),
    nextCursor,
    hasMore,
  };
};
