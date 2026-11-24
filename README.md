# Plataforma de exámenes · Acme School

Aplicación web hecha con **HTML, CSS y JavaScript puro (Web Components)** para que la escuela Acme gestione usuarios y exámenes, y para que sus estudiantes presenten los exámenes desde la web.

> Proyecto del skill de JavaScript. Toda la información se guarda en el navegador con `localStorage` en formato JSON.

## Estado del proyecto

| Fase | Contenido | Estado |
| --- | --- | --- |
| 1 | Estructura, sistema de diseño, persistencia, login y gestión de usuarios | ✅ Terminada |
| 2 | Gestión de exámenes, preguntas y respuestas | ⏳ Pendiente |
| 3 | Módulo público de resolución con reloj y resultados | ⏳ Pendiente |

## Cómo ejecutarlo

La aplicación usa módulos de JavaScript (`type="module"`) y la Web Crypto API, por eso **debe abrirse desde un servidor local** (no con doble clic sobre el archivo):

1. Abre la carpeta del proyecto en Visual Studio Code.
2. Instala la extensión **Live Server**.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

También sirve cualquier otro servidor estático, por ejemplo:

```bash
npx serve .
```

### Cuenta inicial

La primera vez que se abre la aplicación se crea automáticamente un administrador:

| Correo | Contraseña |
| --- | --- |
| `admin@acmeschool.edu` | `Admin1234` |

Desde el módulo de usuarios se pueden crear más cuentas (administrativos o docentes).

## Módulos

### Login
Vista inicial de los módulos privados. Valida correo y contraseña contra los usuarios registrados. Si alguien intenta entrar a una ruta privada sin sesión, se le envía al login y, al ingresar, vuelve a la ruta que pidió.

### Gestión de usuarios (privado)
- Tabla con los usuarios registrados y buscador por nombre, email o identificación.
- Formulario único para crear y actualizar.
- Botones para editar y eliminar cada registro (la eliminación pide confirmación).
- Validaciones: identificación numérica y única, email válido y único, teléfono, cargo (Administrativo o Docente) y contraseña de mínimo 8 caracteres con letras y números.
- No se puede eliminar la cuenta con la que se inició sesión.

## Estructura del proyecto

```
├── index.html                 # Contenedor de la SPA
├── assets/                    # Favicon
├── css/
│   ├── variables.css          # Tokens de diseño (colores, tipografía, espaciado, movimiento)
│   ├── base.css               # Reset, tipografía y utilidades
│   ├── components.css         # Botones, formularios, tablas, toasts, modal, navbar
│   └── views.css              # Estilos de cada vista
└── js/
    ├── main.js                # Punto de entrada
    ├── router.js              # Router por hash con rutas privadas
    ├── data/
    │   ├── storage.js         # Lectura/escritura JSON en localStorage
    │   └── seed.js            # Usuario administrador inicial
    ├── services/
    │   ├── auth.service.js    # Login, logout y sesión
    │   └── users.service.js   # CRUD de usuarios
    ├── utils/                 # Validaciones, cifrado, helpers de DOM e íconos
    ├── components/            # Web Components reutilizables
    │   ├── app-navbar.js
    │   ├── app-toast.js
    │   ├── app-confirm.js
    │   ├── user-form.js
    │   └── user-table.js
    └── views/                 # Web Components que representan cada pantalla
        ├── login-view.js
        └── users-view.js
```

## Estructura de datos (localStorage)

Cada colección se guarda como JSON con el prefijo `acme:`.

`acme:users`

```json
[
  {
    "id": "3f1c…",
    "identificacion": "1000000001",
    "nombre": "Administrador Acme",
    "email": "admin@acmeschool.edu",
    "telefono": "3001234567",
    "cargo": "Administrativo",
    "salt": "9a7e…",
    "passwordHash": "c41d…",
    "createdAt": "2026-11-23T22:00:00.000Z",
    "updatedAt": "2026-11-23T22:00:00.000Z"
  }
]
```

`acme:session`

```json
{ "userId": "3f1c…", "startedAt": "2026-11-23T22:05:00.000Z" }
```

Las contraseñas no se guardan en texto plano: se guarda un hash SHA-256 con una sal aleatoria por usuario.

## Decisiones técnicas

- **Web Components** (`customElements.define`) para cada pieza de la interfaz: navbar, notificaciones, diálogo de confirmación, formulario, tabla y vistas.
- **Comunicación por eventos** (`CustomEvent`): el formulario y la tabla no se conocen entre sí; la vista los coordina.
- **Router por hash** (`#/login`, `#/usuarios`) con rutas protegidas.
- **Accesibilidad**: HTML semántico, etiquetas en todos los campos, mensajes de error asociados con `aria-describedby`, foco visible, navegación por teclado, regiones `aria-live` y respeto de `prefers-reduced-motion`.
- **Responsive**: diseño mobile-first; en pantallas pequeñas la tabla se convierte en tarjetas y el menú se colapsa.
- **Seguridad básica**: todo texto ingresado por el usuario se escapa antes de mostrarse en pantalla.

## Identidad visual

- Primario: índigo `#4338ca` / `#3730a3`
- Acento: ámbar `#f59e0b`
- Tipografía: Plus Jakarta Sans
- Transiciones suaves de entrada en vistas, filas, notificaciones y diálogos.
