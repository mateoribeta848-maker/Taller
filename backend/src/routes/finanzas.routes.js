const express = require('express');
const router = express.Router();
const controller = require('../controllers/finanzas.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/', controller.listar);
router.post('/trabajos/:trabajoId/pagos', controller.registrarPago);

module.exports = router;
