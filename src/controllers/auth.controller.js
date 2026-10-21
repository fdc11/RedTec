const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario, Prestamo } = require('../models');

/**
 * Genera un token JWT para el usuario
 */
const generarToken = (usuario) => {
  const secret = process.env.JWT_SECRET || 'redtec_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '2h';

  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    },
    secret,
    { expiresIn }
  );
};

/**
 * Registro de un nuevo usuario
 * REGLA DE SEGURIDAD: El rol nunca se acepta desde el body, siempre se asigna 'usuario'.
 */
const registro = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si el correo ya existe
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({
        ok: false,
        error: 'El correo electrónico ya se encuentra registrado.'
      });
    }

    // Creación forzando rol 'usuario'
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password,
      rol: 'usuario'
    });

    const token = generarToken(nuevoUsuario);

    return res.status(201).json({
      ok: true,
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: nuevoUsuario
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al procesar el registro.'
    });
  }
};

/**
 * Inicio de sesión de usuarios
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas. Verifique su correo o contraseña.'
      });
    }

    const passwordValido = await usuario.validarPassword(password);
    if (!passwordValido) {
      return res.status(401).json({
        ok: false,
        error: 'Credenciales inválidas. Verifique su correo o contraseña.'
      });
    }

    const token = generarToken(usuario);

    return res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno del servidor al procesar el inicio de sesión.'
    });
  }
};

/**
 * Obtener perfil del usuario autenticado actual con sus estadísticas de préstamos
 */
const perfil = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    // Conteo de préstamos activos y vencidos
    const prestamosActivos = await Prestamo.count({
      where: {
        usuarioId,
        fechaDevolucionReal: null
      }
    });

    const prestamosEnMora = await Prestamo.count({
      where: {
        usuarioId,
        fechaDevolucionReal: null,
        fechaDevolucionEsperada: { [Op.lt]: new Date() }
      }
    });

    return res.json({
      ok: true,
      usuario: req.usuario,
      estadisticas: {
        prestamosActivos,
        prestamosDisponibles: Math.max(0, 2 - prestamosActivos),
        prestamosEnMora,
        tieneMora: prestamosEnMora > 0
      }
    });
  } catch (error) {
    console.error('Error en perfil:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error interno al consultar el perfil.'
    });
  }
};

module.exports = {
  registro,
  login,
  perfil
};
