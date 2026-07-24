import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import sequelize from '../db.js';

// Лёгкий раннер миграций для ESM-проекта (штатного sequelize-cli нет).
// Каждый файл migrations/NNN-*.js экспортирует `name` и `up(sequelize)`.
// Применённые миграции фиксируются в таблице "_migrations" — повторный запуск безопасен.

const dir = path.dirname(fileURLToPath(import.meta.url));

const ensureTable = async () => {
  await sequelize.query(
    'CREATE TABLE IF NOT EXISTS "_migrations" (name VARCHAR(255) PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())',
  );
};

const appliedNames = async () => {
  const [rows] = await sequelize.query('SELECT name FROM "_migrations"');
  return new Set(rows.map((r) => r.name));
};

const run = async () => {
  await sequelize.authenticate();
  await ensureTable();
  const done = await appliedNames();

  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d+.*\.js$/.test(f))
    .sort();

  let applied = 0;

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    const name = mod.name || file;

    if (done.has(name)) {
      console.log(`[migrate] пропуск (уже применена): ${name}`);
      continue;
    }

    console.log(`[migrate] применяю: ${name}`);
    await mod.up(sequelize);
    await sequelize.query('INSERT INTO "_migrations" (name) VALUES (:name)', {
      replacements: {name},
    });
    applied += 1;
  }

  console.log(`[migrate] готово. Применено новых миграций: ${applied}`);
};

run()
  .then(() => sequelize.close())
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] ОШИБКА:', err);
    process.exit(1);
  });
