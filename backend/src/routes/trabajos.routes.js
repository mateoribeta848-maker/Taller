const express = require('express');
const router = express.Router();
const controller = require('../controllers/trabajos.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', controller.listar);
router.get('/estadisticas', controller.estadisticas);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id/estado', controller.actualizarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;