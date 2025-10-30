import {Cars, CarsImages, Roles, UserRoles, Users} from "../models.js";


export const createRole = async (value, description) => {
  try {
    return await Roles.create({
      value: value.trim(),
      description: description.trim(),
    });
  } catch (error) {
    console.error('Ошибка при создании роли', error);
    throw error;
  }
}

export const fetchRoles = async () => {
  try {
    return await Roles.findAll({});
  } catch (error) {
    console.error('Ошибка получения списка ролей', error);
    throw error;
  }
}

// Присвоить роль пользователю
export const assignRoleToUser = async (chatId, roleId) => {
  try {
    // Проверяем существование пользователя и роли
    const user = await Users.findOne({
      where: {chatId: chatId}
    });
    const role = await Roles.findByPk(roleId);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (!role) {
      throw new Error('Роль не найдена');
    }

    // Проверяем, не назначена ли уже эта роль пользователю
    const existingAssignment = await UserRoles.findOne({
      where: {
        userId: user.id,
        roleId: roleId
      }
    });

    if (existingAssignment) {
      throw new Error('Роль уже назначена пользователю');
    }

    // Создаем связь
    return await UserRoles.create({
      userId: user.id,
      roleId
    });

  } catch (error) {
    console.error('Ошибка при назначении роли пользователю', error);
    throw error;
  }
}

// Удалить роль у пользователя
export const removeRoleFromUser = async (userId, roleId) => {
  try {
    const result = await UserRoles.destroy({
      where: { userId, roleId }
    });

    if (result === 0) {
      throw new Error('Роль не была назначена пользователю');
    }

    return result;
  } catch (error) {
    console.error('Ошибка при удалении роли у пользователя', error);
    throw error;
  }
}

// Получить роли пользователя
export const getUserRoles = async (userId) => {
  try {
    const user = await Users.findByPk(userId, {
      include: [{
        model: Roles,
        through: { attributes: [] } // Исключаем поля промежуточной таблицы из результата
      }]
    });

    return user ? user.roles : [];
  } catch (error) {
    console.error('Ошибка при получении ролей пользователя', error);
    throw error;
  }
}

// Проверить, имеет ли пользователь определенную роль
export const userHasRole = async (userId, roleValue) => {
  try {
    const userRoles = await getUserRoles(userId);
    return userRoles.some(role => role.value === roleValue);
  } catch (error) {
    console.error('Ошибка при проверке роли пользователя', error);
    throw error;
  }
}

// Получить всех пользователей с определенной ролью
export const getUsersByRole = async (roleId) => {
  try {
    const role = await Roles.findByPk(roleId, {
      include: [{
        model: Users,
        through: { attributes: [] }
      }]
    });

    return role ? role.users : [];
  } catch (error) {
    console.error('Ошибка при получении пользователей по роли', error);
    throw error;
  }
}