import sequelize from './db.js';
import {DataTypes} from 'sequelize';

export const Users = sequelize.define('users', {
  id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
  chatId: {type: DataTypes.BIGINT, unique: true},
  name: {type: DataTypes.STRING, allowNull: false},
  instagram: {type: DataTypes.STRING},
  color: {type: DataTypes.STRING, allowNull: false},
  banned: {type: DataTypes.BOOLEAN, defaultValue: false},
  banReason: {type: DataTypes.STRING, allowNull: true},
}, {
  timestamps: true
});

export const Cars = sequelize.define('cars', {
  id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
  brand: {type: DataTypes.STRING, allowNull: false},
  model: {type: DataTypes.STRING, allowNull: false},
  year: {type: DataTypes.INTEGER, allowNull: false},
  number: {type: DataTypes.STRING, allowNull: false, unique: true},
  note: {type: DataTypes.TEXT},
  drive2: {type: DataTypes.TEXT},
  chatId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: Users,
      key: 'chatId'
    }
  }
}, {
  timestamps: true
});


// Установка связи между Users и Cars
Users.hasMany(Cars, {
  foreignKey: 'chatId'
});

Cars.belongsTo(Users, {
  foreignKey: 'chatId'
});


export const Partners = sequelize.define('partners', {
  id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
  title: {type: DataTypes.STRING, allowNull: false},
  slug: {type: DataTypes.STRING, allowNull: false},
  description: {type: DataTypes.TEXT, allowNull: false},
  links: {type: DataTypes.TEXT, allowNull: true},
  phones: {type: DataTypes.TEXT, allowNull: true},
  site: {type: DataTypes.STRING, allowNull: true},
  organizationLink: {type: DataTypes.STRING, allowNull: true},
  addressText: {type: DataTypes.STRING, allowNull: true},
  addressCoordinates: {type: DataTypes.TEXT, allowNull: true},
  active: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
  banned: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
  banReason: {type: DataTypes.STRING, allowNull: true},
}, {
  timestamps: true
});

export const PartnersCategories = sequelize.define('partnersCategories', {
  id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true},
  label: {type: DataTypes.STRING, allowNull: false, unique: true},
  value: {type: DataTypes.STRING, allowNull: false, unique: true},
}, {
  timestamps: false
})

// Промежуточная таблица
export const PartnerCategoryConnect = sequelize.define('partnerCategoryConnect', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
}, {
  timestamps: false,
});

// Настройка ассоциаций
Partners.belongsToMany(PartnersCategories, {through: PartnerCategoryConnect});
PartnersCategories.belongsToMany(Partners, {through: PartnerCategoryConnect});


export const Roles = sequelize.define('roles', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false
});

export const UserRoles = sequelize.define('userRoles', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Users,
      key: 'id'
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Roles,
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Установка связи между Users и Roles
Users.belongsToMany(Roles, {
  through: UserRoles,
  foreignKey: 'userId',
  otherKey: 'roleId'
});

Roles.belongsToMany(Users, {
  through: UserRoles,
  foreignKey: 'roleId',
  otherKey: 'userId'
});

export const CarsImages = sequelize.define('carsImages', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  carId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Cars,
      key: 'id'
    }
  },
})

export const PartnersImages = sequelize.define('partnerImages', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false
  },
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Partners,
      key: 'id'
    }
  }
})

Cars.hasMany(CarsImages, {
  foreignKey: 'carId', // ссылается на поле carId в Images
  sourceKey: 'id'      // ссылается на id в Cars
});

CarsImages.belongsTo(Cars, {
  foreignKey: 'carId', // ссылается на поле carId в Images
  targetKey: 'id'      // ссылается на id в Cars
});

Partners.hasMany(PartnersImages, {
  foreignKey: 'partnerId', // ссылается на поле partnerId в Images
  sourceKey: 'id'      // ссылается на id в Partners
});

PartnersImages.belongsTo(Partners, {
  foreignKey: 'partnerId', // ссылается на поле partnerId в Images
  targetKey: 'id'      // ссылается на id в Partners
});
