const pool = require('../config/db');

// Listar todos
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tipos_trabajos WHERE activo = true ORDER BY categoria, nombre'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Listar agrupados por categoría
exports.porCategoria = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tipos_trabajos WHERE activo = true ORDER BY categoria, nombre'
    );

    const agrupados = result.rows.reduce((acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = [];
      acc[item.categoria].push(item);
      return acc;
    }, {});

    res.json(agrupados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener uno
exports.obtener = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipos_trabajos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear
exports.crear = async (req, res) => {
  try {
    const { nombre, categoria, descripcion, precio_base, tiempo_estimado_horas } = req.body;
    const result = await pool.query(
      `INSERT INTO tipos_trabajos (nombre, categoria, descripcion, precio_base, tiempo_estimado_horas)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, categoria, descripcion, precio_base || 0, tiempo_estimado_horas || 0]
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
    const { nombre, categoria, descripcion, precio_base, tiempo_estimado_horas, activo } = req.body;
    const result = await pool.query(
      `UPDATE tipos_trabajos 
       SET nombre=$1, categoria=$2, descripcion=$3, precio_base=$4, 
           tiempo_estimado_horas=$5, activo=$6 
       WHERE id=$7 RETURNING *`,
      [nombre, categoria, descripcion, precio_base, tiempo_estimado_horas, activo, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar
exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM tipos_trabajos WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Tipo de trabajo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};