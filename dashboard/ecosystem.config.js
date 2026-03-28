require('dotenv').config({ path: '.env' });

module.exports = {
  apps: [
    {
      name: 'Dashboard',
      script: 'npm',
      args: 'run start -- -p 3006',
      cwd: '.',
      output: 'log/DashboardOut.log',
      error: 'log/DashboardErr.log',
      time: true,
    },
    {
      name: 'DashboardCron',
      script: 'npm',
      args: 'run cron',
      cwd: '.',
      output: 'log/CronOut.log',
      error: 'log/CronErr.log',
      time: true,
    }
  ]
};