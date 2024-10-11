const sequelize = require("../db");

const dbConnect = async () => {
  try {
    await sequelize.authenticate();
    sequelize.sync()
      .then(() => console.log('Tables created successfully'))
      .catch((error) => console.error('Error creating tables:', error));
  } catch (e) {
    console.log("Подключение к бд сломалось", e);
  }
}

module.exports = dbConnect;
