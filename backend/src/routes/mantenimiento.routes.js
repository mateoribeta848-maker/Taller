const express = require('express');
const router = express.Router();
const controller = require('../controllers/mantenimiento.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', controller.listar);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;