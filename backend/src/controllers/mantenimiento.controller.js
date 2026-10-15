const pool = require('../config/db');

exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fm.*, tc.marca, tc.modelo 
       FROM frecuencia_mantenimiento fm
       LEFT JOIN tipos_carros tc ON fm.tipo_carro_id = tc.id
       ORDER BY fm.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { tipo_carro_id, tipo_servicio, kilometros, meses, descripcion } = req.body;
    const result = await pool.query(
      `INSERT INTO frecuencia_mantenimiento (tipo_carro_id, tipo_servicio, kilometros, meses, descripcion)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tipo_carro_id, tipo_servicio, kilometros, meses, descripcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_carro_id, tipo_servicio, kilometros, meses, descripcion } = req.body;
    const result = await pool.query(
      `UPDATE frecuencia_mantenimiento SET tipo_carro_id=$1, tipo_servicio=$2, 
       kilometros=$3, meses=$4, descripcion=$5 WHERE id=$6 RETURNING *`,
      [tipo_carro_id, tipo_servicio, kilometros, meses, descripcion, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM frecuencia_mantenimiento WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Frecuencia eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};