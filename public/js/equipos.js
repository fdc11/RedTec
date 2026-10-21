/**
 * Controlador frontend para el catálogo de equipos (equipos.html).
 *
 * REGLAS DE SEGURIDAD Y ARQUITECTURA:
 * 1. Todos los datos de la API se renderizan EXCLUSIVAMENTE con textContent (NUNCA innerHTML para mitigar XSS).
 * 2. Token JWT leído desde sessionStorage y enviado en cabecera 'Authorization: Bearer <token>'.
 * 3. Si cualquier llamada a la API responde con código 401 Unauthorized, redirige automáticamente al login.
 * 4. Control de sesión con botón de cierre de sesión.
 */
document.addEventListener('DOMContentLoaded', () => {
  const token = sessionStorage.getItem('token');
  const usuarioRaw = sessionStorage.getItem('usuario');

  // Si no hay token en sessionStorage, redirigir al login
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  // Parseo seguro de los datos del usuario en sesión
  let usuario = null;
  try {
    usuario = JSON.parse(usuarioRaw);
  } catch (e) {
    sessionStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  // Elementos del DOM
  const navUserName = document.getElementById('nav-user-name');
  const navUserRole = document.getElementById('nav-user-role');
  const btnLogout = document.getElementById('btn-logout');
  const filtroEstado = document.getElementById('filtro-estado');
  const btnRefrescar = document.getElementById('btn-refrescar');
  const tablaBody = document.getElementById('tabla-body');
  const alertGlobal = document.getElementById('alert-global');

  // Elementos del Modal de Préstamo
  const modalElement = document.getElementById('modal-prestamo');
  const modalInstance = modalElement && window.bootstrap ? new window.bootstrap.Modal(modalElement) : null;
  const modalEquipoNombre = document.getElementById('modal-equipo-nombre');
  const modalEquipoCategoria = document.getElementById('modal-equipo-categoria');
  const modalEquipoId = document.getElementById('modal-equipo-id');
  const modalFechaDevolucion = document.getElementById('modal-fecha-devolucion');
  const formPrestamo = document.getElementById('form-solicitar-prestamo');
  const alertModal = document.getElementById('alert-modal');
  const btnConfirmarPrestamo = document.getElementById('btn-confirmar-prestamo');

  // Mostrar datos del usuario en la barra de navegación mediante textContent
  if (navUserName) navUserName.textContent = usuario.nombre || 'Usuario';
  if (navUserRole) {
    navUserRole.textContent = usuario.rol ? usuario.rol.toUpperCase() : 'USUARIO';
    if (usuario.rol === 'admin') {
      navUserRole.className = 'badge bg-primary';
    } else {
      navUserRole.className = 'badge bg-secondary';
    }
  }

  // Helper para mostrar alertas en el contenedor global sin usar innerHTML
  function mostrarAlertaGlobal(mensaje, tipo = 'danger') {
    while (alertGlobal.firstChild) {
      alertGlobal.removeChild(alertGlobal.firstChild);
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show small py-2 mb-3`;
    alertDiv.setAttribute('role', 'alert');

    const icon = document.createElement('i');
    icon.className = tipo === 'danger' ? 'bi bi-exclamation-triangle-fill me-2' : 'bi bi-check-circle-fill me-2';

    const textSpan = document.createElement('span');
    textSpan.textContent = mensaje;

    alertDiv.appendChild(icon);
    alertDiv.appendChild(textSpan);
    alertGlobal.appendChild(alertDiv);
  }

  // Helper para mostrar alertas en el modal sin usar innerHTML
  function mostrarAlertaModal(mensaje, tipo = 'danger') {
    while (alertModal.firstChild) {
      alertModal.removeChild(alertModal.firstChild);
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} small py-2 mb-3`;

    const icon = document.createElement('i');
    icon.className = tipo === 'danger' ? 'bi bi-exclamation-triangle-fill me-2' : 'bi bi-check-circle-fill me-2';

    const textSpan = document.createElement('span');
    textSpan.textContent = mensaje;

    alertDiv.appendChild(icon);
    alertDiv.appendChild(textSpan);
    alertModal.appendChild(alertDiv);
  }

  // Cerrar Sesión
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
    window.location.href = 'index.html';
  });

  // Consultar y renderizar equipos consumiendo GET /api/equipos
  async function cargarEquipos() {
    const estado = filtroEstado ? filtroEstado.value : 'Disponible';
    let url = '/api/equipos';
    if (estado) {
      url += `?estado=${encodeURIComponent(estado)}`;
    }

    // Vaciar tabla de manera segura
    while (tablaBody.firstChild) {
      tablaBody.removeChild(tablaBody.firstChild);
    }

    // Fila indicadora de carga
    const trCargando = document.createElement('tr');
    const tdCargando = document.createElement('td');
    tdCargando.setAttribute('colspan', '6');
    tdCargando.className = 'text-center py-4 text-muted small';
    tdCargando.textContent = 'Cargando inventario de equipos desde el servidor...';
    trCargando.appendChild(tdCargando);
    tablaBody.appendChild(trCargando);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // REGLA DURA: Si la API responde 401, redirige al login
      if (response.status === 401) {
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
      }

      const data = await response.json().catch(() => ({}));

      while (tablaBody.firstChild) {
        tablaBody.removeChild(tablaBody.firstChild);
      }

      if (!response.ok) {
        mostrarAlertaGlobal(data.error?.message || 'Error al obtener la lista de equipos.');
        return;
      }

      const equipos = data.data || [];

      if (equipos.length === 0) {
        const trVacio = document.createElement('tr');
        const tdVacio = document.createElement('td');
        tdVacio.setAttribute('colspan', '6');
        tdVacio.className = 'text-center py-4 text-muted small';
        tdVacio.textContent = 'No se encontraron equipos para el filtro seleccionado.';
        trVacio.appendChild(tdVacio);
        tablaBody.appendChild(trVacio);
        return;
      }

      // Renderizado seguro de cada fila usando EXCLUSIVAMENTE textContent (cero innerHTML)
      equipos.forEach((equipo) => {
        const tr = document.createElement('tr');

        // Columna ID
        const tdId = document.createElement('td');
        tdId.className = 'fw-bold text-secondary small';
        tdId.textContent = String(equipo.id);
        tr.appendChild(tdId);

        // Columna Nombre
        const tdNombre = document.createElement('td');
        const spanNombre = document.createElement('span');
        spanNombre.className = 'fw-semibold text-dark d-block';
        spanNombre.textContent = equipo.nombre;
        tdNombre.appendChild(spanNombre);
        tr.appendChild(tdNombre);

        // Columna Categoría
        const tdCategoria = document.createElement('td');
        const badgeCat = document.createElement('span');
        badgeCat.className = 'badge bg-light text-dark border small';
        badgeCat.textContent = equipo.categoria;
        tdCategoria.appendChild(badgeCat);
        tr.appendChild(tdCategoria);

        // Columna Descripción
        const tdDescripcion = document.createElement('td');
        tdDescripcion.className = 'small text-muted';
        tdDescripcion.textContent = equipo.descripcion || 'Sin descripción registrada.';
        tr.appendChild(tdDescripcion);

        // Columna Estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const badgeEstado = document.createElement('span');
        badgeEstado.className = 'badge px-2 py-1 small';

        if (equipo.estado === 'Disponible') {
          badgeEstado.classList.add('badge-estado-disponible');
        } else if (equipo.estado === 'Prestado') {
          badgeEstado.classList.add('badge-estado-prestado');
        } else {
          badgeEstado.classList.add('badge-estado-mantenimiento');
        }
        badgeEstado.textContent = equipo.estado;
        tdEstado.appendChild(badgeEstado);
        tr.appendChild(tdEstado);

        // Columna Acción
        const tdAccion = document.createElement('td');
        tdAccion.className = 'text-end pe-3';

        if (equipo.estado === 'Disponible') {
          const btnPrestar = document.createElement('button');
          btnPrestar.type = 'button';
          btnPrestar.className = 'btn btn-primary btn-sm';
          btnPrestar.textContent = 'Pedir Préstamo';

          // Asignar evento al hacer clic para abrir el modal
          btnPrestar.addEventListener('click', () => {
            abrirModalPrestamo(equipo);
          });
          tdAccion.appendChild(btnPrestar);
        } else {
          const spanNoDisponible = document.createElement('span');
          spanNoDisponible.className = 'text-muted small fst-italic';
          spanNoDisponible.textContent = 'No disponible';
          tdAccion.appendChild(spanNoDisponible);
        }

        tr.appendChild(tdAccion);
        tablaBody.appendChild(tr);
      });
    } catch (error) {
      console.error('Error al consultar catálogo de equipos:', error);
      while (tablaBody.firstChild) {
        tablaBody.removeChild(tablaBody.firstChild);
      }
      mostrarAlertaGlobal('Error de conexión con el servidor al cargar los equipos.');
    }
  }

  // Prepara y abre el modal para solicitar un préstamo
  function abrirModalPrestamo(equipo) {
    if (modalEquipoNombre) modalEquipoNombre.textContent = equipo.nombre;
    if (modalEquipoCategoria) modalEquipoCategoria.textContent = `Categoría: ${equipo.categoria} • ID #${equipo.id}`;
    if (modalEquipoId) modalEquipoId.value = equipo.id;

    // Calcular fecha por defecto: 7 días desde hoy
    const fechaDefecto = new Date();
    fechaDefecto.setDate(fechaDefecto.getDate() + 7);
    fechaDefecto.setMinutes(fechaDefecto.getMinutes() - fechaDefecto.getTimezoneOffset());
    const fechaString = fechaDefecto.toISOString().slice(0, 16);

    if (modalFechaDevolucion) {
      modalFechaDevolucion.value = fechaString;
      // Mínimo ahora
      const ahoraString = new Date().toISOString().slice(0, 16);
      modalFechaDevolucion.min = ahoraString;
    }

    while (alertModal.firstChild) {
      alertModal.removeChild(alertModal.firstChild);
    }

    if (modalInstance) {
      modalInstance.show();
    }
  }

  // Procesar solicitud de préstamo desde el modal (POST /api/prestamos)
  if (formPrestamo) {
    formPrestamo.addEventListener('submit', async (e) => {
      e.preventDefault();

      const equipoId = parseInt(modalEquipoId.value, 10);
      const fechaDevolucionValue = modalFechaDevolucion.value;

      if (!equipoId || !fechaDevolucionValue) {
        mostrarAlertaModal('Debe seleccionar una fecha de devolución válida.');
        return;
      }

      const fechaDevolucionEsperada = new Date(fechaDevolucionValue).toISOString();

      btnConfirmarPrestamo.disabled = true;
      const textoOriginal = btnConfirmarPrestamo.textContent;
      btnConfirmarPrestamo.textContent = 'Procesando...';

      try {
        const response = await fetch('/api/prestamos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            equipoId,
            fechaDevolucionEsperada
          })
        });

        // REGLA DURA: Redirección automática si expira o invalida el token
        if (response.status === 401) {
          sessionStorage.clear();
          window.location.href = 'index.html';
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const msg = data.error?.message || 'Error al procesar el préstamo.';
          mostrarAlertaModal(msg, 'danger');
          btnConfirmarPrestamo.disabled = false;
          btnConfirmarPrestamo.textContent = textoOriginal;
          return;
        }

        mostrarAlertaModal('¡Préstamo registrado exitosamente!', 'success');
        setTimeout(() => {
          if (modalInstance) modalInstance.hide();
          btnConfirmarPrestamo.disabled = false;
          btnConfirmarPrestamo.textContent = textoOriginal;
          mostrarAlertaGlobal('Préstamo concedido con éxito. El inventario ha sido actualizado.', 'success');
          cargarEquipos();
        }, 800);
      } catch (error) {
        console.error('Error al registrar préstamo:', error);
        mostrarAlertaModal('Error de conexión al tramitar el préstamo.');
        btnConfirmarPrestamo.disabled = false;
        btnConfirmarPrestamo.textContent = textoOriginal;
      }
    });
  }

  // Eventos de filtros y refresco
  if (filtroEstado) {
    filtroEstado.addEventListener('change', cargarEquipos);
  }
  if (btnRefrescar) {
    btnRefrescar.addEventListener('click', cargarEquipos);
  }

  // Carga inicial al entrar a la página
  cargarEquipos();
});
