const env = process.env.START_MODE || 'production';

module.exports = {
  apps: [
    {
      name: 'vagclub21-server',

      script: 'index.js',
      interpreter: 'node',

      instances: 1,
      exec_mode: 'fork',

      watch: false,
      autorestart: true,

      env: {
        NODE_ENV: env
      }
    }
  ]
};
