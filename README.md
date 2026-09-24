# MatchPoint TC — Dashboard de Tenis (React + Vite + Tailwind)

Interfaz completa de dashboard para un club/torneo de tenis, con estética
inspirada en shadcn/ui (modo oscuro por defecto), sistema de roles (`user` /
`admin`) transparente en el login, y toda la capa de datos mockeada y lista
para reemplazar por tu API real.

## 🚀 Instalación

```bash
npm install
npm run dev
npm run dev -- --host  #Para acceso desde cualquier host.
```

Se levanta en `http://localhost:5173`.

## 🔑 Probar la app

El login es un formulario tradicional de **email y contraseña** (sin ningún
selector visible de rol). Para probar el panel de administración:

- **Admin**: `admin@google.com` / `admin123*`
- **Usuario**: cualquier otro email/contraseña

El backend simulado devuelve el rol dentro del objeto de usuario
(`{ ..., rol: "admin" | "user" }`) y toda la app reacciona a eso.

## 🗂️ Estructura del proyecto

```
src/
├── api/
│   ├── client.js          # Instancia de Axios (baseURL, interceptores, token)
│   ├── auth.api.js         # POST /login (rol hardcodeado para admin@google.com), POST /registro
│   ├── perfil.api.js       # GET/PUT /perfil
│   ├── fechas.api.js       # GET /fechas (Mis Fechas del jugador: singles + dobles)
│   ├── resultados.api.js   # GET /resultados
│   ├── admin.api.js        # GET/POST/PUT /admin/usuarios (listar, crear, editar)
│   └── fechasAdmin.api.js  # /admin/fechas/single y /admin/fechas/dobles (listar, generar auto, crear, editar)
├── components/
│   ├── layout/              # Navbar, Sidebar, Layout, PageHeader
│   ├── ui/                   # Button, Card, Input, Table, Modal, Badge, Avatar, DropdownMenu
│   └── ProtectedRoute.jsx    # <ProtectedRoute> y <AdminRoute> (rutas por rol)
├── context/
│   ├── AuthContext.jsx      # Estado global de sesión + rol del usuario
│   └── ThemeContext.jsx     # Toggle de tema claro/oscuro
├── mock/
│   └── mockData.js          # Todos los datos de prueba, centralizados
└── pages/
    ├── Login.jsx
    ├── Perfil.jsx
    ├── MisFechas.jsx         # Tabs Singles / Dobles
    ├── Resultados.jsx
    └── admin/
        ├── AdminUsuarios.jsx # Listado + crear + editar (incluye cambio de rol)
        └── AdminFechas.jsx   # Tabs Single / Dobles, "Generar fechas automáticamente", crear/editar partido
```

## 🔌 Cómo conectar tu API real

1. Copiá `.env.example` a `.env` y poné la URL de tu backend:
   ```
   VITE_API_URL=https://tu-api.com/api
   ```
2. En cada archivo de `src/api/*.api.js` hay una constante `USE_MOCK = true`.
   Cambiala a `false` para que empiece a pegarle a tu API real vía Axios
   (la petición y el endpoint ya están escritos, comentados arriba de cada función).
3. El login real debe devolver un objeto de usuario con el campo `rol`
   (`"admin"` o `"user"`) — de eso depende toda la lógica de permisos de la
   app (`useAuth().isAdmin`). La lógica hardcodeada de `admin@google.com` es
   solo para desarrollo: al poner `USE_MOCK = false` en `auth.api.js` deja de usarse.
4. Si tu backend devuelve un token JWT, guardalo así en el login real:
   ```js
   window.sessionStorage.setItem('mp_token', data.token)
   ```
   El interceptor de `src/api/client.js` ya lo toma automáticamente y lo
   manda como `Authorization: Bearer <token>` en cada request.
5. Los `<select>` de jugadores/equipos en "Admin: Fechas" usan
   `getJugadoresDisponibles()` / `getEquiposDisponibles()` en `fechasAdmin.api.js`;
   apuntalos a tus endpoints reales de listado de jugadores/equipos.
6. Borrá `src/mock/mockData.js` cuando ya no lo necesites.

## 🎨 Tema / Diseño

- Paleta y radios definidos como variables CSS en `src/index.css` (`:root` = claro, `.dark` = oscuro).
- El oscuro es el tema por defecto (`<html class="dark">` en `index.html`).
- El toggle de tema está en la parte inferior del Sidebar y persiste en `localStorage`.

## 🛡️ Rutas protegidas

- `<ProtectedRoute>`: exige sesión iniciada, si no redirige a `/login`.
- `<AdminRoute>`: exige además `rol === 'admin'`; si no, redirige a `/resultados`
  (las rutas `/admin/usuarios` y `/admin/fechas`, y sus links en el sidebar,
  quedan completamente inaccesibles/ocultos para un usuario normal).

## 📝 Notas de implementación

- En "Torneo" (perfil de usuario y alta/edición de jugador) la opción **"Ambos (S)"**
  representa a un jugador anotado tanto en Single como en Dobles, tal como se
  pidió en el brief. Si tu backend usa otro valor/etiqueta para ese caso, alcanza
  con cambiar el `<option value="Ambos">` correspondiente en `AdminUsuarios.jsx`.
- "Mis Fechas" separa los partidos en dos pestañas (Singles / Dobles) porque un
  mismo jugador puede estar anotado en ambos torneos a la vez; en las tarjetas
  de Dobles, el campo "Rival" muestra el nombre del equipo rival.


###########################################################################################

## Documentacion con respecto al sistema completo, "tenis":

Este es un sistema de administracion de torneos de tenis. Donde los usuarios ven sus torneos, fechas, estadisticas, etc.
Contexto con respecto al sistema SaaS Multi-tenant. Este se encuentra en la carpeta PROYECTO-04-TENIS, donde dentro de esta esta la carpeta proyecto-04-tenis-frontend la cual esta el frontend del sistema hecho con react/vite. Y en la cartpeta proyecto-04-tenis-backend esta el el backend hecho con Nest.
Las url que comienzan con http://localhost:5173/SystemMP/ son para la administracion del SaaS Multi-tenant donde el usuario superadmin@gmail.com (superadmin) es el administrador del sistema completo. Desde http://localhost:5173/SystemMP/admin/organizaciones es desde donde se crean las organizaciones.
El usuario administrador (admin) de cada organizacion tiene acceso a las url de la organizacion a la cual pertenece, que empiezan con: http://localhost:5173/"organizacion"/admin/ que seria para administrar los torneos, fechas, equipos, usuarios, gestion-cuotas, etc, de dicha organizacion. Importante: /"organizacion"/ es la variable de la organizacion a la que pertenece el usuario.

Resumen:
- proyecto-04-tenis-frontend: React + Vite.
- proyecto-04-tenis-backend: NestJS.

### Tipos de acceso:

#### Superadministrador
Rutas bajo: 
http://localhost:5173/SystemMP/
El superadmin administra todo el sistema, por ejemplo:
- Crear y administrar organizaciones.
- Gestionar la configuración general del SaaS.
- Administrar los tenants.

#### Usuarios de una organización
Las rutas utilizan dinámicamente dependiendo del  nombre de la organización:
http://localhost:5173/{organizacion} (No requiere autenticacion, muestra resumenen de los torneos actuales)
http://localhost:5173/{organizacion}/perfil
http://localhost:5173/{organizacion}/mis-fechas
http://localhost:5173/{organizacion}/resultados
http://localhost:5173/{organizacion}/estadisticas
http://localhost:5173/{organizacion}/analisis-deportivo
Desde allí, los usuarios pueden:
- Ver sus próximas fechas de juego.
- Consultar torneos en los que participan.
- Ver resultados.
- Participar en modalidades individuales o dobles.

#### Administradores de una organización
Los administradores acceden a:
http://localhost:5173/{organizacion}/admin/
Desde esas rutas pueden administrar únicamente su organización, las rutas utilizadas son:
http://localhost:5173/"nombre-de-la-organizacion"/admin/usuarios
http://localhost:5173/"nombre-de-la-organizacion"/admin/fechas
http://localhost:5173/"nombre-de-la-organizacion"/admin/torneos
http://localhost:5173/"nombre-de-la-organizacion"/admin/importar-usuarios
http://localhost:5173/"nombre-de-la-organizacion"/admin/analisis-deportivo
http://localhost:5173/"nombre-de-la-organizacion"/admin/gestion-cuotas

La parte importante es que {organizacion} identifica el tenant actual, y los permisos determinan si el usuario puede acceder al panel general de la organización, al panel administrativo de su organización o al panel global de superadministrador.
