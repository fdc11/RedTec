const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const AppError = require('../utils/AppError');

/**
 * Middleware para validar el token JWT y autenticar la petición.
 *
 * Flujo:
 * 1. Extrae el encabezado Authorization con esquema Bearer.
 * 2. Verifica la firma criptográfica usando JWT_SECRET.
 * 3. Recupera los datos del usuario en la BD (aplicando defaultScope que excluye password).
 * 4. Deja la instancia en req.usuario para su consumo en los controladores posteriores.
 */
const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(
        new AppError('Acceso no autorizado: Debe proporcionar un token JWT con formato Bearer <token>.', 401)
      );
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next(new AppError('Error de configuración del servidor: JWT_SECRET no definido.', 500));
    }

    // Verificación de firma y expiración del token (HS256)
    const decoded = jwt.verify(token, secret);

    // Búsqueda del usuario (defaultScope oculta el campo password de manera transparente)
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) {
      return next(new AppError('Usuario no encontrado o sesión inválida.', 401));
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('El token ha expirado. Por favor, inicie sesión nuevamente.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token de autenticación inválido o malformado.', 401));
    }
    next(error);
  }
};

module.exports = {
  verificarToken
};
