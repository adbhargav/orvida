/**
 * PM2 process definition for the ORIVIDA API.
 *
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save && pm2 startup      # survive a reboot
 *
 * Cluster mode uses every core the VPS has. The app holds no in-process
 * state — sessions are JWTs and uploads live in Postgres — so workers are
 * interchangeable and a restart drops nothing.
 */
module.exports = {
  apps: [
    {
      name: 'orvida-api',
      script: 'src/server.js',
      cwd: __dirname,

      instances: 'max',
      exec_mode: 'cluster',

      // Node reads .env through dotenv; PM2 only needs to pick the mode.
      env: { NODE_ENV: 'development' },
      env_production: { NODE_ENV: 'production' },

      // A crash loop should back off rather than hammer Postgres.
      autorestart: true,
      max_restarts: 10,
      min_uptime: '20s',
      restart_delay: 2000,

      // Restart if a worker leaks past this; the API's steady state is far
      // below it, so tripping this means something is wrong.
      max_memory_restart: '400M',

      // Let in-flight requests finish on reload/deploy.
      kill_timeout: 8000,
      wait_ready: false,
      listen_timeout: 10000,

      merge_logs: true,
      time: true,
      out_file: '/var/log/orvida/api-out.log',
      error_file: '/var/log/orvida/api-error.log',
    },
  ],
};
