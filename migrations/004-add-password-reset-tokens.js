export const name = '004-add-password-reset-tokens';

export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();

  if (!tables.includes('passwordResetTokens')) {
    await queryInterface.createTable('passwordResetTokens', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      token: {
        type: sequelize.Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      expiresAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
      },
      used: {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('passwordResetTokens', ['token']);
    await queryInterface.addIndex('passwordResetTokens', ['userId']);
    console.log('[migrate] таблица passwordResetTokens создана');
  }
}
