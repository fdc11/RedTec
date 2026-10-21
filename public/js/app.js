// Estado de la aplicación en el cliente
let tokenActual = localStorage.getItem('redtec_token') || null;
let usuarioActual = JSON.parse(localStorage.getItem('redtec_usuario') || 'null');

// Al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
  actualizarVistaSesion();
  cargarEquipos();

  // Configurar fecha mínima de devolución para el modal (mañana)
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const inputFecha = document.getElementById('prestamo-fecha-devolucion');
  if (inputFecha) {
    inputFecha.min = manana.toISOString().split('T')[0];
    inputFecha.value = manana.toISOString().split('T')[0];
  }
});

// ==========================================
// UTILIDADES DE CONSOLA Y ALERTAS
// ==========================================

function logConsola(metodo, url, status, data) {
  const consola = document.getElementById('api-console');
  if (!consola) return;

  const timestamp = new Date().toLocaleTimeString();
  const color = status >= 200 && status < 300 ? '#10b981' : (status >= 400 && status < 500 ? '#f59e0b' : '#ef4444');
  
  const linea = `[${timestamp}] ${metodo} ${url} -> HTTP ${status}\n${JSON.stringify(data, null, 2)}\n\n`;
  consola.textContent = linea + consola.textContent;
}

function limpiarConsola() {
  const consola = document.getElementById('api-console');
  if (consola) consola.textContent = 'Consola vacía. Ejecute una prueba para ver la respuesta.';
}

function mostrarAlerta(tipo, mensaje) {
  const container = document.getElementById('alert-container');
  if (!container) return;

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo} alert-dismissible fade show shadow-sm`;
  alertDiv.role = 'alert';
  alertDiv.innerHTML = `
    <div>${mensaje}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  container.prepend(alertDiv);

  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 200);
  }, 6000);
}

// ==========================================
// GESTIÓN DE SESIÓN Y AUTENTICACIÓN
// ==========================================

function actualizarVistaSesion() {
  const sessionInfo = document.getElementById('session-info');
  const navUserArea = document.getElementById('nav-user-area');
  const navAdmin = document.getElementById('nav-admin');
  const panelAdmin = document.getElementById('panel-admin');

  if (usuarioActual && tokenActual) {
    const rolBadge = usuarioActual.rol === 'admin' 
      ? '<span class="badge bg-danger">ADMINISTRADOR</span>' 
      : '<span class="badge bg-primary">USUARIO</span>';

    sessionInfo.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-person-check-fill text-success fs-5"></i>
        <div>
          <strong class="me-2">${usuarioActual.nombre}</strong> ${rolBadge}
          <div class="text-muted small">${usuarioActual.email}</div>
        </div>
      </div>
    `;

    navUserArea.innerHTML = `
      <span class="navbar-text text-light me-2 small d-none d-md-inline">
        Hola, <strong>${usuarioActual.nombre.split(' ')[0]}</strong>
      </span>
      <button class="btn btn-outline-danger btn-sm" onclick="cerrarSesion()">
        <i class="bi bi-box-arrow-right me-1"></i> Salir
      </button>
    `;

    if (usuarioActual.rol === 'admin') {
      navAdmin?.classList.remove('d-none');
      panelAdmin?.classList.remove('d-none');
      cargarTodosPrestamos();
    } else {
      navAdmin?.classList.add('d-none');
      panelAdmin?.classList.add('d-none');
    }

    cargarMisPrestamos();
  } else {
    sessionInfo.innerHTML = `
      <span class="text-secondary"><i class="bi bi-person-x me-1"></i> No has iniciado sesión (Modo Lectura Pública)</span>
    `;

    navUserArea.innerHTML = `
      <button class="btn btn-outline-light btn-sm" data-bs-toggle="modal" data-bs-target="#modalAuth" id="btn-open-login">
        <i class="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión
      </button>
    `;

    navAdmin?.classList.add('d-none');
    panelAdmin?.classList.add('d-none');

    const tbody = document.getElementById('mis-prestamos-tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            Inicia sesión para ver tus préstamos activos.
          </td>
        </tr>
      `;
    }
  }
}

async function quickLogin(email, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    logConsola('POST', '/api/auth/login', res.status, data);

    if (res.ok) {
      tokenActual = data.token;
      usuarioActual = data.usuario;
      localStorage.setItem('redtec_token', tokenActual);
      localStorage.setItem('redtec_usuario', JSON.stringify(usuarioActual));

      mostrarAlerta('success', `Sesión iniciada como <strong>${usuarioActual.nombre}</strong> (${usuarioActual.rol})`);
      actualizarVistaSesion();
      cargarEquipos();
    } else {
      mostrarAlerta('danger', data.error || 'Error al iniciar sesión');
    }
  } catch (error) {
    console.error('Error en quickLogin:', error);
    mostrarAlerta('danger', 'Error de conexión con el servidor.');
  }
}

async function hacerLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  await quickLogin(email, password);

  const modalEl = document.getElementById('modalAuth');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();
}

async function hacerRegistro(e) {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });

    const data = await res.json();
    logConsola('POST', '/api/auth/registro', res.status, data);

    if (res.ok) {
      tokenActual = data.token;
      usuarioActual = data.usuario;
      localStorage.setItem('redtec_token', tokenActual);
      localStorage.setItem('redtec_usuario', JSON.stringify(usuarioActual));

      mostrarAlerta('success', `¡Cuenta creada exitosamente! Bienvenido, ${usuarioActual.nombre}.`);
      actualizarVistaSesion();
      cargarEquipos();

      const modalEl = document.getElementById('modalAuth');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    } else {
      mostrarAlerta('danger', data.error || 'Error al registrar usuario');
    }
  } catch (error) {
    mostrarAlerta('danger', 'Error de conexión.');
  }
}

function cerrarSesion() {
  tokenActual = null;
  usuarioActual = null;
  localStorage.removeItem('redtec_token');
  localStorage.removeItem('redtec_usuario');
  mostrarAlerta('info', 'Has cerrado sesión.');
  actualizarVistaSesion();
  cargarEquipos();
}

// ==========================================
// INVENTARIO DE EQUIPOS
// ==========================================

async function cargarEquipos() {
  try {
    const categoria = document.getElementById('filtro-categoria')?.value || '';
    const estado = document.getElementById('filtro-estado')?.value || '';

    const params = new URLSearchParams();
    if (categoria) params.append('categoria', categoria);
    if (estado) params.append('estado', estado);

    const res = await fetch(`/api/equipos?${params.toString()}`);
    const data = await res.json();

    const grid = document.getElementById('equipos-grid');
    if (!grid) return;

    if (!data.equipos || data.equipos.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5 text-muted">
          <i class="bi bi-inbox fs-1 d-block mb-2"></i>
          No se encontraron equipos con los filtros seleccionados.
        </div>
      `;
      return;
    }

    grid.innerHTML = data.equipos.map((equipo) => {
      let badgeClass = 'badge-estado-disponible';
      let icon = 'bi-check-circle';
      if (equipo.estado === 'Prestado') {
        badgeClass = 'badge-estado-prestado';
        icon = 'bi-clock-history';
      } else if (equipo.estado === 'En mantenimiento') {
        badgeClass = 'badge-estado-mantenimiento';
        icon = 'bi-tools';
      }

      const esDisponible = equipo.estado === 'Disponible';
      const puedeSolicitar = Boolean(tokenActual && esDisponible);

      return `
        <div class="col-md-6 col-lg-3">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge bg-light text-dark border">${equipo.categoria}</span>
                <span class="badge ${badgeClass}">
                  <i class="bi ${icon} me-1"></i>${equipo.estado}
                </span>
              </div>
              <h5 class="card-title fw-bold mb-3">${equipo.nombre}</h5>
              <div class="mt-auto pt-2 border-top">
                <button 
                  class="btn btn-sm w-100 ${esDisponible ? 'btn-primary' : 'btn-outline-secondary'}" 
                  ${!esDisponible ? 'disabled' : ''}
                  onclick="abrirModalPrestamo(${equipo.id}, '${equipo.nombre.replace(/'/g, "\\'")}', '${equipo.categoria}')">
                  <i class="bi bi-box-arrow-up-right me-1"></i>
                  ${esDisponible ? (tokenActual ? 'Solicitar Préstamo' : 'Inicia Sesión para Pedir') : equipo.estado}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al cargar equipos:', error);
  }
}

function abrirModalPrestamo(id, nombre, categoria) {
  if (!tokenActual) {
    const modalAuthEl = new bootstrap.Modal(document.getElementById('modalAuth'));
    modalAuthEl.show();
    mostrarAlerta('warning', 'Debes iniciar sesión para solicitar un préstamo.');
    return;
  }

  document.getElementById('prestamo-equipo-id').value = id;
  document.getElementById('prestamo-equipo-nombre').textContent = nombre;
  document.getElementById('prestamo-equipo-categoria').textContent = categoria;

  const modalEl = new bootstrap.Modal(document.getElementById('modalSolicitarPrestamo'));
  modalEl.show();
}

async function enviarSolicitudPrestamo(e) {
  e.preventDefault();
  const equipoId = parseInt(document.getElementById('prestamo-equipo-id').value);
  const fechaDevolucionEsperada = document.getElementById('prestamo-fecha-devolucion').value;

  try {
    const res = await fetch('/api/prestamos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ equipoId, fechaDevolucionEsperada })
    });

    const data = await res.json();
    logConsola('POST', '/api/prestamos', res.status, data);

    const modalEl = bootstrap.Modal.getInstance(document.getElementById('modalSolicitarPrestamo'));
    if (modalEl) modalEl.hide();

    if (res.ok) {
      mostrarAlerta('success', `<strong>¡Éxito!</strong> ${data.mensaje}`);
      cargarEquipos();
      cargarMisPrestamos();
    } else {
      mostrarAlerta('danger', `<strong>Error ${res.status}:</strong> ${data.error || 'No se pudo procesar la solicitud'}`);
    }
  } catch (error) {
    mostrarAlerta('danger', 'Error de comunicación con la API.');
  }
}

// ==========================================
// MIS PRÉSTAMOS
// ==========================================

async function cargarMisPrestamos() {
  if (!tokenActual) return;

  try {
    const res = await fetch('/api/prestamos/mis-prestamos', {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const data = await res.json();

    const tbody = document.getElementById('mis-prestamos-tbody');
    if (!tbody) return;

    if (!data.prestamos || data.prestamos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            No tienes préstamos registrados en tu historial.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.prestamos.map((p) => {
      const fPrestamo = new Date(p.fechaPrestamo).toLocaleDateString();
      const fEsperada = new Date(p.fechaDevolucionEsperada).toLocaleDateString();

      let estadoHtml = '';
      if (!p.activo) {
        estadoHtml = `<span class="badge bg-secondary"><i class="bi bi-check-all me-1"></i>Devuelto (${new Date(p.fechaDevolucionReal).toLocaleDateString()})</span>`;
      } else if (p.enMora) {
        estadoHtml = `<span class="badge bg-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>¡EN MORA (VENCIDO)!</span>`;
      } else {
        estadoHtml = `<span class="badge bg-success"><i class="bi bi-clock-history me-1"></i>Activo</span>`;
      }

      return `
        <tr class="${p.enMora ? 'table-danger' : ''}">
          <td class="fw-bold">${p.equipo ? p.equipo.nombre : `Equipo #${p.equipoId}`}</td>
          <td><span class="badge bg-light text-dark border">${p.equipo ? p.equipo.categoria : '-'}</span></td>
          <td>${fPrestamo}</td>
          <td>${fEsperada}</td>
          <td>${estadoHtml}</td>
          <td class="text-end">
            ${p.activo ? `
              <button class="btn btn-sm btn-outline-success" onclick="devolverEquipo(${p.id})">
                <i class="bi bi-arrow-return-left me-1"></i> Devolver
              </button>
            ` : '<span class="text-muted small">Completado</span>'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error al cargar mis préstamos:', error);
  }
}

async function devolverEquipo(prestamoId) {
  if (!confirm('¿Confirmas la devolución de este equipo?')) return;

  try {
    const res = await fetch(`/api/prestamos/${prestamoId}/devolver`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const data = await res.json();
    logConsola('PUT', `/api/prestamos/${prestamoId}/devolver`, res.status, data);

    if (res.ok) {
      mostrarAlerta('success', data.mensaje);
      cargarEquipos();
      cargarMisPrestamos();
    } else {
      mostrarAlerta('danger', data.error || 'Error al devolver equipo');
    }
  } catch (error) {
    mostrarAlerta('danger', 'Error de conexión.');
  }
}

// ==========================================
// ADMINISTRACIÓN
// ==========================================

async function crearEquipo(e) {
  e.preventDefault();
  const nombre = document.getElementById('admin-nombre').value;
  const categoria = document.getElementById('admin-categoria').value;
  const estado = document.getElementById('admin-estado').value;

  try {
    const res = await fetch('/api/equipos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenActual}`
      },
      body: JSON.stringify({ nombre, categoria, estado })
    });
    const data = await res.json();
    logConsola('POST', '/api/equipos', res.status, data);

    if (res.ok) {
      mostrarAlerta('success', `Equipo '${nombre}' agregado con éxito.`);
      document.getElementById('form-crear-equipo').reset();
      cargarEquipos();
    } else {
      mostrarAlerta('danger', data.error || 'Error al crear equipo');
    }
  } catch (error) {
    mostrarAlerta('danger', 'Error al registrar equipo.');
  }
}

async function cargarTodosPrestamos() {
  if (!tokenActual || usuarioActual?.rol !== 'admin') return;

  try {
    const res = await fetch('/api/prestamos', {
      headers: { 'Authorization': `Bearer ${tokenActual}` }
    });
    const data = await res.json();

    const tbody = document.getElementById('todos-prestamos-tbody');
    if (!tbody) return;

    tbody.innerHTML = (data.prestamos || []).map((p) => `
      <tr class="${p.enMora ? 'table-danger' : ''}">
        <td>#${p.id}</td>
        <td>${p.usuario?.nombre || `User ${p.usuarioId}`}</td>
        <td>${p.equipo?.nombre || `Equipo ${p.equipoId}`}</td>
        <td>${new Date(p.fechaPrestamo).toLocaleDateString()}</td>
        <td>${new Date(p.fechaDevolucionEsperada).toLocaleDateString()}</td>
        <td>
          ${p.activo ? (p.enMora ? '<span class="badge bg-danger">Mora</span>' : '<span class="badge bg-success">Activo</span>') : '<span class="badge bg-secondary">Devuelto</span>'}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error al cargar todos los préstamos:', error);
  }
}

// ==========================================
// LABORATORIO DE PRUEBAS DE LAS 5 REGLAS
// ==========================================

// Escenario 1: Límite máximo 2 equipos
async function probarCasoLimite() {
  mostrarAlerta('info', 'Ejecutando prueba: Carlos intentará pedir más de 2 equipos...');
  await quickLogin('carlos@redtec.org', 'Usuario123!');

  // Carlos tiene 1 equipo prestado en seeds. Pidamos 1 para alcanzar el límite (2)
  const manana = new Date();
  manana.setDate(manana.getDate() + 3);
  const fechaStr = manana.toISOString().split('T')[0];

  // Pedir equipo 1 (Laptop Dell) para llegar a 2
  await fetch('/api/prestamos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenActual}` },
    body: JSON.stringify({ equipoId: 1, fechaDevolucionEsperada: fechaStr })
  });

  // Ahora pedir un 3.er equipo (equipo 2 - Lenovo). Debe fallar con HTTP 400!
  const resTercero = await fetch('/api/prestamos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenActual}` },
    body: JSON.stringify({ equipoId: 2, fechaDevolucionEsperada: fechaStr })
  });

  const dataTercero = await resTercero.json();
  logConsola('POST', '/api/prestamos (Tercer equipo)', resTercero.status, dataTercero);

  if (resTercero.status === 400) {
    mostrarAlerta('warning', `<strong>[PRUEBA SUPERADA]</strong> HTTP 400: ${dataTercero.error}`);
  } else {
    mostrarAlerta('info', `Resultado: HTTP ${resTercero.status}`);
  }
  cargarMisPrestamos();
  cargarEquipos();
}

// Escenario 2: Sanción automática por mora (403 Forbidden)
async function probarCasoMora() {
  mostrarAlerta('info', 'Ejecutando prueba: Lucia (con préstamo vencido) intentará pedir un equipo...');
  await quickLogin('lucia@redtec.org', 'Usuario123!');

  const manana = new Date();
  manana.setDate(manana.getDate() + 2);
  const fechaStr = manana.toISOString().split('T')[0];

  const res = await fetch('/api/prestamos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenActual}` },
    body: JSON.stringify({ equipoId: 1, fechaDevolucionEsperada: fechaStr })
  });

  const data = await res.json();
  logConsola('POST', '/api/prestamos (Usuario en Mora)', res.status, data);

  if (res.status === 403) {
    mostrarAlerta('danger', `<strong>[PRUEBA SUPERADA]</strong> HTTP 403 Forbidden: ${data.error}`);
  } else {
    mostrarAlerta('info', `Resultado: HTTP ${res.status}`);
  }
  cargarMisPrestamos();
}

// Escenario 3: Equipo no disponible (Prestado o En mantenimiento)
async function probarCasoNoDisponible() {
  mostrarAlerta('info', 'Ejecutando prueba: Solicitar equipo 6 (Taladro Bosch en Mantenimiento)...');
  await quickLogin('admin@redtec.org', 'Admin123!');

  const manana = new Date();
  manana.setDate(manana.getDate() + 2);
  const fechaStr = manana.toISOString().split('T')[0];

  const res = await fetch('/api/prestamos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenActual}` },
    body: JSON.stringify({ equipoId: 6, fechaDevolucionEsperada: fechaStr })
  });

  const data = await res.json();
  logConsola('POST', '/api/prestamos (Equipo en Mantenimiento)', res.status, data);

  if (res.status === 409 || res.status === 400) {
    mostrarAlerta('warning', `<strong>[PRUEBA SUPERADA]</strong> HTTP ${res.status}: ${data.error}`);
  } else {
    mostrarAlerta('info', `Resultado: HTTP ${res.status}`);
  }
}

// Escenario 4: RBAC - Usuario normal intenta acción de admin
async function probarCasoRBAC() {
  mostrarAlerta('info', 'Ejecutando prueba: Usuario Carlos intenta eliminar el equipo 1...');
  await quickLogin('carlos@redtec.org', 'Usuario123!');

  const res = await fetch('/api/equipos/1', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenActual}` }
  });

  const data = await res.json();
  logConsola('DELETE', '/api/equipos/1 (Usuario Común)', res.status, data);

  if (res.status === 403) {
    mostrarAlerta('danger', `<strong>[PRUEBA SUPERADA]</strong> HTTP 403 Forbidden: ${data.error}`);
  } else {
    mostrarAlerta('info', `Resultado: HTTP ${res.status}`);
  }
}

// Escenario 5: Operación Exitosa por Admin
async function probarCasoExitoso() {
  mostrarAlerta('info', 'Ejecutando prueba: Admin consulta inventario y auditoría completa...');
  await quickLogin('admin@redtec.org', 'Admin123!');

  const res = await fetch('/api/prestamos', {
    headers: { 'Authorization': `Bearer ${tokenActual}` }
  });

  const data = await res.json();
  logConsola('GET', '/api/prestamos (Admin)', res.status, data);

  if (res.status === 200) {
    mostrarAlerta('success', `<strong>[PRUEBA SUPERADA]</strong> HTTP 200 OK: Admin accedió con éxito a ${data.total} préstamos registrados.`);
  }
}
