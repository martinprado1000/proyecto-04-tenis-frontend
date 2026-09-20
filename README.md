# MatchPoint TC — Dashboard de Tenis (React + Vite + Tailwind)

Interfaz completa de dashboard para un club/torneo de tenis, con estética
inspirada en shadcn/ui (modo oscuro por defecto), sistema de roles (`user` /
`admin`) transparente en el login, y toda la capa de datos mockeada y lista
para reemplazar por tu API real.

## 🚀 Instalación

```bash
npm install
npm run dev
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
