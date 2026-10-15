const express = require('express');
const router = express.Router();
const controller = require('../controllers/tipos-trabajos.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);
router.get('/', controller.listar);
router.get('/por-categoria', controller.porCategoria);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;