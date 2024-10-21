import { program } from 'commander';
import { consola } from 'consola';
import { readFileSync } from 'fs';
import { NodeSSH } from 'node-ssh';
import inquirer from 'inquirer';
import path from 'path';

import { setupDatabases } from './commands/databases.js';
import { setupSSH } from './commands/ssh.js';
import { createUsers } from './commands/users.js';
import { setupWebserver } from './commands/webserver.js';
import { setupZsh } from './commands/zsh.js';

let sudoPassword = '';

program
  .name('vps-setup')
  .description('Set up a new Ubuntu 24.04 VPS')
  .requiredOption('-h, --host <host>', 'SSH hostname')
  .requiredOption('-u, --user <user>', 'SSH username')
  .option('-p, --port <port>', 'SSH port', '22')
  .option('-k, --key <key>', 'Path to SSH private key file')
  .action(async (options) => {
    consola.info('Starting VPS setup...');

    const ssh = new NodeSSH();

    try {
      let privateKey;
      if (options.key) {
        try {
          privateKey = readFileSync(path.resolve(options.key), 'utf8');
        } catch (error) {
          consola.error(`Failed to read private key file: ${error.message}`);
          process.exit(1);
        }
      }

      // Prompt for sudo password
      const { password } = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter sudo password:',
          mask: '*'
        }
      ]);
      sudoPassword = password;

      await ssh.connect({
        host: options.host,
        username: options.user,
        port: options.port,
        privateKey: privateKey,
      });

      consola.success('Connected to VPS');

      const installOptions = await askInstallOptions();

      if (installOptions.databases) await setupDatabases(ssh, options.user);
      if (installOptions.ssh) await setupSSH(ssh);
      if (installOptions.users) await createUsers(ssh);
      if (installOptions.webserver) await setupWebserver(ssh, options.port);
      if (installOptions.zsh) await setupZsh(ssh, options.user);

      consola.success('VPS setup completed successfully!');
    } catch (error) {
      consola.error('Error setting up VPS:', error);
    } finally {
      ssh.dispose();
    }
  });

async function askInstallOptions() {
  const questions = [
    {
      type: 'confirm',
      name: 'databases',
      message: 'Install databases?',
    },
    {
      type: 'confirm',
      name: 'ssh',
      message: 'Configure SSH?',
    },
    {
      type: 'confirm',
      name: 'users',
      message: 'Create users?',
    },
    {
      type: 'confirm',
      name: 'webserver',
      message: 'Install webserver (nginx, php, nvm etc.)?',
    },
    {
      type: 'confirm',
      name: 'zsh',
      message: 'Install Zsh & Oh My Zsh?',
    },
  ];

  return inquirer.prompt(questions);
}

// Helper Function to execute sudo commands
export async function execSudo(ssh, command) {
  const result = await ssh.execCommand(`echo '${sudoPassword}' | sudo -S ${command}`, { 
    cwd: '/',
  }).then(function(result) {
    console.log('STDOUT: ' + result.stdout)
    console.log('STDERR: ' + result.stderr)
  });
  
  
  return result;
}

program.parse(process.argv);