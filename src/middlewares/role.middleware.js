/**
 * Middleware para restringir acceso exclusivamente al rol de Administrador
 */
const soloAdmin = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      ok: false,
      error: 'Usuario no autenticado'
    });
  }

  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({
      ok: false,
      error: 'Acceso denegado. Se requieren privilegios de Administrador para realizar esta acción.'
    });
  }

  next();
};

/**
 * Middleware para permitir una lista específica de roles
 */
const permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        error: `Acceso denegado. Requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  soloAdmin,
  permitirRoles
};
