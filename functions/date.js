import moment from 'moment-timezone';

export const getFormattedDate = () => {
  return moment().tz('Europe/Moscow').format('DD-MM-YYYY');
};

export const getFormattedDateTime = () => {
  return moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
};
