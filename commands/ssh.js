import { consola } from "consola";


export async function setupSSH(ssh) {
  consola.info('Configuring SSH...');

  //  Disable root login and change SSH port
  const newSshPort = await consola.prompt('Enter new SSH port (leave empty to keep current):');
  
  if (newSshPort) {
    await ssh.execCommand(`sudo sed -i 's/#Port 22/Port ${newSshPort}/' /etc/ssh/sshd_config`);
  }
  
  await ssh.execCommand("sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config");
  await ssh.execCommand('sudo systemctl restart sshd');

  consola.success('SSH configuration completed');
}