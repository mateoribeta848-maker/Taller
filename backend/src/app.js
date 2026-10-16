const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const app = express();

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());

// ⚠️ Aumentamos el límite a 10 MB para soportar fotos en Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// RUTAS
// ============================================
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/repuestos', require('./routes/repuestos.routes'));
app.use('/api/carros', require('./routes/carros.routes'));
app.use('/api/mantenimiento', require('./routes/mantenimiento.routes'));
app.use('/api/tipos-trabajos', require('./routes/tipos-trabajos.routes'));
app.use('/api/categorias-repuestos', require('./routes/categorias-repuestos.routes'));
app.use('/api/trabajos', require('./routes/trabajos.routes'));
app.use('/api/finanzas', require('./routes/finanzas.routes'));
app.use('/api/informes', require('./routes/informes.routes'));
app.use('/api/detalle-trabajos', require('./routes/detalle-trabajos.routes'));
app.use('/api/ordenes', require('./routes/ordenes.routes'));

// ============================================
// RUTA RAÍZ
// ============================================
app.get('/', (req, res) => {
  res.json({
    mensaje: '🔧 API DemonCar - Taller Automotriz funcionando',
    moneda: 'Bolivianos (Bs)',
    version: '2.0.0',
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Error de body demasiado grande (fotos)
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'La imagen es demasiado grande. Usa una foto menor a 2 MB.',
    });
  }

  res.status(500).json({ error: 'Error interno del servidor' });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pagos_trabajos (
        id SERIAL PRIMARY KEY,
        trabajo_id INTEGER NOT NULL UNIQUE REFERENCES trabajos_realizados(id) ON DELETE CASCADE,
        metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'qr')),
        monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
        referencia VARCHAR(100),
        ultimos_digitos CHAR(4),
        numero_recibo VARCHAR(30) UNIQUE,
        creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    app.listen(PORT, () => {
      console.log('====================================');
      console.log('🔧 DemonCar - Taller Automotriz');
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
      console.log(`💰 Moneda: Bolivianos (Bs) - IVA: ${process.env.IVA_PORCENTAJE}%`);
      console.log('====================================');
    });
  } catch (error) {
    console.error('❌ No se pudo preparar la base de datos de finanzas:', error.message);
    process.exitCode = 1;
  }
}

iniciarServidor();