import fs from 'fs';
import path from 'path';
import {getFormattedDate, getFormattedDateTime} from "./date.js";

const logger = (errorText, error) => {

  try {
    const logFileName = `log-${getFormattedDate()}.txt`;

    const logsDir = path.resolve("logs");

    // Проверяем, существует ли директория /logs
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFilePath = path.join(`logs/${logFileName}`);

    const logMessage = `${getFormattedDateTime()} - ${errorText}\n------------------------------\n${error?.stack || error?.message || error}\n------------------------------\n\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });
  } catch (err) {
    console.log(err)
  }


};

export default logger;
