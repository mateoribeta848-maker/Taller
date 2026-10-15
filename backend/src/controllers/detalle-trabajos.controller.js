const pool = require('../config/db');

// Listar trabajos de una orden
exports.listarPorTrabajo = async (req, res) => {
  try {
    const { trabajoId } = req.params;
    const result = await pool.query(
      `SELECT dt.*, tt.nombre AS tipo_nombre, tt.categoria
       FROM detalle_trabajos_realizados dt
       LEFT JOIN tipos_trabajos tt ON dt.tipo_trabajo_id = tt.id
       WHERE dt.trabajo_id = $1
       ORDER BY dt.id`,
      [trabajoId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear trabajo de la orden
exports.crear = async (req, res) => {
  try {
    const { trabajo_id, tipo_trabajo_id, descripcion, precio, completado } = req.body;
    const result = await pool.query(
      `INSERT INTO detalle_trabajos_realizados 
       (trabajo_id, tipo_trabajo_id, descripcion, precio, completado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [trabajo_id, tipo_trabajo_id, descripcion, precio || 0, completado !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_trabajo_id, descripcion, precio, completado } = req.body;
    const result = await pool.query(
      `UPDATE detalle_trabajos_realizados 
       SET tipo_trabajo_id=$1, descripcion=$2, precio=$3, completado=$4 
       WHERE id=$5 RETURNING *`,
      [tipo_trabajo_id, descripcion, precio, completado, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM detalle_trabajos_realizados WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Trabajo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};