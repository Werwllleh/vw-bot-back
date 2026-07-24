export const name = '002-events-backfill';

// Создаёт таблицу events (через sync) и разово бэкфиллит события регистрации
// из таблицы users с их реальными датами. Идемпотентно: не дублирует, если
// событие user_registered для этого chatId уже есть.
export async function up(sequelize) {
  await sequelize.sync();

  const [result] = await sequelize.query(`
    INSERT INTO events (type, "chatId", payload, "createdAt", "updatedAt")
    SELECT 'user_registered', u."chatId", json_build_object('name', u.name), u."createdAt", u."createdAt"
    FROM users u
    WHERE u."chatId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM events e
        WHERE e.type = 'user_registered' AND e."chatId" = u."chatId"
      )
    RETURNING id
  `);

  console.log(`[migrate] бэкфилл регистраций: добавлено ${result?.length ?? 0} событий`);
}
