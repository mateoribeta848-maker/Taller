const pool = require('../config/db');

const metodoValido = (metodo) => ['efectivo', 'tarjeta', 'qr'].includes(metodo);

exports.listar = async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id AS trabajo_id,
              t.numero_factura,
              t.total,
              t.estado AS estado_trabajo,
              t.fecha_entrada,
              c.nombre || ' ' || c.apellido AS cliente_nombre,
              tc.marca || ' ' || tc.modelo AS carro,
              p.id AS pago_id,
              p.metodo_pago,
              p.monto AS monto_pagado,
              p.referencia,
              p.ultimos_digitos,
              p.numero_recibo,
              p.creado_en AS fecha_pago
       FROM trabajos_realizados t
       LEFT JOIN clientes c ON c.id = t.cliente_id
       LEFT JOIN tipos_carros tc ON tc.id = t.tipo_carro_id
       LEFT JOIN pagos_trabajos p ON p.trabajo_id = t.id
       ORDER BY t.id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registrarPago = async (req, res) => {
  const { trabajoId } = req.params;
  const { metodo, referencia, ultimos_digitos: ultimosDigitos } = req.body;

  if (!/^\d+$/.test(trabajoId) || !metodoValido(metodo)) {
    return res.status(400).json({ error: 'Trabajo o método de pago inválido.' });
  }
  if (metodo === 'tarjeta' && (typeof ultimosDigitos !== 'string' || !/^\d{4}$/.test(ultimosDigitos))) {
    return res.status(400).json({ error: 'Ingresa únicamente los últimos 4 dígitos de la tarjeta.' });
  }
  if (metodo === 'qr' && (typeof referencia !== 'string' || !/^DEMO-[A-Z0-9-]{8,80}$/.test(referencia))) {
    return res.status(400).json({ error: 'La referencia del QR de demostración no es válida.' });
  }
  if (metodo === 'tarjeta' && referencia && (typeof referencia !== 'string' || referencia.length > 100)) {
    return res.status(400).json({ error: 'La referencia de tarjeta es demasiado larga.' });
  }

  let client;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;
    const trabajo = await client.query(
      `SELECT t.id, t.numero_factura, t.total, c.nombre || ' ' || c.apellido AS cliente_nombre
       FROM trabajos_realizados t
       LEFT JOIN clientes c ON c.id = t.cliente_id
       WHERE t.id = $1
       FOR UPDATE OF t`,
      [trabajoId]
    );
    if (trabajo.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'No se encontró el trabajo seleccionado.' });
    }

    const existente = await client.query('SELECT id FROM pagos_trabajos WHERE trabajo_id = $1', [trabajoId]);
    if (existente.rows.length > 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({ error: 'Este trabajo ya tiene un pago registrado.' });
    }

    const datosTrabajo = trabajo.rows[0];
    const pago = await client.query(
      `INSERT INTO pagos_trabajos
        (trabajo_id, metodo_pago, monto, referencia, ultimos_digitos)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, trabajo_id, metodo_pago, monto, referencia, ultimos_digitos,
                 numero_recibo, creado_en AS fecha_pago`,
      [
        trabajoId,
        metodo,
        datosTrabajo.total,
        metodo === 'efectivo' ? null : referencia || null,
        metodo === 'tarjeta' ? ultimosDigitos : null,
      ]
    );

    let pagoRegistrado = pago.rows[0];
    if (metodo === 'efectivo') {
      const recibo = `REC-${new Date().getFullYear()}-${String(pagoRegistrado.id).padStart(6, '0')}`;
      const actualizado = await client.query(
        `UPDATE pagos_trabajos SET numero_recibo = $1 WHERE id = $2
         RETURNING id, trabajo_id, metodo_pago, monto, referencia, ultimos_digitos,
                   numero_recibo, creado_en AS fecha_pago`,
        [recibo, pagoRegistrado.id]
      );
      pagoRegistrado = actualizado.rows[0];
    }

    await client.query('COMMIT');
    transactionStarted = false;
    res.status(201).json({
      ...pagoRegistrado,
      numero_factura: datosTrabajo.numero_factura,
      cliente_nombre: datosTrabajo.cliente_nombre,
    });
  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error al revertir el registro de pago:', rollbackError);
      }
    }
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Este trabajo ya tiene un pago registrado.' });
    }
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: 'No se pudo registrar el pago.' });
  } finally {
    if (client) client.release();
  }
};
