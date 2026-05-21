import { Sequelize } from "sequelize";

const db = process.env.DB_NAME;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const port = process.env.DB_PORT;
const dialect = process.env.DB_DIALECT;

const connectDB =  new Sequelize(
	db,
	user,
	password,
	{
		host: "localhost",
		port: port,
		dialect: dialect,
	}
);

export default connectDB;

