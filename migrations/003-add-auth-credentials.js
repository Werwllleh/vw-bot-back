export const name = '003-add-auth-credentials';

export async function up(sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('users');

  if (!table.email) {
    await queryInterface.addColumn('users', 'email', {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
    console.log('[migrate] колонка email добавлена в users');
  }

  if (!table.password) {
    await queryInterface.addColumn('users', 'password', {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
    });
    console.log('[migrate] колонка password добавлена в users');
  }

  try {
    await sequelize.query('ALTER TABLE "users" ALTER COLUMN "chatId" DROP NOT NULL;');
    console.log('[migrate] колонка chatId сделана nullable в users');
  } catch (err) {
    // игнорируем, если уже nullable
  }
}
