import { consola } from "consola";
import { execSudo } from "../app.js";

export async function setupDatabases(ssh, user) {
  consola.info("Setting up MySQL securely...");

  // Step 1: Install MySQL
  await execSudo(ssh, "apt-get install -y mysql-server");
  consola.success("MySQL installed successfully");

  // Step 2: Start MySQL service
  await execSudo(ssh, "systemctl start mysql");
  consola.success("MySQL service started");

  // Step 3: Set root authentication method, set password to 'password'
  const sudoDBPassword  = await consola.prompt(`Please enter new password for DB user root`);
  const newPassword  = await consola.prompt(`Please enter new password for DB user: ${user}`);



  // fresh install only
  // const setRootAuthCommand = `mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH caching_sha2_password BY '${sudoDBPassword}';"`;

  const setCreateUserCommand = `mysql -u root -p ${sudoDBPassword} -e "CREATE USER '${user}'@'localhost' IDENTIFIED WITH caching_sha2_password BY '${newPassword}';"`;

  // await execSudo(ssh, setRootAuthCommand);
  // consola.success("Root authentication method updated"); 
  
   await execSudo(ssh, setCreateUserCommand);
  consola.success("User created");

  // Step 4: Install expect
  await execSudo(ssh, "apt-get install -y expect");
  consola.success("Expect installed successfully");


  // Step 5: Run mysql_secure_installation
  const secureInstallCommand = `
expect -c "
set timeout 10
spawn mysql_secure_installation
expect "Enter password for user root:"
send "'password'\\r"
expect "Press y|Y for Yes, any other key for No:"
send "n\\r"
expect "Change the password for root ? (Press y|Y for Yes, any other key for No) :"
send "n\\r"
expect "Remove anonymous users? (Press y|Y for Yes, any other key for No) :"
send "y\\r"
expect "Disallow root login remotely? (Press y|Y for Yes, any other key for No) :"
send "y\\r"
expect "Remove test database and access to it? (Press y|Y for Yes, any other key for No) :"
send "y\\r"
expect "Reload privilege tables now? (Press y|Y for Yes, any other key for No) :"
send "y\\r"
expect eof
"`;

  await execSudo(ssh, secureInstallCommand);
  consola.success("MySQL secure installation completed");

  // Step 6: Restart MySQL service
  await execSudo(ssh, "systemctl restart mysql");
  consola.success("MySQL service restarted");

  consola.success("MySQL setup and secured successfully");
}
