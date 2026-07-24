import {Roles, Users, UserRoles} from '../models.js';
import {ROLES, ROLE_DESCRIPTIONS} from '../services/roles.js';

export const name = '001-seed-roles';

// Сид справочника ролей + выдача superadmin пользователю из process.env.ADMIN.
export async function up(sequelize) {
  // гарантируем существование таблиц roles/userRoles/users (в проекте схема через sync())
  await sequelize.sync();

  // upsert ролей user/admin/superadmin
  for (const value of Object.values(ROLES)) {
    await Roles.findOrCreate({
      where: {value},
      defaults: {value, description: ROLE_DESCRIPTIONS[value]},
    });
  }

  // ADMIN chatId -> superadmin (если пользователь уже создан)
  const adminChat = process.env.ADMIN;
  if (!adminChat) {
    console.log('[migrate] ADMIN не задан в .env — пропуск выдачи superadmin');
    return;
  }

  const user = await Users.findOne({where: {chatId: adminChat}});
  if (!user) {
    console.log(
      `[migrate] пользователь ADMIN chatId=${adminChat} ещё не создан — ` +
      'роль superadmin действует через рантайм-гарантию, строку выдаст повторный migrate после его логина',
    );
    return;
  }

  const superRole = await Roles.findOne({where: {value: ROLES.SUPERADMIN}});
  await UserRoles.findOrCreate({
    where: {userId: user.id, roleId: superRole.id},
    defaults: {userId: user.id, roleId: superRole.id},
  });
  console.log(`[migrate] superadmin выдан пользователю chatId=${adminChat} (userId=${user.id})`);
}
