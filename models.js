const sequelize = require('./db');
const { DataTypes } = require('sequelize');

const Users = sequelize.define('users', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	chat_id: { type: DataTypes.BIGINT, unique: true },
	user_name: { type: DataTypes.STRING, allowNull: false },
	user_birthday: { type: DataTypes.DATEONLY },
}, {
	timestamps: true
})

const Cars = sequelize.define('cars', {
	id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
	car_brand: { type: DataTypes.STRING, allowNull: false },
	car_model: { type: DataTypes.STRING, allowNull: false },
	car_year: { type: DataTypes.INTEGER, allowNull: false },
	car_number: { type: DataTypes.STRING, allowNull: false },
	car_note: { type: DataTypes.TEXT },
	car_images: { type: DataTypes.TEXT, allowNull: false }, // Для хранения названий фотографий
}, {
	timestamps: true
});

// Установка связи "один-ко-многим" между Users и Cars
Users.hasMany(Cars, {
	foreignKey: 'userId', // Внешний ключ в таблице Cars
	sourceKey: 'id' // Ключ в таблице Users
});

Cars.belongsTo(Users, {
	foreignKey: 'userId', // Внешний ключ в таблице Cars
	targetKey: 'id' // Ключ в таблице Users
});



/*const Sellers = sequelize.define('seller', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	userId: {
		type: DataTypes.INTEGER,
		references: {
			model: Users, // Связь с таблицей пользователей
			key: 'id'
		},
		allowNull: false,
		unique: true
	}
}, {
	timestamps: false
});


const Products = sequelize.define('product', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	product_type: {
		type: DataTypes.STRING,
		allowNull: false
	},
	product_name: {
		type: DataTypes.STRING,
		allowNull: false
	},
	product_price: {
		type: DataTypes.FLOAT,
		allowNull: false
	},
	product_image: {
		type: DataTypes.STRING,
		allowNull: false
	}
}, {
	timestamps: false
});

const SellerProducts = sequelize.define('sellerProduct', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	sellerId: {
		type: DataTypes.INTEGER,
		references: {
			model: Sellers, // Ссылка на таблицу продавцов
			key: 'id'
		},
		allowNull: false
	},
	productId: {
		type: DataTypes.INTEGER,
		references: {
			model: Products, // Ссылка на таблицу продуктов
			key: 'id'
		},
		allowNull: false
	},
	quantity: {
		type: DataTypes.INTEGER,
		allowNull: false, // Количество данного товара у продавца
		defaultValue: 0   // По умолчанию 1, если ничего не указано
	}
}, {
	timestamps: false
});


Sellers.belongsToMany(Products, { through: SellerProducts, foreignKey: 'sellerId' });
Products.belongsToMany(Sellers, { through: SellerProducts, foreignKey: 'productId' });*/





module.exports = { Users };
