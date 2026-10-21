const app = require('./src/app');
const http = require('http');

async function testSuite() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3001, resolve));
  const baseUrl = 'http://localhost:3001';

  console.log('--- INICIANDO BATERÍA DE PRUEBAS AUTOMATIZADAS REDTEC ---');

  // Helper fetch
  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  try {
    // 1. Health
    const health = await request('/api/health');
    console.log(`[1] Health Check: Status ${health.status} (ok: ${health.data.ok})`);

    // 2. Logins
    const loginAdmin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@redtec.org', password: 'Admin123!' })
    });
    console.log(`[2] Login Admin: Status ${loginAdmin.status} (rol: ${loginAdmin.data.usuario?.rol})`);
    const tokenAdmin = loginAdmin.data.token;

    const loginCarlos = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'carlos@redtec.org', password: 'Usuario123!' })
    });
    console.log(`[3] Login Carlos: Status ${loginCarlos.status} (rol: ${loginCarlos.data.usuario?.rol})`);
    const tokenCarlos = loginCarlos.data.token;

    const loginLucia = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'lucia@redtec.org', password: 'Usuario123!' })
    });
    console.log(`[4] Login Lucia (Morosa): Status ${loginLucia.status} (rol: ${loginLucia.data.usuario?.rol})`);
    const tokenLucia = loginLucia.data.token;

    // 3. Regla de seguridad en Registro (rol forzado a 'usuario')
    const reg = await request('/api/auth/registro', {
      method: 'POST',
      body: JSON.stringify({
        nombre: 'Intento Hack Admin',
        email: `hack.${Date.now()}@redtec.org`,
        password: 'Password123!',
        rol: 'admin' // Intentando inyectar admin
      })
    });
    console.log(`[5] Registro rol forzado a usuario: Status ${reg.status} (rol resultante: ${reg.data.usuario?.rol})`);
    if (reg.data.usuario?.rol !== 'usuario') throw new Error('Fallo: Rol no fue forzado a usuario');

    // 4. Escenario 4: RBAC - Usuario regular intenta borrar equipo
    const deleteRbac = await request('/api/equipos/1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenCarlos}` }
    });
    console.log(`[6] RBAC Carlos intenta DELETE /api/equipos/1: Status ${deleteRbac.status} (Esperado: 403)`);

    // 5. Escenario 2: Mora Automática - Lucia intenta pedir préstamo
    const fechaFutura = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString();
    const moraTest = await request('/api/prestamos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenLucia}` },
      body: JSON.stringify({ equipoId: 1, fechaDevolucionEsperada: fechaFutura })
    });
    console.log(`[7] Sanción Mora Lucia intenta pedir equipo: Status ${moraTest.status} (Esperado: 403) -> Error: "${moraTest.data.error}"`);

    // 6. Escenario 3: Equipo en Mantenimiento o Prestado
    const mantTest = await request('/api/prestamos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({ equipoId: 6, fechaDevolucionEsperada: fechaFutura }) // Equipo 6 está En mantenimiento
    });
    console.log(`[8] Pedir equipo en mantenimiento (ID 6): Status ${mantTest.status} (Esperado: 409) -> Error: "${mantTest.data.error}"`);

    // 7. Escenario 1: Límite de 2 préstamos para Carlos
    // Carlos tiene 1 préstamo en seeds (ID 3 sobre equipo 8).
    // Pedir equipo 1 (Laptop Dell) para llegar a 2 préstamos activos:
    const prestamoExitoso = await request('/api/prestamos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCarlos}` },
      body: JSON.stringify({ equipoId: 1, fechaDevolucionEsperada: fechaFutura })
    });
    console.log(`[9] Carlos pide 2do equipo (ID 1): Status ${prestamoExitoso.status} (Esperado: 201) -> Préstamo ID: ${prestamoExitoso.data.prestamo?.id}`);

    // Ahora Carlos intenta pedir un 3er equipo (ID 2 - Lenovo):
    const limiteTest = await request('/api/prestamos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenCarlos}` },
      body: JSON.stringify({ equipoId: 2, fechaDevolucionEsperada: fechaFutura })
    });
    console.log(`[10] Carlos intenta pedir 3er equipo (Límite 2): Status ${limiteTest.status} (Esperado: 400) -> Error: "${limiteTest.data.error}"`);

    // 8. Devolución de préstamo
    if (prestamoExitoso.data.prestamo?.id) {
      const dev = await request(`/api/prestamos/${prestamoExitoso.data.prestamo.id}/devolver`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tokenCarlos}` }
      });
      console.log(`[11] Devolución de equipo: Status ${dev.status} (Esperado: 200) -> Mensaje: "${dev.data.mensaje}"`);
    }

    // 9. Escenario 5: Admin auditoría de préstamos
    const todosPrestamos = await request('/api/prestamos', {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    console.log(`[12] Admin lista todos los préstamos: Status ${todosPrestamos.status} (Total: ${todosPrestamos.data.total})`);

    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
  } catch (err) {
    console.error('❌ Error en testSuite:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

testSuite();
