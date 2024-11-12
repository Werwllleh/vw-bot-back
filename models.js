import sequelize from './db.js';
import { DataTypes } from 'sequelize';

export const Users = sequelize.define('users', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	chat_id: { type: DataTypes.BIGINT, unique: true },
	user_name: { type: DataTypes.STRING, allowNull: false },
	user_color: { type: DataTypes.STRING, allowNull: false }
}, {
	timestamps: true
});

export const Cars = sequelize.define('cars', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	car_brand: { type: DataTypes.STRING, allowNull: false },
	car_model: { type: DataTypes.STRING, allowNull: false },
	car_year: { type: DataTypes.INTEGER, allowNull: false },
	car_number: { type: DataTypes.STRING, allowNull: false, unique: true },
	car_note: { type: DataTypes.TEXT },
	car_images: { type: DataTypes.TEXT, allowNull: false }, // Для хранения названий фотографий
}, {
	timestamps: true
});

// Установка связи между Users и Cars
Users.hasMany(Cars, {
	foreignKey: 'chat_id',
	sourceKey: 'chat_id'
});

Cars.belongsTo(Users, {
	foreignKey: 'chat_id',
	targetKey: 'chat_id'
});
