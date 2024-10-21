import { consola } from 'consola';
import { promisify } from 'util';
import { execSudo } from '../app.js';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export async function createUsers(ssh) {
  consola.info('Creating users...');
  const username = await consola.prompt('Enter new username:');
  const useGithubKey = await consola.prompt('Use GitHub public key? (y/n):');
  let publicKey = '';

  if (useGithubKey.toLowerCase() === 'y') {
    const githubUsername = await consola.prompt('Enter GitHub username:');
    publicKey = await fetchGithubKey(githubUsername);
  } else {
    publicKey = await consola.prompt('Enter public key:');
  }

  try {
    await execSudo(ssh, `sudo useradd -m -d /home/${username} -s /bin/bash ${username}`);
    consola.success(`User ${username} created successfully`);

    await execSudo(ssh, `sudo passwd -d ${username}`);
    consola.success('Empty password set');

    await execSudo(ssh, `sudo mkdir -p /home/${username}/.ssh`);
    await execSudo(ssh, `sudo touch /home/${username}/.ssh/authorized_keys`);
    await execSudo(ssh, `echo "${publicKey}" | sudo tee /home/${username}/.ssh/authorized_keys`);
    consola.success('.ssh directory and authorized_keys file created');

    await execSudo(ssh, `sudo chown -R ${username}:${username} /home/${username}/.ssh`);
    await execSudo(ssh, `sudo chmod 700 /home/${username}/.ssh`);
    await execSudo(ssh, `sudo chmod 600 /home/${username}/.ssh/authorized_keys`);
    consola.success('Permissions set correctly');

    await execSudo(ssh, `sudo usermod -aG sudo ${username}`);
    consola.success(`User ${username} added to sudo group`);

    await execSudo(ssh, `sudo usermod -aG www-data ${username}`);

    await execSudo(ssh, 'sudo chown -R root:www-data /etc/nginx');
    await execSudo(ssh, 'sudo chown -R www-data:www-data /var/www/html');

    await execSudo(ssh, 'sudo chmod -R g+rw /etc/nginx');
    await execSudo(ssh, 'sudo chmod -R g+rw /var/www/html');

    await execSudo(ssh, `sudo -u ${username} sudo -v`);
    consola.success(`User ${username} created successfully with sudo access`);

    consola.success(`User ${username} setup completed`);
  } catch (error) {
    consola.error(`Error creating user ${username}:`, error.message);
  }
}

async function fetchGithubKey(githubUsername) {
  try {
    const { stdout } = await execAsync(`curl https://github.com/${githubUsername}.keys`);
    return stdout.trim();
  } catch (error) {
    consola.error(`Failed to fetch GitHub key for user ${githubUsername}:`, error);
    return '';
  }
}
