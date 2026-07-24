# Роли и admin API (server.vagclub21)

Дата: 2026-07-24

## Цель
- `chatId` из `process.env.ADMIN` — всегда `superadmin`.
- Страница `/admin` (фронт позже) доступна ролям `superadmin` и `admin`.
- Только `superadmin` назначает роли.
- `superadmin` и `admin` прикрепляют компании к пользователям.
- Написать миграции (сид), нужные API. Фронт — позже.

## Модель данных
Используем уже существующие таблицы (M2M, под будущее расширение) — schema-alter НЕ требуется:
- `Roles(id, value UNIQUE, description)` — справочник ролей.
- `UserRoles(id, userId→Users.id, roleId→Roles.id)` — M2M назначения.
- `UserCompanies(id, userId→Users.id, companyId)` — прикрепление компаний (companyId = id компании в CMS Payload). unique(userId, companyId).

Роли-значения (верхний регистр — совместимость с уже существовавшими в БД `USER`/`ADMIN`): `USER`, `ADMIN`, `SUPERADMIN`. API нормализует роль из запроса через `normalizeRole` (фронт может слать в любом регистре).

**Реконсиляция легаси-данных.** В `roles` уже были `USER`(1)/`ADMIN`(2), и всем ~230 пользователям была назначена `USER` (от старой системы; текущий код роли не писал). Приняли этот вокабуляр, добавили `SUPERADMIN`; никакие существующие назначения не тронуты.

## Эффективная роль
`effectiveRoles(chatId, dbRoles)`:
- если `String(chatId) === String(process.env.ADMIN)` → всегда включает `superadmin` (рантайм-гарантия, даже без строки в `UserRoles`);
- иначе — роли из `UserRoles`.

## Миграции (лёгкий ESM-раннер)
- `migrations/run.js` — раннер: создаёт таблицу учёта `_migrations`, применяет по порядку файлы `migrations/NNN-*.js` (каждый экспортирует `name` + `up(queryInterface, sequelize)`), фиксирует применённые. Идемпотентно.
- `migrations/001-seed-roles.js` — `sync()` моделей → upsert ролей `user/admin/superadmin` в `Roles` → если юзер с `chatId=ADMIN` существует, выдать ему `superadmin` через `UserRoles` (findOrCreate).
- npm-скрипт `"migrate": "node migrations/run.js"`.

## Сервис `services/roles.js`
- Константы `ROLES = {USER, ADMIN, SUPERADMIN}`, `ADMIN_LEVEL = [ADMIN, SUPERADMIN]`.
- `getUserWithRoles(chatId)` → `{id, chatId, name, roles: string[]}` c учётом эффективной роли, либо `null`.
- `setUserRole(chatId, role)` → заменяет набор ролей пользователя на `[role]` (delete+insert в `UserRoles`). Защита: нельзя понизить env-ADMIN ниже superadmin.
- `listUsers({search})` → пользователи с `id, chatId, name, roles, companies[]`; поиск по chatId и по имени (ilike).

## Middleware `requireRole(...allowed)` (в `services/auth.js`)
Ставится после `authenticateAccessToken`. Грузит роли по `req.user.chatId`, кладёт `req.currentUser = {id, chatId, name, roles}`, проверяет пересечение с `allowed` → 401 (нет юзера) / 403 (нет прав).

## API — роутер `api/admin.js`, монтируется `app.use('/api', authenticateAccessToken, adminRouter)`
Все пути под `/admin/*` дополнительно защищены `requireRole`.
- `GET  /admin/me` — admin|superadmin → эффективные роли текущего юзера.
- `GET  /admin/users?search=` — admin|superadmin → список юзеров (id, chatId, name, roles, companies).
- `POST /admin/roles` — superadmin → `{chatId, role}`; role ∈ {user,admin,superadmin}. Защита env-ADMIN.
- `POST /admin/companies/attach` — admin|superadmin → `{chatId, companyId}`; проверка существования компании в CMS; findOrCreate в UserCompanies.
- `POST /admin/companies/detach` — admin|superadmin → `{chatId, companyId}`; destroy.

## `/protect/user`
В ответ добавить `user.roles` (эффективные роли) — для гейта фронта.

## Тестирование (ручное, скрипт)
`migrations/verify.js` / curl-проверки: миграция идемпотентна; ADMIN → superadmin; guard 403 для обычного юзера; назначение роли; attach/detach компании.
