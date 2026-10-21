/**
 * Controlador frontend para la pantalla de inicio de sesión (index.html).
 * Cumple estrictamente con la Content Security Policy (sin scripts ni eventos inline).
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  const inputEmail = document.getElementById('input-email');
  const inputPassword = document.getElementById('input-password');
  const alertContainer = document.getElementById('alert-container');
  const btnSubmit = document.getElementById('btn-submit');
  const demoButtons = document.querySelectorAll('.btn-demo-user');

  // Si ya existe una sesión activa con token, redirigir al catálogo de equipos
  if (sessionStorage.getItem('token')) {
    window.location.href = 'equipos.html';
    return;
  }

  // Helper seguro para mostrar alertas sin usar innerHTML (prevención XSS)
  function mostrarAlerta(mensaje, tipo = 'danger') {
    while (alertContainer.firstChild) {
      alertContainer.removeChild(alertContainer.firstChild);
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show small py-2`;
    alertDiv.setAttribute('role', 'alert');

    const icon = document.createElement('i');
    icon.className = tipo === 'danger' ? 'bi bi-exclamation-triangle-fill me-2' : 'bi bi-check-circle-fill me-2';

    const textSpan = document.createElement('span');
    textSpan.textContent = mensaje;

    alertDiv.appendChild(icon);
    alertDiv.appendChild(textSpan);
    alertContainer.appendChild(alertDiv);
  }

  // Asignar listeners a los botones de prueba de las cuentas del seeder
  demoButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      const password = btn.getAttribute('data-password');
      if (email && password) {
        inputEmail.value = email;
        inputPassword.value = password;
        inputEmail.focus();
      }
    });
  });

  // Envío del formulario de autenticación
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = inputEmail.value.trim();
    const password = inputPassword.value;

    if (!email || !password) {
      mostrarAlerta('Por favor, complete tanto el correo como la contraseña.');
      return;
    }

    btnSubmit.disabled = true;
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.textContent = 'Verificando credenciales...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.error?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
        mostrarAlerta(errorMsg, 'danger');
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
        return;
      }

      // Guardar el token JWT y los datos de perfil en sessionStorage
      sessionStorage.setItem('token', data.data.token);
      sessionStorage.setItem('usuario', JSON.stringify(data.data.usuario));

      mostrarAlerta('Inicio de sesión exitoso. Redirigiendo...', 'success');

      setTimeout(() => {
        window.location.href = 'equipos.html';
      }, 500);
    } catch (error) {
      console.error('Error de red al conectar con el servidor:', error);
      mostrarAlerta('No se pudo conectar con el servidor RedTec. Verifique su conexión.', 'danger');
      btnSubmit.disabled = false;
      btnSubmit.textContent = textoOriginal;
    }
  });
});
