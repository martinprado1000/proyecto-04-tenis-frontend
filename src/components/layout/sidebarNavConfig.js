import {
  LayoutDashboard,
  User,
  CalendarDays,
  Trophy,
  ShieldCheck,
  CalendarClock,
  Users,
  BarChart3,
  Activity,
  CircleDollarSign,
} from 'lucide-react'

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/perfil', label: 'Mi Perfil', icon: User },
  { to: '/mis-fechas', label: 'Mis Fechas', icon: CalendarDays },
  { to: '/resultados', label: 'Tabla de Resultados', icon: Trophy },
  { to: '/estadisticas', label: 'Mis Estadísticas torneos', icon: BarChart3 },
  { to: '/analisis-deportivo', label: 'Mi análisis deportivo', icon: Activity },
]

export const ADMIN_ITEMS = [
  { to: '/admin/usuarios', label: 'Admin: Usuarios', icon: ShieldCheck },
  { to: '/admin/gestion_cuotas', label: 'Admin: Gestión Cuotas', icon: CircleDollarSign },
]

export const ADMIN_ITEMS_TORNEOS = [
  { to: '/admin/equipos', label: 'Admin: Equipos', icon: Users },
  { to: '/admin/torneos', label: 'Admin: Torneos', icon: Trophy },
  { to: '/admin/fechas', label: 'Admin: Fechas', icon: CalendarClock },
]
