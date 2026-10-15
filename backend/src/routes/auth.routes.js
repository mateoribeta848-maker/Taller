const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

// Ruta pública
router.post('/login', controller.login);

// Rutas protegidas
router.get('/verificar', verificarToken, controller.verificar);
router.get('/usuarios', verificarToken, soloAdmin, controller.listarUsuarios);
router.post('/usuarios', verificarToken, soloAdmin, controller.crearUsuario);
router.put('/usuarios/:id', verificarToken, soloAdmin, controller.actualizarUsuario);
router.delete('/usuarios/:id', verificarToken, soloAdmin, controller.eliminarUsuario);

module.exports = router;