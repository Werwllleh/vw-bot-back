const fs = require('fs');
const path = require("path");
const {getFormattedDate, getFormattedDateTime} = require("./date");

const logger = (errorText, error) => {

  const logFileName = `log-${getFormattedDate()}.txt`;

  const logsDir = path.resolve(__dirname, "..", "logs");

  // Проверяем, существует ли директория /logs
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFilePath = path.join(__dirname, "..", 'logs', logFileName);

  const logMessage = `${getFormattedDateTime()} - ${errorText}\n------------------------------\n${error?.stack || error?.message}\n------------------------------\n\n`;

  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
};

module.exports = logger;