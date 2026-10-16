const bcrypt = require('bcryptjs');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

async function generarHash() {
  const terminal = readline.createInterface({ input: stdin, output: stdout });
  try {
    const password = await terminal.question('Ingresa la contraseña para generar su hash: ');
    if (!password) {
      throw new Error('La contraseña no puede estar vacía.');
    }
    console.log(await bcrypt.hash(password, 10));
  } finally {
    terminal.close();
  }
}

generarHash().catch((error) => {
  console.error('No se pudo generar el hash:', error.message);
  process.exitCode = 1;
});