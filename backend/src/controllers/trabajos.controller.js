const pool = require('../config/db');
const { generarNumeroFactura, calcularTotales } = require('../utils/factura');

// ============================================
// LISTAR TODOS LOS TRABAJOS
// ============================================
exports.listar = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
              c.nombre || ' ' || c.apellido AS cliente_nombre,
              c.cedula AS cliente_cedula,
              tc.marca || ' ' || tc.modelo AS carro
       FROM trabajos_realizados t
       LEFT JOIN clientes c ON t.cliente_id = c.id
       LEFT JOIN tipos_carros tc ON t.tipo_carro_id = tc.id
       ORDER BY t.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// OBTENER UN TRABAJO CON SU DETALLE (FACTURA COMPLETA)
// ============================================
exports.obtener = async (req, res) => {
  try {
    const { id } = req.params;

    const trabajo = await pool.query(
      `SELECT t.*, 
              c.nombre || ' ' || c.apellido AS cliente_nombre,
              c.cedula AS cliente_cedula,
              c.telefono AS cliente_telefono,
              c.direccion AS cliente_direccion,
              tc.marca || ' ' || tc.modelo AS carro
       FROM trabajos_realizados t
       LEFT JOIN clientes c ON t.cliente_id = c.id
       LEFT JOIN tipos_carros tc ON t.tipo_carro_id = tc.id
       WHERE t.id = $1`,
      [id]
    );

    if (trabajo.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    const detalle = await pool.query(
      `SELECT dt.*, r.nombre AS repuesto_nombre, r.codigo AS repuesto_codigo
       FROM detalle_trabajo dt
       LEFT JOIN repuestos r ON dt.repuesto_id = r.id
       WHERE dt.trabajo_id = $1`,
      [id]
    );

    res.json({ trabajo: trabajo.rows[0], detalle: detalle.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CREAR TRABAJO CON DETALLE Y FACTURA
// ============================================
exports.crear = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      cliente_id,
      tipo_carro_id,
      descripcion,
      costo_mano_obra,
      descuento,
      estado,
      observaciones,
      repuestos,
      foto_cliente,
      foto_carro,
    } = req.body;

    // 1. Calcular costo de repuestos y validar stock
    let costoRepuestos = 0;
    const repuestosDetalle = [];

    if (repuestos && repuestos.length > 0) {
      for (const item of repuestos) {
        const r = await client.query('SELECT * FROM repuestos WHERE id = $1', [item.repuesto_id]);
        if (r.rows.length === 0) {
          throw new Error(`Repuesto con ID ${item.repuesto_id} no existe`);
        }
        const rep = r.rows[0];

        if (rep.stock < item.cantidad) {
          throw new Error(`Stock insuficiente de "${rep.nombre}". Disponible: ${rep.stock}, solicitado: ${item.cantidad}`);
        }

        const subtotalRep = Number(rep.precio_venta) * item.cantidad;
        costoRepuestos += subtotalRep;

        repuestosDetalle.push({
          repuesto_id: item.repuesto_id,
          cantidad: item.cantidad,
          precio_unitario: rep.precio_venta,
          subtotal: subtotalRep,
        });
      }
    }

    // 2. Calcular totales
    const { subtotal, iva, descuento: desc, total } = calcularTotales(
      costo_mano_obra,
      costoRepuestos,
      descuento
    );

    // 3. Generar número de factura
    const numeroFactura = await generarNumeroFactura(client);

    // 4. Calcular fecha_salida
    const estadoFinal = estado || 'pendiente';
    const fechaSalida = estadoFinal === 'finalizado' ? new Date() : null;

    // 5. Insertar el trabajo
    const resultTrabajo = await client.query(
      `INSERT INTO trabajos_realizados 
       (numero_factura, cliente_id, tipo_carro_id, descripcion, costo_mano_obra, 
        costo_repuestos, subtotal, iva, descuento, total, estado, observaciones, 
        fecha_salida, foto_cliente, foto_carro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        numeroFactura,
        cliente_id,
        tipo_carro_id,
        descripcion,
        costo_mano_obra,
        costoRepuestos,
        subtotal,
        iva,
        desc,
        total,
        estadoFinal,
        observaciones,
        fechaSalida,
        foto_cliente || null,
        foto_carro || null,
      ]
    );

    const trabajoId = resultTrabajo.rows[0].id;

    // 6. Insertar el detalle y descontar stock
    for (const item of repuestosDetalle) {
      await client.query(
        `INSERT INTO detalle_trabajo 
         (trabajo_id, repuesto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [trabajoId, item.repuesto_id, item.cantidad, item.precio_unitario, item.subtotal]
      );

      await client.query(
        'UPDATE repuestos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.repuesto_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(resultTrabajo.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear trabajo:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ============================================
// ACTUALIZAR ESTADO DEL TRABAJO
// ============================================
exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const result = await pool.query(
      `UPDATE trabajos_realizados 
       SET estado = $1,
           fecha_salida = CASE 
             WHEN $1 = 'finalizado' THEN COALESCE(fecha_salida, CURRENT_TIMESTAMP)
             ELSE fecha_salida
           END
       WHERE id = $2 
       RETURNING *`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// ELIMINAR TRABAJO (devuelve stock)
// ============================================
exports.eliminar = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const trabajo = await client.query('SELECT id FROM trabajos_realizados WHERE id = $1', [id]);
    if (trabajo.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    const detalle = await client.query(
      'SELECT * FROM detalle_trabajo WHERE trabajo_id = $1',
      [id]
    );

    for (const item of detalle.rows) {
      await client.query(
        'UPDATE repuestos SET stock = stock + $1 WHERE id = $2',
        [item.cantidad, item.repuesto_id]
      );
    }

    await client.query('DELETE FROM trabajos_realizados WHERE id = $1', [id]);
    await client.query('COMMIT');

    res.json({ mensaje: 'Trabajo eliminado y stock restaurado' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar trabajo:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ============================================
// ESTADÍSTICAS PARA EL DASHBOARD
// ============================================
exports.estadisticas = async (req, res) => {
  try {
    const clientes = await pool.query('SELECT COUNT(*) FROM clientes');
    const repuestos = await pool.query('SELECT COUNT(*) FROM repuestos');
    const trabajos = await pool.query('SELECT COUNT(*) FROM trabajos_realizados');
    const bajoStock = await pool.query(
      'SELECT COUNT(*) FROM repuestos WHERE stock <= stock_minimo'
    );
    const ingresosMes = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS total 
       FROM trabajos_realizados 
       WHERE estado = 'finalizado' 
       AND EXTRACT(MONTH FROM fecha_entrada) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(YEAR FROM fecha_entrada) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );

    res.json({
      clientes: Number(clientes.rows[0].count),
      repuestos: Number(repuestos.rows[0].count),
      trabajos: Number(trabajos.rows[0].count),
      bajoStock: Number(bajoStock.rows[0].count),
      ingresosMes: Number(ingresosMes.rows[0].total),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};