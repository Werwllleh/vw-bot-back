import {assignRoleToUser, createRole, fetchRoles, getUserRoles} from "../services/roles.js";
import express from "express";

const router = express.Router();

router.post("/create-role", async (req, res) => {
  try {

    const data = req.body;

    if (!data.value || data.value.trim() === "") {
      return res.status(409).json({
        error: 'Ошибка, не указан тип роли',
      });
    }

    if (!data.description || data.description.trim() === "") {
      return res.status(409).json({
        error: 'Ошибка, не указано описание для роли',
      });
    }

    if (data.value && data.description) {
      const result = await createRole(data.value, data.description);

      if (result) {
        return res.status(200).json({
          error: 'Роль создана',
        });
      } else {
        return res.status(500).json({
          error: 'Ошибка при создании роли',
        });
      }
    }
  } catch (e) {
    return res.status(500).json({
      error: 'Ошибка при создании роли',
    });
  }
})

router.get("/roles", async (req, res) => {
  try {

    const result = await fetchRoles();

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({
      error: 'Ошибка получения списка ролей',
    });
  }
})

router.post("/assign-role", async (req, res) => {
  try {
    const { chatId, roleId } = req.body;

    if (!chatId || !roleId) {
      return res.status(400).json({
        error: 'Ошибка, не указан телеграм ID пользователя или ID роли',
      });
    }

    await assignRoleToUser(chatId, roleId);

    return res.status(200).json({
      message: 'Роль успешно назначена пользователю',
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: error.message || 'Ошибка при назначении роли',
    });
  }
});

router.get("/user-roles/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const roles = await getUserRoles(parseInt(userId));

    return res.status(200).json({
      roles: roles
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Ошибка при получении ролей пользователя',
    });
  }
});

export default router;