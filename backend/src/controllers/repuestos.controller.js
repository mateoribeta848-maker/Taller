const pool = require('../config/db');

exports.listar = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM repuestos ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bajoStock = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM repuestos WHERE stock <= stock_minimo ORDER BY stock ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM repuestos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, categoria, stock, stock_minimo, precio_compra, precio_venta } = req.body;
    const result = await pool.query(
      `INSERT INTO repuestos (codigo, nombre, descripcion, categoria, stock, stock_minimo, precio_compra, precio_venta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [codigo, nombre, descripcion, categoria, stock, stock_minimo, precio_compra, precio_venta]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, categoria, stock, stock_minimo, precio_compra, precio_venta } = req.body;
    const result = await pool.query(
      `UPDATE repuestos SET codigo=$1, nombre=$2, descripcion=$3, categoria=$4, stock=$5,
       stock_minimo=$6, precio_compra=$7, precio_venta=$8 WHERE id=$9 RETURNING *`,
      [codigo, nombre, descripcion, categoria, stock, stock_minimo, precio_compra, precio_venta, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM repuestos WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Repuesto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};