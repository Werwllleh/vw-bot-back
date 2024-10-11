// require('dotenv').config();
const { Sequelize } = require("sequelize");

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const port = process.env.DB_PORT;

module.exports = new Sequelize(
	"postgres",
	user,
	password,
	{
		host: "localhost",
		port: port,
		dialect: "postgres",
	}
);
