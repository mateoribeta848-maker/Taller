const pool = require('../config/db');

// ============================================
// Generar número de orden único: ORD-00001
// ============================================
async function generarNumeroOrden(client) {
  const result = await client.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(numero_orden FROM 5) AS INTEGER)), 0) + 1 AS siguiente 
     FROM ordenes_trabajo 
     WHERE numero_orden IS NOT NULL`
  );
  const siguiente = result.rows[0].siguiente;
  return `ORD-${String(siguiente).padStart(5, '0')}`;
}

// ============================================
// LISTAR TODAS LAS ÓRDENES
// ============================================
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              c.nombre || ' ' || c.apellido AS cliente_nombre,
              c.cedula AS cliente_cedula,
              tc.marca || ' ' || tc.modelo AS vehiculo,
              (SELECT COUNT(*) FROM detalle_orden d WHERE d.orden_id = o.id) AS total_servicios,
              (SELECT COALESCE(SUM(d.precio), 0) FROM detalle_orden d WHERE d.orden_id = o.id) AS total_precio
       FROM ordenes_trabajo o
       LEFT JOIN clientes c ON o.cliente_id = c.id
       LEFT JOIN tipos_carros tc ON o.tipo_carro_id = tc.id
       ORDER BY o.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// OBTENER UNA ORDEN CON SU DETALLE
// ============================================
exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;

    const orden = await pool.query(
      `SELECT o.*, 
              c.nombre || ' ' || c.apellido AS cliente_nombre,
              c.cedula AS cliente_cedula,
              c.telefono AS cliente_telefono,
              tc.marca || ' ' || tc.modelo AS vehiculo,
              tc.anio AS vehiculo_anio
       FROM ordenes_trabajo o
       LEFT JOIN clientes c ON o.cliente_id = c.id
       LEFT JOIN tipos_carros tc ON o.tipo_carro_id = tc.id
       WHERE o.id = $1`,
      [id]
    );

    if (orden.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const detalle = await pool.query(
      `SELECT d.*, tt.nombre AS tipo_nombre, tt.categoria
       FROM detalle_orden d
       LEFT JOIN tipos_trabajos tt ON d.tipo_trabajo_id = tt.id
       WHERE d.orden_id = $1
       ORDER BY d.id`,
      [id]
    );

    res.json({ orden: orden.rows[0], detalle: detalle.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CREAR ORDEN CON DETALLE
// ============================================
exports.crear = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      cliente_id,
      tipo_carro_id,
      placa,
      mecanico_asignado,
      estado,
      observaciones,
      servicios, // Array: [{ tipo_trabajo_id, descripcion, precio }]
    } = req.body;

    const numeroOrden = await generarNumeroOrden(client);

    const resultOrden = await client.query(
      `INSERT INTO ordenes_trabajo 
       (numero_orden, cliente_id, tipo_carro_id, placa, mecanico_asignado, estado, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [numeroOrden, cliente_id, tipo_carro_id, placa, mecanico_asignado, estado || 'pendiente', observaciones]
    );

    const ordenId = resultOrden.rows[0].id;

    if (servicios && servicios.length > 0) {
      for (const s of servicios) {
        await client.query(
          `INSERT INTO detalle_orden (orden_id, tipo_trabajo_id, descripcion, precio, completado)
           VALUES ($1, $2, $3, $4, $5)`,
          [ordenId, s.tipo_trabajo_id, s.descripcion || '', s.precio || 0, s.completado || false]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(resultOrden.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ============================================
// ACTUALIZAR ORDEN
// ============================================
exports.actualizar = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      cliente_id,
      tipo_carro_id,
      placa,
      mecanico_asignado,
      estado,
      observaciones,
      servicios,
    } = req.body;

    const fechaEntrega = estado === 'finalizado' ? new Date() : null;

    const result = await client.query(
      `UPDATE ordenes_trabajo 
       SET cliente_id=$1, tipo_carro_id=$2, placa=$3, mecanico_asignado=$4, 
           estado=$5, observaciones=$6,
           fecha_entrega = CASE 
             WHEN $5 = 'finalizado' THEN COALESCE(fecha_entrega, NOW()) 
             ELSE fecha_entrega 
           END
       WHERE id=$7 
       RETURNING *`,
      [cliente_id, tipo_carro_id, placa, mecanico_asignado, estado, observaciones, id]
    );

    // Actualizar servicios (borrar y crear)
    if (servicios) {
      await client.query('DELETE FROM detalle_orden WHERE orden_id = $1', [id]);

      for (const s of servicios) {
        await client.query(
          `INSERT INTO detalle_orden (orden_id, tipo_trabajo_id, descripcion, precio, completado)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, s.tipo_trabajo_id, s.descripcion || '', s.precio || 0, s.completado || false]
        );
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ============================================
// ACTUALIZAR SOLO ESTADO
// ============================================
exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const result = await pool.query(
      `UPDATE ordenes_trabajo 
       SET estado = $1,
           fecha_entrega = CASE 
             WHEN $1 = 'finalizado' THEN COALESCE(fecha_entrega, NOW()) 
             ELSE fecha_entrega 
           END
       WHERE id = $2 
       RETURNING *`,
      [estado, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ELIMINAR ORDEN
// ============================================
exports.eliminar = async (req, res) => {
  try {
    await pool.query('DELETE FROM ordenes_trabajo WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Orden eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  