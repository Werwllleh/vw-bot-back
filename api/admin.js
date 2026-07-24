import express from 'express';
import {authenticateAccessToken, requireRole} from '../services/auth.js';
import {ROLES, ADMIN_LEVEL, getUserWithRoles, setUserRole, listUsers} from '../services/roles.js';
import {attachCompany, detachCompany} from '../services/companies.js';
import {getPartnersCount} from '../services/cms.js';
import {listEvents} from '../services/events.js';
import {Users, Cars} from '../models.js';

export const adminRouter = express.Router();

// Все /admin/* требуют валидный access-токен.
adminRouter.use('/admin', authenticateAccessToken);

// Маппинг доменных ошибок сервисов в HTTP-ответы.
const ERROR_STATUS = {
  INVALID_ROLE: [400, 'Недопустимая роль'],
  CANNOT_DEMOTE_SUPERADMIN: [403, 'Нельзя понизить главного супер-администратора'],
  USER_NOT_FOUND: [404, 'Пользователь не найден'],
  ROLE_NOT_SEEDED: [500, 'Роль не найдена в справочнике — запустите миграции'],
  INVALID_COMPANY_ID: [400, 'Некорректный companyId'],
  COMPANY_NOT_FOUND: [404, 'Компания не найдена в CMS'],
};

const handleError = (res, err) => {
  const mapped = ERROR_STATUS[err.message];
  if (mapped) return res.status(mapped[0]).json({error: mapped[1]});
  console.error('admin route error:', err);
  return res.status(500).json({error: 'internal error'});
};

// Эффективные роли текущего пользователя (для гейта фронта).
adminRouter.get('/admin/me', requireRole(...ADMIN_LEVEL), (req, res) => {
  res.status(200).json({user: req.currentUser});
});

// Журнал событий для дашборда (keyset-пагинация по 15).
adminRouter.get('/admin/events', requireRole(...ADMIN_LEVEL), async (req, res) => {
  try {
    const result = await listEvents({cursor: req.query.cursor, limit: req.query.limit});
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// Статистика для дашборда: пользователи, авто, партнёры (партнёры — из CMS).
adminRouter.get('/admin/stats', requireRole(...ADMIN_LEVEL), async (req, res) => {
  try {
    const [users, cars, partners] = await Promise.all([
      Users.count(),
      Cars.count(),
      getPartnersCount(),
    ]);
    res.status(200).json({users, cars, partners});
  } catch (err) {
    handleError(res, err);
  }
});

// Список пользователей с ролями и компаниями. Поиск по chatId и имени.
adminRouter.get('/admin/users', requireRole(...ADMIN_LEVEL), async (req, res) => {
  try {
    const users = await listUsers({search: req.query.search});
    res.status(200).json({users});
  } catch (err) {
    handleError(res, err);
  }
});

// Назначение роли — только superadmin.
adminRouter.post('/admin/roles', requireRole(ROLES.SUPERADMIN), async (req, res) => {
  const {chatId, role} = req.body || {};
  if (chatId == null || !role) {
    return res.status(400).json({error: 'chatId и role обязательны'});
  }
  try {
    const user = await setUserRole(chatId, role);
    res.status(200).json({user});
  } catch (err) {
    handleError(res, err);
  }
});

// Прикрепление компании — admin|superadmin.
adminRouter.post('/admin/companies/attach', requireRole(...ADMIN_LEVEL), async (req, res) => {
  const {chatId, companyId} = req.body || {};
  if (chatId == null || companyId == null) {
    return res.status(400).json({error: 'chatId и companyId обязательны'});
  }
  try {
    const result = await attachCompany(chatId, companyId);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

// Открепление компании — admin|superadmin.
adminRouter.post('/admin/companies/detach', requireRole(...ADMIN_LEVEL), async (req, res) => {
  const {chatId, companyId} = req.body || {};
  if (chatId == null || companyId == null) {
    return res.status(400).json({error: 'chatId и companyId обязательны'});
  }
  try {
    const result = await detachCompany(chatId, companyId);
    res.status(200).json(result);
  } catch (err) {
    handleError(res, err);
  }
});

export default adminRouter;
