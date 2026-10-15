const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    const valido = await bcrypt.compare(password, usuario.password_hash);
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
};

// CREAR USUARIO
exports.crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, nombre, email, rol, activo, created_at`,
      [nombre, email, hash, rol || 'tecnico']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LISTAR USUARIOS
exports.listarUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ACTUALIZAR USUARIO
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol, activo, password } = req.body;

    if (password && password.length > 0) {
      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `UPDATE usuarios 
         SET nombre = $1, email = $2, rol = $3, activo = $4, password_hash = $5 
         WHERE id = $6 
         RETURNING id, nombre, email, rol, activo`,
        [nombre, email, rol, activo, hash, id]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `UPDATE usuarios 
       SET nombre = $1, email = $2, rol = $3, activo = $4 
       WHERE id = $5 
       RETURNING id, nombre, email, rol, activo`,
      [nombre, email, rol, activo, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ELIMINAR USUARIO
exports.eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.usuario.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ mensaje: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// VERIFICAR TOKEN
exports.verificar = async (req, res) => {
  res.json({ valido: true, usuario: req.usuario });
};