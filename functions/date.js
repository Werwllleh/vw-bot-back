const moment = require('moment-timezone');

const getFormattedDate = () => {
  return moment().tz('Europe/Moscow').format('DD-MM-YYYY');
};

const getFormattedDateTime = () => {
  return moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
};

module.exports = {getFormattedDate, getFormattedDateTime}