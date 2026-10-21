/**
 * Wrapper de orden superior para controladores asíncronos en Express 4.
 * Express 4 no captura automáticamente excepciones en promesas rechazadas (async/await).
 * Este helper redirige cualquier excepción al middleware de errores central mediante next(err).
 *
 * @param {Function} fn - Función controladora asíncrona (req, res, next).
 * @returns {Function} Función middleware estándar de Express.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
