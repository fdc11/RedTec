require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');

const PORT = parseInt(process.env.PORT, 10) || 3000;

/**
 * Punto de entrada principal para el arranque del servidor HTTP.
 * Comprueba primero la conectividad activa con el motor MySQL antes de abrir el puerto.
 */
async function iniciarServidor() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión con la base de datos MySQL (InnoDB) verificada exitosamente.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor RedTec ejecutándose en: http://localhost:${PORT}`);
      console.log(`🌐 Frontend disponible en: http://localhost:${PORT}/index.html`);
    });
  } catch (error) {
    console.error('❌ Error crítico al conectar con la base de datos MySQL:', error.message);
    process.exit(1);
  }
}

iniciarServidor();
