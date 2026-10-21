/**
 * Clase personalizada para representar errores operacionales controlados en la API.
 * Permite adjuntar el código de estado HTTP (400, 401, 403, 404, 409, 500)
 * y una lista o detalle opcional para respuestas con formato uniforme.
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensaje descriptivo del error en español.
   * @param {number} statusCode - Código de estado HTTP correspondiente.
   * @param {any} [details=null] - Detalles adicionales (p.ej., campos que fallaron en validación).
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
