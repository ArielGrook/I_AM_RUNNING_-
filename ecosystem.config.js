module.exports = {
  apps: [
    {
      name: 'i-am-running',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/i_am_running',
      instances: 2, // For 2 CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '3G', // 3.8GB RAM available, leave some for system
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/i-am-running-error.log',
      out_file: '/var/log/pm2/i-am-running-out.log',
      log_file: '/var/log/pm2/i-am-running-combined.log',
      time: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Environment specific settings
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        watch: true
      }
    }
  ],
  
  // Deploy configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/i-am-running.git',
      path: '/var/www/i_am_running',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production server"'
    }
  }
};

