const pool = require('../config/db');

// ============================================
// OBTENER INFORME POR TRABAJO
// Si no existe informe, devuelve datos del trabajo con informe vacío
// ============================================
exports.obtenerPorTrabajo = async (req, res) => {
  try {
    const { trabajoId } = req.params;

    // 1. Obtener datos del trabajo (siempre)
    const trabajo = await pool.query(
      `SELECT t.id, t.numero_factura, t.descripcion AS descripcion_trabajo,
              t.fecha_entrada, t.fecha_salida, t.total AS total_trabajo,
              t.foto_cliente, t.foto_carro,
              c.nombre || ' ' || c.apellido AS cliente_nombre,
              c.cedula AS cliente_cedula,
              c.telefono AS cliente_telefono,
              tc.marca || ' ' || tc.modelo AS carro
       FROM trabajos_realizados t
       LEFT JOIN clientes c ON t.cliente_id = c.id
       LEFT JOIN tipos_carros tc ON t.tipo_carro_id = tc.id
       WHERE t.id = $1`,
      [trabajoId]
    );

    if (trabajo.rows.length === 0) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    // 2. Buscar informe (puede no existir)
    const informeResult = await pool.query(
      'SELECT * FROM informes_servicio WHERE trabajo_id = $1',
      [trabajoId]
    );

    // 3. Si no existe informe, crear uno "vacío" con datos del trabajo
    let informe;
if (informeResult.rows.length === 0) {
  // Traer datos del vehículo
  const vehiculo = await pool.query(
    `SELECT tc.kilometraje, tc.nivel_combustible, tc.tiene_abolladuras, 
            tc.descripcion_abolladuras, tc.placa
     FROM tipos_carros tc
     JOIN trabajos_realizados t ON t.tipo_carro_id = tc.id
     WHERE t.id = $1`,
    [trabajoId]
  );

  const datosVehiculo = vehiculo.rows[0] || {};

  // Traer usuario actual (firma técnico por defecto)
  const usuarioActual = req.usuario?.nombre || '';

  informe = {
    id: null,
    trabajo_id: Number(trabajoId),
    kilometraje: datosVehiculo.kilometraje || 0,
    nivel_combustible: datosVehiculo.nivel_combustible || '1/2',
    hallazgos: datosVehiculo.tiene_abolladuras 
      ? `Abolladuras: ${datosVehiculo.descripcion_abolladuras || 'Sin detalles'}` 
      : '',
    recomendaciones: '',
    proximo_servicio_km: 0,
    proximo_servicio_fecha: null,
    firma_tecnico: usuarioActual,
    firma_cliente: '',
    observaciones_entrega: '',
    fecha_entrega: null,
    garantia_dias: 30,
    ...trabajo.rows[0],
  };
} else {
  // Si ya existe, traer los datos más recientes del vehículo también
  const vehiculo = await pool.query(
    `SELECT tc.placa
     FROM tipos_carros tc
     JOIN trabajos_realizados t ON t.tipo_carro_id = tc.id
     WHERE t.id = $1`,
    [trabajoId]
  );

  informe = {
    ...informeResult.rows[0],
    placa: vehiculo.rows[0]?.placa || null,
    ...trabajo.rows[0],
  };
}

    // 4. Checklist (vacío si no existe)
    let checklist = [];
    if (informeResult.rows.length > 0) {
      const checklistResult = await pool.query(
        'SELECT * FROM checklist_entrega WHERE informe_id = $1 ORDER BY id',
        [informeResult.rows[0].id]
      );
      checklist = checklistResult.rows;
    }

    // 5. Detalle de trabajos realizados
    const detalle = await pool.query(
      `SELECT dt.*, tt.nombre AS tipo_nombre, tt.categoria
       FROM detalle_trabajos_realizados dt
       LEFT JOIN tipos_trabajos tt ON dt.tipo_trabajo_id = tt.id
       WHERE dt.trabajo_id = $1
       ORDER BY dt.id`,
      [trabajoId]
    );

    // 6. Repuestos usados
    const repuestos = await pool.query(
      `SELECT dtr.*, r.nombre AS repuesto_nombre, r.codigo AS repuesto_codigo
       FROM detalle_trabajo dtr
       LEFT JOIN repuestos r ON dtr.repuesto_id = r.id
       WHERE dtr.trabajo_id = $1`,
      [trabajoId]
    );

    res.json({
      informe,
      checklist,
      detalle: detalle.rows,
      repuestos: repuestos.rows,
    });
  } catch (error) {
    console.error('Error al obtener informe:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// CREAR O ACTUALIZAR INFORME (upsert)
// ============================================
exports.crearOActualizar = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { trabajoId } = req.params;
    const {
      kilometraje,
      nivel_combustible,
      hallazgos,
      recomendaciones,
      proximo_servicio_km,
      proximo_servicio_fecha,
      firma_tecnico,
      firma_cliente,
      observaciones_entrega,
      garantia_dias,
      checklist,
    } = req.body;

    // Verificar que el trabajo existe
    const trabajo = await client.query(
      'SELECT id FROM trabajos_realizados WHERE id = $1',
      [trabajoId]
    );
    if (trabajo.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    // Upsert del informe
    const result = await client.query(
      `INSERT INTO informes_servicio 
       (trabajo_id, kilometraje, nivel_combustible, hallazgos, recomendaciones,
        proximo_servicio_km, proximo_servicio_fecha, firma_tecnico, firma_cliente,
        observaciones_entrega, fecha_entrega, garantia_dias)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11)
       ON CONFLICT (trabajo_id) DO UPDATE SET
         kilometraje = EXCLUDED.kilometraje,
         nivel_combustible = EXCLUDED.nivel_combustible,
         hallazgos = EXCLUDED.hallazgos,
         recomendaciones = EXCLUDED.recomendaciones,
         proximo_servicio_km = EXCLUDED.proximo_servicio_km,
         proximo_servicio_fecha = EXCLUDED.proximo_servicio_fecha,
         firma_tecnico = EXCLUDED.firma_tecnico,
         firma_cliente = EXCLUDED.firma_cliente,
         observaciones_entrega = EXCLUDED.observaciones_entrega,
         garantia_dias = EXCLUDED.garantia_dias,
         fecha_entrega = NOW()
       RETURNING *`,
      [
        trabajoId,
        kilometraje || 0,
        nivel_combustible || '1/2',
        hallazgos || '',
        recomendaciones || '',
        proximo_servicio_km || 0,
        proximo_servicio_fecha || null,
        firma_tecnico || '',
        firma_cliente || '',
        observaciones_entrega || '',
        garantia_dias || 30,
      ]
    );

    const informeId = result.rows[0].id;

    // Guardar checklist (borrar anteriores y crear nuevos)
    if (checklist && checklist.length > 0) {
      await client.query('DELETE FROM checklist_entrega WHERE informe_id = $1', [informeId]);

      for (const item of checklist) {
        await client.query(
          `INSERT INTO checklist_entrega (informe_id, item, estado, observacion)
           VALUES ($1, $2, $3, $4)`,
          [informeId, item.item, item.estado || 'ok', item.observacion || null]
        );
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al guardar informe:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// ============================================
// ELIMINAR INFORME
// ============================================
exports.eliminar = async (req, res) => {
  try {
    const { trabajoId } = req.params;
    await pool.query('DELETE FROM informes_servicio WHERE trabajo_id = $1', [trabajoId]);
    res.json({ mensaje: 'Informe eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};