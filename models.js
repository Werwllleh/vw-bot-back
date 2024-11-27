import sequelize from './db.js';
import { DataTypes } from 'sequelize';

export const Users = sequelize.define('users', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	chat_id: { type: DataTypes.BIGINT, unique: true },
	user_name: { type: DataTypes.STRING, allowNull: false },
	user_color: { type: DataTypes.STRING, allowNull: false },
	user_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
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


export const Partners = sequelize.define('partners', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	title: { type: DataTypes.STRING, allowNull: false },
	description: { type: DataTypes.STRING, allowNull: false },
	links: { type: DataTypes.TEXT, allowNull: true },
	phones: { type: DataTypes.TEXT, allowNull: true },
	address_text: { type: DataTypes.STRING, allowNull: false },
	address_coordinates: { type: DataTypes.TEXT, allowNull: false },
	// category: { type: DataTypes.INTEGER, allowNull: false },
	images: { type: DataTypes.TEXT, allowNull: true },
	status: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
	timestamps: true
});

export const PartnersCategories = sequelize.define('partners_categories', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	label: { type: DataTypes.STRING, allowNull: false, unique: true },
	value: { type: DataTypes.STRING, allowNull: false, unique: true },
}, {
	timestamps: false
})

// Промежуточная таблица создается автоматически Sequelize
Partners.belongsToMany(PartnersCategories, { through: 'PartnersCategoriesPartners' });
PartnersCategories.belongsToMany(Partners, { through: 'PartnersCategoriesPartners' });


