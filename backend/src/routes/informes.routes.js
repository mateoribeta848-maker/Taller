const express = require('express');
const router = express.Router();
const controller = require('../controllers/informes.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/trabajo/:trabajoId', controller.obtenerPorTrabajo);
router.post('/trabajo/:trabajoId', controller.crearOActualizar);
router.delete('/trabajo/:trabajoId', controller.eliminar);

module.exports = router;