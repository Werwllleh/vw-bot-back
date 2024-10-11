const moment = require('moment-timezone');

const timeZone = 'Europe/Moscow';

const currentTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');

module.exports = currentTime;
