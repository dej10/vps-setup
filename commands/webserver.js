import { consola } from 'consola';
import { execSudo } from '../app.js';

export async function setupWebserver(ssh, port) {
  consola.info('Setting up webserver...');

    // Install nginx
    await ssh.execCommand('sudo apt-get update &&  sudo apt-get install -y nginx');
    await ssh.execCommand("sudo ufw allow 'OpenSSH' && sudo  ufw allow 'Nginx Full' &&  sudo ufw allow 'Nginx HTTPS'");

    // Enable UFW non-interactively
    await execSudo(ssh, 'sudo su root && echo "y" | sudo ufw enable');

    // Install PHP
    await execSudo(ssh, 'sudo apt-get install -y php8.3-fpm php-mysql');

    // Install PHP Extensions
    await execSudo(ssh, 'sudo apt install -y php8.3-mbstring php8.3-xml php8.3-bcmath php8.3-curl');

    // Install NVM, Node.js, and npm
    await ssh.execCommand('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash');
    
    // Source NVM, install Node.js, and set it as default
    const nvmSetup = `
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
      nvm install 20 --lts
      nvm use 20
      nvm alias default 20
    `;
    await ssh.execCommand(nvmSetup);

    // Install PM2 & PM2 Logrotate
    const installPM2 = `
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
      npm install -g pm2
      pm2 install pm2-logrotate
    `;
    const pm2Result = await ssh.execCommand(installPM2);
    console.log('PM2 Install STDOUT:', pm2Result.stdout);
    console.log('PM2 Install STDERR:', pm2Result.stderr);

    // Install Fail2Ban
    await execSudo(ssh, 'sudo apt-get install -y fail2ban');

    const fail2banConfig = `
[DEFAULT]
bantime = 1d
findtime = 15m
maxretry = 3
backend = auto

[sshd]
port = ${port}
enabled = true
           `;

    await execSudo(ssh, `echo "${fail2banConfig}" | sudo tee /etc/fail2ban/jail.local`);
    await execSudo(ssh, 'sudo systemctl start fail2ban');

    consola.success('Webserver setup completed');
}