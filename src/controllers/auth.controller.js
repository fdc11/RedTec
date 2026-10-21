const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * Genera un token JWT firmado mediante algoritmo HS256.
 * Payload mínimo requerido: { id, rol }.
 * Expiración configurable mediante JWT_EXPIRES_IN (default 1h).
 */
const generarToken = (usuario) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';

  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol
    },
    secret,
    { expiresIn }
  );
};

/**
 * Registro de un nuevo usuario en la plataforma.
 *
 * REGLAS DURAS:
 * 1. El rol NUNCA se lee del body. Siempre se fuerza a 'usuario'.
 * 2. Si el correo ya existe, responde 409 Conflict.
 * 3. Nunca devuelve la contraseña en la respuesta.
 */
const register = asyncHandler(async (req, res) => {
  const { nombre, email, password } = req.body;
  const emailNormalizado = email.toLowerCase().trim();

  const usuarioExistente = await Usuario.findOne({ where: { email: emailNormalizado } });
  if (usuarioExistente) {
    throw new AppError('El correo electrónico ya se encuentra registrado en el sistema.', 409);
  }

  // Creación forzando rol 'usuario'
  const nuevoUsuario = await Usuario.create({
    nombre,
    email: emailNormalizado,
    password,
    rol: 'usuario'
  });

  const token = generarToken(nuevoUsuario);

  return res.status(201).json({
    ok: true,
    data: {
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    }
  });
});

/**
 * Inicio de sesión de usuarios.
 *
 * REGLAS DURAS:
 * 1. Utiliza scope('withPassword') para recuperar el hash y validarlo.
 * 2. Mensaje genérico ("Credenciales inválidas") ante usuario inexistente o contraseña incorrecta
 *    para mitigar ataques de enumeración de cuentas.
 * 3. Nunca devuelve el hash de la contraseña al cliente.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const emailNormalizado = email.toLowerCase().trim();

  // Uso explícito del scope withPassword solo para el proceso de autenticación
  const usuario = await Usuario.scope('withPassword').findOne({
    where: { email: emailNormalizado }
  });

  if (!usuario) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const esValida = await usuario.validarPassword(password);
  if (!esValida) {
    throw new AppError('Credenciales inválidas.', 401);
  }

  const token = generarToken(usuario);

  return res.status(200).json({
    ok: true,
    data: {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    }
  });
});

/**
 * Obtener perfil del usuario autenticado actual.
 */
const me = asyncHandler(async (req, res) => {
  return res.status(200).json({
    ok: true,
    data: {
      usuario: req.usuario
    }
  });
});

module.exports = {
  register,
  login,
  me
};
