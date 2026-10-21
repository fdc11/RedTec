const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        error: 'Acceso no autorizado. Debe proporcionar un token JWT válido con formato Bearer <token>'
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'redtec_super_secret_jwt_key_2026';

    const decoded = jwt.verify(token, secret);

    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no encontrado o sesión inválida.'
      });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        error: 'El token ha expirado. Por favor inicie sesión nuevamente.'
      });
    }
    return res.status(401).json({
      ok: false,
      error: 'Token inválido o malformado.'
    });
  }
};
