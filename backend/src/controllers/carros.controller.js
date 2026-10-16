const pool = require('../config/db');

// ============================================
// LISTAR
// ============================================
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tipos_carros ORDER BY marca, modelo'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// OBTENER UNO
// ============================================
exports.obtener = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tipos_carros WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CREAR
// ============================================
exports.crear = async (req, res) => {
  try {
    const {
      marca,
      modelo,
      anio,
      placa,
      kilometraje,
      nivel_combustible,
      tiene_abolladuras,
      descripcion_abolladuras,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tipos_carros 
       (marca, modelo, anio, placa, kilometraje, nivel_combustible, 
        tiene_abolladuras, descripcion_abolladuras)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        marca,
        modelo,
        anio || null,
        placa || null,
        kilometraje || 0,
        nivel_combustible || '1/2',
        tiene_abolladuras || false,
        descripcion_abolladuras || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ACTUALIZAR
// ============================================
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      marca,
      modelo,
      anio,
      placa,
      kilometraje,
      nivel_combustible,
      tiene_abolladuras,
      descripcion_abolladuras,
    } = req.body;

    const result = await pool.query(
      `UPDATE tipos_carros 
       SET marca=$1, modelo=$2, anio=$3, placa=$4, kilometraje=$5,
           nivel_combustible=$6, tiene_abolladuras=$7, descripcion_abolladuras=$8
       WHERE id=$9 RETURNING *`,
      [
        marca,
        modelo,
        anio || null,
        placa || null,
        kilometraje || 0,
        nivel_combustible || '1/2',
        tiene_abolladuras || false,
        descripcion_abolladuras || null,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ELIMINAR
// ============================================
exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM tipos_carros WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Tipo de carro eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};