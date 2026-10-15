// Genera número de factura único: FAC-00001
async function generarNumeroFactura(pool) {
  const result = await pool.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(numero_factura FROM 5) AS INTEGER)), 0) + 1 AS siguiente 
     FROM trabajos_realizados 
     WHERE numero_factura IS NOT NULL`
  );
  const siguiente = result.rows[0].siguiente;
  return `FAC-${String(siguiente).padStart(5, '0')}`;
}

// Calcula totales con IVA Bolivia (13%)
function calcularTotales(costoManoObra, costoRepuestos, descuento = 0) {
  const manoObra = Number(costoManoObra) || 0;
  const repuestos = Number(costoRepuestos) || 0;
  const desc = Number(descuento) || 0;

  const subtotal = manoObra + repuestos - desc;
  const ivaPorcentaje = Number(process.env.IVA_PORCENTAJE) || 13;
  const iva = subtotal * (ivaPorcentaje / 100);
  const total = subtotal + iva;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    iva: Number(iva.toFixed(2)),
    descuento: Number(desc.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

module.exports = { generarNumeroFactura, calcularTotales };