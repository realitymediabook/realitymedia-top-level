module.exports = {
    apps: [{
      name: 'realitymedia-top-level',
      script: './index.js'
    }],
    deploy: {
      production: {
        user: 'ubuntu',
        host: 'ec2-54-162-48-95.compute-1.amazonaws.com',
        key: '~/.ssl/realitydigitaltoplevel.pem',
        ref: 'origin/main',

        repo: 'git@github.com:realitymediabook/realitymedia-top-level.git',
        path: '/home/ubuntu/server',
        'post-deploy': 'npm install && git submodule update --init --recursive --remote && (cp ../.env .env || true ) && pm2 startOrRestart ecosystem.config.js'
      }
    }
  }