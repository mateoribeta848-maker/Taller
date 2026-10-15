const pool = require('../config/db');

exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipos_carros ORDER BY marca, modelo');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipos_carros WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { marca, modelo, anio, tipo_freno } = req.body;
    const result = await pool.query(
      `INSERT INTO tipos_carros (marca, modelo, anio, tipo_freno) VALUES ($1,$2,$3,$4) RETURNING *`,
      [marca, modelo, anio, tipo_freno]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { marca, modelo, anio, tipo_freno } = req.body;
    const result = await pool.query(
      `UPDATE tipos_carros SET marca=$1, modelo=$2, anio=$3, tipo_freno=$4 WHERE id=$5 RETURNING *`,
      [marca, modelo, anio, tipo_freno, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM tipos_carros WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Tipo de carro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};