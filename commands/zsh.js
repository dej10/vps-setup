// commands/zsh.js
import { consola } from 'consola';
import { execSudo } from '../app.js';

export async function setupZsh(ssh, username) {
  consola.info('Setting up Zsh & Oh My Zsh...');
  
  // Install Zsh
  await execSudo(ssh, 'sudo apt-get install -y zsh');
  
 // Install Oh My Zsh for the current user (no sudo needed)
    await ssh.execCommand('sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended');
  
  // Set Zsh as default shell for the current user
  await execSudo(ssh, `chsh -s $(which zsh) ${username}`);

  consola.success('Zsh & Oh My Zsh setup completed');
}