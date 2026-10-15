const express = require('express');
const router = express.Router();
const controller = require('../controllers/detalle-trabajos.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/trabajo/:trabajoId', controller.listarPorTrabajo);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;