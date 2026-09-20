// ---------------------------------------------------------------------------
// MOCK DATA — reemplazar/eliminar cuando conectes tus endpoints reales.
// Cada archivo en src/api/*.api.js importa desde acá; para pasar a producción
// alcanza con poner USE_MOCK = false en cada uno de esos archivos.
// ---------------------------------------------------------------------------

// Credenciales hardcodeadas para probar el rol admin inmediatamente.
export const ADMIN_CREDENTIALS = {
  email: 'admin@google.com',
  password: 'admin123*',
}

export const MOCK_LOGIN_RESPONSE_ADMIN = {
  id: 1,
  nombre: 'Admin',
  apellido: 'General',
  dni: '00000000',
  sexo: 'Masculino',
  email: 'admin@google.com',
  fechaNacimiento: '1990-01-01',
  club: 'Plaza Jewell',
  categoria: '1ra Categoría',
  categoriaSingle: '1ra Categoría',
  categoriaDobles: '3ra Categoría',
  nombreEquipo: 'General / Torres',
  torneo: 'Single y Dobles',
  enJuego: true,
  enJuegoDobles: true,
  activo: true,
  rol: 'admin',
  token: 'mock-token-admin',
}

export const MOCK_LOGIN_RESPONSE_USER = {
  id: 12,
  nombre: 'Juan',
  apellido: 'Pérez',
  dni: '34556789',
  sexo: 'Masculino',
  email: 'juan.perez@example.com',
  fechaNacimiento: '1998-04-12',
  club: 'Jockey Club',
  categoria: '4ta Categoría',
  categoriaSingle: '4ta Categoría',
  categoriaDobles: '2da Categoría',
  nombreEquipo: 'Pérez / Gómez',
  torneo: 'Single y Dobles',
  enJuego: true,
  enJuegoDobles: true,
  activo: true,
  rol: 'user',
  token: 'mock-token-user',
}

// Listado de jugadores/usuarios para el panel de administración.
export const MOCK_USUARIOS = [
  { ...MOCK_LOGIN_RESPONSE_ADMIN },
  { ...MOCK_LOGIN_RESPONSE_USER },
  { id: 13, nombre: 'Martín', apellido: 'Gómez', dni: '33998877', sexo: 'Masculino', email: 'martin.gomez@example.com', fechaNacimiento: '1996-08-02', club: 'Plaza Jewell', categoria: '3ra Categoría', categoriaSingle: '3ra Categoría', categoriaDobles: '2da Categoría', nombreEquipo: 'Pérez / Gómez', torneo: 'Single y Dobles', enJuego: true, enJuegoDobles: true, activo: true, rol: 'user' },
  { id: 14, nombre: 'Lucas', apellido: 'Ferreyra', dni: '35221144', sexo: 'Masculino', email: 'lucas.ferreyra@example.com', fechaNacimiento: '2001-11-20', club: 'Jockey Club', categoria: '4ta Categoría', categoriaSingle: '', categoriaDobles: '4ta Categoría', nombreEquipo: 'Ferreyra / Ríos', torneo: 'Dobles', enJuego: false, enJuegoDobles: false, activo: true, rol: 'user' },
  { id: 15, nombre: 'Nicolás', apellido: 'Duarte', dni: '32887766', sexo: 'Masculino', email: 'nicolas.duarte@example.com', fechaNacimiento: '1994-02-15', club: 'Plaza Jewell', categoria: '3ra Categoría', categoriaSingle: '3ra Categoría', categoriaDobles: '', nombreEquipo: '-', torneo: 'Single', enJuego: true, enJuegoDobles: false, activo: true, rol: 'user' },
  { id: 16, nombre: 'Agustín', apellido: 'Ríos', dni: '36445566', sexo: 'Masculino', email: 'agustin.rios@example.com', fechaNacimiento: '1999-06-30', club: 'Jockey Club', categoria: '5ta Categoría', categoriaSingle: '', categoriaDobles: '5ta Categoría', nombreEquipo: 'Ferreyra / Ríos', torneo: 'Dobles', enJuego: false, enJuegoDobles: false, activo: false, rol: 'user' },
  { id: 17, nombre: 'Camila', apellido: 'Suárez', dni: '31556644', sexo: 'Femenino', email: 'camila.suarez@example.com', fechaNacimiento: '2000-03-09', club: 'Plaza Jewell', categoria: '2da Categoría', categoriaSingle: '2da Categoría', categoriaDobles: '', nombreEquipo: '-', torneo: 'Single', enJuego: true, enJuegoDobles: false, activo: true, rol: 'user' },
]

// Equipos disponibles para el torneo de dobles (usado en selects de Admin: Fechas Dobles).
export const MOCK_EQUIPOS = [
  { id: 'eq-1', nombre: 'Pérez / Gómez' },
  { id: 'eq-2', nombre: 'Ferreyra / Ríos' },
  { id: 'eq-3', nombre: 'Duarte / Suárez' },
  { id: 'eq-4', nombre: 'Ibáñez / Cabrera' },
]

export const CLUBES = ['Plaza Jewell']
export const SEDES = ['Sede Norte', 'Sede Centro', 'Sede Sur']
export const CANCHAS = ['Cancha 1 - Polvo de ladrillo', 'Cancha 2 - Polvo de ladrillo', 'Cancha 3 - Cemento', 'Cancha 4 - Cemento']
export const ESTADOS_PARTIDO = ['Pendiente', 'Confirmado', 'Jugado', 'Suspendido']
export const RESULTADOS_PARTIDO = ['-', '6-4 / 6-3', '7-5 / 6-2', '4-6 / 6-4 / 7-5', 'W.O.']

// "Mis Fechas" del jugador logueado (rol user), separadas por torneo.
export const MOCK_MIS_FECHAS = {
  singles: [
    { id: 101, rival: 'Nicolás Duarte', fecha: '2026-09-03', hora: '18:30', torneo: 'Single', club: 'Club Atlético Vélez', sede: 'Sede Norte', cancha: 'Cancha 2 - Polvo de ladrillo', estado: 'Confirmado', resultado: '-' },
    { id: 102, rival: 'Camila Suárez', fecha: '2026-09-17', hora: '17:00', torneo: 'Single', club: 'MatchPoint Tenis Club', sede: 'Sede Centro', cancha: 'Cancha 1 - Polvo de ladrillo', estado: 'Pendiente', resultado: '-' },
    { id: 103, rival: 'Agustín Ríos', fecha: '2026-08-20', hora: '19:00', torneo: 'Single', club: 'MatchPoint Tenis Club', sede: 'Sede Sur', cancha: 'Cancha 3 - Cemento', estado: 'Jugado', resultado: '6-4 / 6-3' },
  ],
  dobles: [
    { id: 201, rival: 'Ferreyra / Ríos', fecha: '2026-09-10', hora: '20:00', torneo: 'Dobles', club: 'Lawn Tennis Club', sede: 'Sede Norte', cancha: 'Cancha 4 - Cemento', estado: 'Pendiente', resultado: '-' },
    { id: 202, rival: 'Duarte / Suárez', fecha: '2026-08-15', hora: '18:00', torneo: 'Dobles', club: 'Náutico Hacoaj', sede: 'Sede Centro', cancha: 'Cancha 2 - Polvo de ladrillo', estado: 'Jugado', resultado: '4-6 / 6-4 / 7-5' },
  ],
}

export const MOCK_STATS = [
  { label: 'Partidos jugados', value: 18 },
  { label: 'Partidos ganados', value: 13 },
  { label: 'Puntos', value: 940 },
]

export const MOCK_TABLA_POSICIONES = [
  { pos: 1, jugador: 'Admin General', club: 'MatchPoint TC', pj: 20, pg: 17, pp: 3, puntos: 1180 },
  { pos: 2, jugador: 'Juan Pérez', club: 'Club Atlético Vélez', pj: 18, pg: 13, pp: 5, puntos: 940 },
  { pos: 3, jugador: 'Martín Gómez', club: 'Náutico Hacoaj', pj: 19, pg: 12, pp: 7, puntos: 890 },
  { pos: 4, jugador: 'Lucas Ferreyra', club: 'Lawn Tennis Club', pj: 17, pg: 10, pp: 7, puntos: 760 },
  { pos: 5, jugador: 'Nicolás Duarte', club: 'Círculo de Tenis', pj: 16, pg: 9, pp: 7, puntos: 710 },
  { pos: 6, jugador: 'Agustín Ríos', club: 'MatchPoint TC', pj: 15, pg: 7, pp: 8, puntos: 605 },
]

// Partidos de Singles (vista de administración: TODOS los partidos del torneo).
export const MOCK_FECHAS_SINGLE = [
  { id: 'sg-1', jugador1: 'Juan Pérez', jugador2: 'Nicolás Duarte', fecha: '2026-09-03', hora: '18:30', club: 'Club Atlético Vélez', sede: 'Sede Norte', cancha: 'Cancha 2 - Polvo de ladrillo', estado: 'Confirmado', resultado: '-' },
  { id: 'sg-2', jugador1: 'Juan Pérez', jugador2: 'Camila Suárez', fecha: '2026-09-17', hora: '17:00', club: 'MatchPoint Tenis Club', sede: 'Sede Centro', cancha: 'Cancha 1 - Polvo de ladrillo', estado: 'Pendiente', resultado: '-' },
  { id: 'sg-3', jugador1: 'Juan Pérez', jugador2: 'Agustín Ríos', fecha: '2026-08-20', hora: '19:00', club: 'MatchPoint Tenis Club', sede: 'Sede Sur', cancha: 'Cancha 3 - Cemento', estado: 'Jugado', resultado: '6-4 / 6-3' },
  { id: 'sg-4', jugador1: 'Nicolás Duarte', jugador2: 'Camila Suárez', fecha: '2026-09-24', hora: '19:15', club: 'Círculo de Tenis', sede: 'Sede Centro', cancha: 'Cancha 3 - Cemento', estado: 'Por confirmar', resultado: '-' },
]

// Partidos de Dobles (vista de administración: TODOS los partidos del torneo).
export const MOCK_FECHAS_DOBLES = [
  { id: 'db-1', equipo1: 'Pérez / Gómez', equipo2: 'Ferreyra / Ríos', fecha: '2026-09-10', hora: '20:00', club: 'Lawn Tennis Club', sede: 'Sede Norte', cancha: 'Cancha 4 - Cemento', estado: 'Pendiente', resultado: '-' },
  { id: 'db-2', equipo1: 'Pérez / Gómez', equipo2: 'Duarte / Suárez', fecha: '2026-08-15', hora: '18:00', club: 'Náutico Hacoaj', sede: 'Sede Centro', cancha: 'Cancha 2 - Polvo de ladrillo', estado: 'Jugado', resultado: '4-6 / 6-4 / 7-5' },
  { id: 'db-3', equipo1: 'Ferreyra / Ríos', equipo2: 'Ibáñez / Cabrera', fecha: '2026-09-28', hora: '17:30', club: 'MatchPoint Tenis Club', sede: 'Sede Sur', cancha: 'Cancha 1 - Polvo de ladrillo', estado: 'Confirmado', resultado: '-' },
]
