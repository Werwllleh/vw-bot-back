import moment from 'moment-timezone';

const timeZone = 'Europe/Moscow';

export const currentTime = moment().tz(timeZone).format('YYYY-MM-DD HH:mm:ss');
