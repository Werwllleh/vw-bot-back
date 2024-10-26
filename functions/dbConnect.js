import connectDB from "../db.js";

const dbConnect = async () => {
  try {
    await connectDB.authenticate();
    connectDB.sync()
      .then(() => console.log('Tables created/updated successfully'))
      .catch((error) => console.error('Error creating tables:', error));
  } catch (e) {
    console.log("Подключение к бд сломалось", e);
  }
}

export default dbConnect;
