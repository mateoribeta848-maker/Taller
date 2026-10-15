const bcrypt = require('bcryptjs');

const hash = bcrypt.hashSync('admin123', 10);
console.log('===========================================');
console.log('Hash generado para contraseña "admin123":');
console.log('===========================================');
console.log(hash);
console.log('===========================================');