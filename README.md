# RedTec API REST — Sistema de Gestión de Inventario y Préstamos

API REST robusta, segura y escalable desarrollada para **RedTec**, una plataforma comunitaria para el control de inventario y préstamo de equipamiento tecnológico (audiovisuales, herramientas y laptops). Diseñada con enfoque de defensa académica oral, priorizando legibilidad, separación de responsabilidades y cumplimiento estricto de reglas de negocio en la capa de persistencia y servicios.

---

## 1. Requisitos del Sistema

* **Node.js**: v20 LTS o superior.
* **MySQL** o **MariaDB**: v8.0 / v10.4 o superior con InnoDB (soporte para transacciones ACID y bloqueos pesimistas de fila).
* **NPM**: v10 o superior.

---

## 2. Tecnologías y Dependencias Oficiales

* **Runtime & Framework**: Node.js 20 LTS, Express 4.
* **ORM & Base de Datos**: Sequelize 6 + `mysql2` + `sequelize-cli`.
* **Autenticación & Criptografía**: `jsonwebtoken` (JWT HS256), `bcryptjs`.
* **Seguridad Defensiva**: `helmet` (CSP estricta sin scripts inline), `cors` (lista blanca), `express-rate-limit` (mitigación de fuerza bruta), `express-validator` (desinfección y tipado estricto).
* **Configuración & Desarrollo**: `dotenv`, `nodemon` (desarrollo).

---

## 3. Variables de Entorno (`.env`)

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
# Servidor HTTP
PORT=3000
NODE_ENV=development

# Base de Datos MySQL (InnoDB)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=redtec_db
DB_USER=root
DB_PASSWORD=root

# Seguridad y Autenticación JWT
JWT_SECRET=super_secret_jwt_key_redtec_2026_academico
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=10

# Reglas de Negocio
MAX_DIAS_PRESTAMO=30

# CORS (Orígenes autorizados separados por coma)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Credenciales del Administrador para el Seeder Inicial
ADMIN_EMAIL=admin@redtec.org
ADMIN_PASSWORD=Admin123!
```

> **Regla dura de arranque**: El servidor se detiene automáticamente en el arranque (`process.exit(1)`) si faltan variables críticas como `JWT_SECRET` o credenciales de la base de datos, impidiendo ejecuciones inseguras con claves predeterminadas.

---

## 4. Instalación y Comandos Exactos

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Ejecutar migraciones de estructura
Aplica la creación de las tablas `Usuarios`, `Equipos`, `Prestamos` y el índice compuesto `(usuarioId, fechaDevolucionReal)`:
```bash
npm run db:migrate
```

### Paso 3: Cargar datos iniciales (Seeders)
Puebla los usuarios de prueba, 8 equipos de catálogo con descripciones y préstamos en diferentes estados:
```bash
npm run db:seed
```

*(Opcional) Reinicio completo de base de datos:*
```bash
npm run db:reset
```

### Paso 4: Iniciar la API
* Modo desarrollo (con recarga automática):
  ```bash
  npm run dev
  ```
* Modo producción:
  ```bash
  npm start
  ```

### Paso 5: Ejecutar suite de pruebas de aceptación
```bash
npm test
```

---

## 5. Usuarios de Prueba para la Defensa Oral

El seeder incluye cuentas estratégicamente preparadas para demostrar cada regla de negocio en tiempo real durante la sustentación:

| Usuario | Correo Electrónico | Contraseña | Rol | Caso de Uso en la Defensa |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador** | `admin@redtec.org` *(o ADMIN_EMAIL en .env)* | `Admin123!` | `admin` | Gestión de inventario (CRUD de equipos), auditoría global de préstamos. |
| **Carlos Gómez** | `carlos@redtec.org` | `Usuario123!` | `usuario` | **Usuario limpio**: Sin mora y con cupo disponible (0 préstamos activos). Puede solicitar préstamos con éxito. |
| **Lucía Silva** | `lucia@redtec.org` | `Usuario123!` | `usuario` | **Usuario en mora**: Posee un préstamo cuya fecha esperada venció hace 5 días. Cualquier solicitud es rechazada con **403 Forbidden**. |
| **Marcos Peña** | `marcos@redtec.org` | `Usuario123!` | `usuario` | **Usuario con cupo lleno**: Posee 2 préstamos activos. Cualquier intento de solicitar un 3.er préstamo es rechazado con **409 Conflict**. |

---

## 6. Catálogo de Endpoints

Todas las respuestas exitosas siguen el estándar `{ ok: true, data: ... }` y los errores `{ ok: false, error: { message: '...', details?: [...] } }`.

### Autenticación (`/api/auth`)
* `POST /api/auth/register` — Registro de usuarios. El rol siempre es forzado a `usuario`. Rate limit activo.
* `POST /api/auth/login` — Autenticación con mensaje genérico contra enumeración. Devuelve token JWT. Rate limit activo.
* `GET /api/auth/me` — Perfil del usuario autenticado (requiere token).

### Equipos (`/api/equipos`)
* `GET /api/equipos` — Listado de equipos (autenticado, filtros opcionales `?estado=Disponible` y `?categoria=Laptops`).
* `GET /api/equipos/:id` — Detalle de un equipo específico.
* `POST /api/equipos` — *(Solo Admin)* Alta de nuevo equipo. Prohibido asignar estado `Prestado` manualmente.
* `PUT /api/equipos/:id` — *(Solo Admin)* Modificación de equipo. Bloquea cambios si tiene préstamo activo.
* `DELETE /api/equipos/:id` — *(Solo Admin)* Eliminación. Devuelve **409 Conflict** si tiene un préstamo activo o historial protegido por `RESTRICT`.

### Préstamos (`/api/prestamos`)
* `POST /api/prestamos` — Solicitud de préstamo. Aplica la cadena de middlewares en orden exacto:
  1. `verificarToken` (JWT HS256).
  2. `validarPrestamo` (`express-validator`: IDs enteros positivos, fecha futura, máximo `MAX_DIAS_PRESTAMO`).
  3. `verificarMora` (`Prestamo.count` con `Op.lt` ahora -> **403 Forbidden**).
  4. `verificarLimite` (máx 2 activos para rol usuario -> **409 Conflict**).
  5. Transacción ACID con bloqueo `t.LOCK.UPDATE` en fila de Usuario y Equipo + revalidación de cupo.
* `PUT /api/prestamos/:id/devolver` — Devolución de equipo (transacción). Si ya estaba devuelto -> **409 Conflict**.
* `GET /api/prestamos` — Listado de préstamos (el administrador ve todos; el usuario común ve solo los suyos).

---

## 7. Interfaz Frontend (`public/`)

Servida estáticamente desde Express (`express.static`) bajo estricto cumplimiento de CSP (sin scripts inline):
* **`index.html`** (`/index.html`): Formulario de inicio de sesión con selector rápido de usuarios de prueba. Almacena el token en `sessionStorage` y redirige a `equipos.html`.
* **`equipos.html`** (`/equipos.html`): Tabla interactiva de equipos disponibles (`GET /api/equipos?estado=Disponible`). Renderizado 100% mediante `textContent` (prevención de vulnerabilidades XSS). Cuenta con botón de cierre de sesión y redirección automática al login si la API responde `401 Unauthorized`.

---

## 8. Colección Postman (`docs/`)

En el directorio `docs/` se encuentra la colección oficial [`RedTec.postman_collection.json`](file:///c:/Users/Alumno/Desktop/RedTec/docs/RedTec.postman_collection.json) lista para importar en Postman.
Contiene:
* Flujos de éxito con auto-guardado de tokens en variables de colección.
* Casos de prueba para los 7 criterios de aceptación.
* Casos de prueba para token ausente/inválido (401) y fallos de validación (400).

---

## 9. Decisiones Técnicas Clave para la Sustentación Oral

1. **¿Por qué bloqueo pesimista `t.LOCK.UPDATE` y revalidación dentro de la transacción?**
   Evita condiciones de carrera (*race conditions*). Si un usuario envía dos peticiones HTTP simultáneas para prestar equipos, o dos usuarios intentan apartar el mismo equipo a la misma milésima de segundo, la base de datos serializa el acceso a las filas evitando que se sobrepase el límite de 2 equipos o que un equipo sea prestado dos veces.
2. **¿Por qué `defaultScope` para ocultar la contraseña?**
   Garantiza que ningún endpoint ni consulta relacional exponga accidentalmente el hash de la contraseña en los JSON devueltos al cliente. El hash solo se consulta explícitamente en el login mediante el scope `withPassword`.
3. **¿Por qué índice compuesto en `(usuarioId, fechaDevolucionReal)`?**
   Las dos reglas de negocio más críticas (`verificarMora` y `verificarLimite`) consultan frecuentemente `WHERE usuarioId = ? AND fechaDevolucionReal IS NULL`. El índice compuesto permite a MySQL resolver la consulta en tiempo logarítmico O(log N) sin realizar escaneos completos de tabla.
4. **¿Por qué las restricciones de clave foránea usan `RESTRICT`?**
   Garantiza la trazabilidad e integridad histórica del centro comunitario, impidiendo la eliminación accidental de un usuario o equipo que mantenga préstamos registrados.
5. **¿Por qué renderizado exclusivo con `textContent` en el Frontend?**
   Elimina vectores de ataque de inyección de código (Cross-Site Scripting o XSS), asegurando que cualquier dato proveniente de la API se trate como texto literal en el DOM y nunca como HTML ejecutable.
