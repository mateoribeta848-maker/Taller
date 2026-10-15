const pool = require('../config/db');

exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categorias_repuestos WHERE activo = true ORDER BY nombre'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion, icono } = req.body;
    const result = await pool.query(
      `INSERT INTO categorias_repuestos (nombre, descripcion, icono)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, descripcion, icono || 'bi-box']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, icono, activo } = req.body;
    const result = await pool.query(
      `UPDATE categorias_repuestos 
       SET nombre=$1, descripcion=$2, icono=$3, activo=$4 
       WHERE id=$5 RETURNING *`,
      [nombre, descripcion, icono, activo, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM categorias_repuestos WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};