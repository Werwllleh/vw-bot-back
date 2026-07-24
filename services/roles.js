import {Op} from 'sequelize';
import sequelize from '../db.js';
import {Roles, UserRoles, Users, UserCompanies} from '../models.js';

// Значения ролей. Хранятся в таблице roles.value, назначаются через userRoles (M2M).
// Верхний регистр — совместимость с уже существующими в БД ролями USER/ADMIN.
export const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
};

// Приводит роль из запроса к каноническому виду (фронт может слать в любом регистре).
export const normalizeRole = (role) => (role == null ? role : String(role).toUpperCase());

// Роли, дающие доступ в админку.
export const ADMIN_LEVEL = [ROLES.ADMIN, ROLES.SUPERADMIN];

// Описания для сидирования справочника ролей.
export const ROLE_DESCRIPTIONS = {
  [ROLES.USER]: 'Обычный пользователь',
  [ROLES.ADMIN]: 'Администратор',
  [ROLES.SUPERADMIN]: 'Супер-администратор',
};

// chatId из .env, который всегда считается супер-админом.
export const isSuperadminChat = (chatId) =>
  chatId != null &&
  process.env.ADMIN != null &&
  String(chatId) === String(process.env.ADMIN);

// Эффективные роли: роли из БД + гарантированный superadmin для env-ADMIN.
const withEffectiveRoles = (chatId, dbRoleValues = []) => {
  const set = new Set(dbRoleValues);
  if (isSuperadminChat(chatId)) set.add(ROLES.SUPERADMIN);
  return [...set];
};

// Пользователь с его эффективными ролями по chatId. null — если пользователя нет.
export const getUserWithRoles = async (chatId) => {
  const user = await Users.findOne({
    where: {chatId},
    include: [{model: Roles, through: {attributes: []}}],
  });

  if (!user) return null;

  const dbRoleValues = (user.roles || []).map((r) => r.value);

  // self-heal: env-ADMIN всегда superadmin — если строки в БД ещё нет, создаём.
  // Так роль материализуется при первом же обращении после логина, даже если
  // на момент migrate пользователь ещё не был создан.
  if (isSuperadminChat(user.chatId) && !dbRoleValues.includes(ROLES.SUPERADMIN)) {
    try {
      const superRole = await Roles.findOne({where: {value: ROLES.SUPERADMIN}});
      if (superRole) {
        await UserRoles.findOrCreate({
          where: {userId: user.id, roleId: superRole.id},
          defaults: {userId: user.id, roleId: superRole.id},
        });
        dbRoleValues.push(ROLES.SUPERADMIN);
      }
    } catch (err) {
      console.error('Не удалось материализовать роль superadmin для ADMIN:', err.message);
    }
  }

  return {
    id: user.id,
    chatId: user.chatId,
    name: user.name,
    roles: withEffectiveRoles(user.chatId, dbRoleValues),
  };
};

// Заменяет набор ролей пользователя ровно на [role] (delete + insert в userRoles).
// Возвращает обновлённого пользователя с ролями. Бросает Error с кодом-строкой.
export const setUserRole = async (chatId, roleInput) => {
  const role = normalizeRole(roleInput);
  if (!Object.values(ROLES).includes(role)) {
    throw new Error('INVALID_ROLE');
  }

  // env-ADMIN нельзя понизить ниже superadmin.
  if (isSuperadminChat(chatId) && role !== ROLES.SUPERADMIN) {
    throw new Error('CANNOT_DEMOTE_SUPERADMIN');
  }

  const user = await Users.findOne({where: {chatId}});
  if (!user) throw new Error('USER_NOT_FOUND');

  const roleRow = await Roles.findOne({where: {value: role}});
  if (!roleRow) throw new Error('ROLE_NOT_SEEDED');

  await sequelize.transaction(async (t) => {
    await UserRoles.destroy({where: {userId: user.id}, transaction: t});
    await UserRoles.create({userId: user.id, roleId: roleRow.id}, {transaction: t});
  });

  return getUserWithRoles(chatId);
};

// Список пользователей с ролями и прикреплёнными компаниями. Поиск по chatId и имени.
export const listUsers = async ({search} = {}) => {
  const where = {};

  if (search && String(search).trim()) {
    const term = String(search).trim();
    const or = [{name: {[Op.iLike]: `%${term}%`}}];
    // chatId — BIGINT; ищем по нему только если запрос состоит из цифр.
    if (/^\d+$/.test(term)) {
      or.push(sequelize.where(sequelize.cast(sequelize.col('users.chatId'), 'text'), {[Op.like]: `%${term}%`}));
    }
    where[Op.or] = or;
  }

  const users = await Users.findAll({
    where,
    include: [
      {model: Roles, through: {attributes: []}},
      {model: UserCompanies, as: 'companies'},
    ],
    order: [['id', 'ASC']],
  });

  return users.map((user) => ({
    id: user.id,
    chatId: user.chatId,
    name: user.name,
    roles: withEffectiveRoles(user.chatId, (user.roles || []).map((r) => r.value)),
    companies: (user.companies || []).map((c) => c.companyId),
  }));
};
