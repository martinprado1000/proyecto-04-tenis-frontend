import { NavLink } from 'react-router-dom'
import { Users, Sun, Moon, Activity } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTenant } from '../../hooks/useTenant'
import { cn } from '../../lib/utils'
import { NAV_ITEMS, ADMIN_ITEMS, ADMIN_ITEMS_TORNEOS } from './sidebarNavConfig'

export function SidebarNav({ collapsed = false, onNavigate }) {
  const { user, isAdmin, isSuperadmin } = useAuth()
  const { tenantPath } = useTenant()
  const { theme, toggleTheme } = useTheme()
  const isClient = user?.isClient === true || user?.isClient === 'true'

  const linkProps = (to) => ({
    to,
    onClick: onNavigate,
  })

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {NAV_ITEMS.filter((item) => item.to !== '/analisis-deportivo' || isClient).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            {...linkProps(tenantPath(to))}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {isAdmin && (
          <div className="pt-5">
            <div className={cn('mb-2 h-px bg-border', collapsed && 'mx-1')} />
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-court">
                Administración
              </p>
            )}
            <div className="space-y-1">
              {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  {...linkProps(tenantPath(to))}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'border-transparent bg-court text-court-foreground'
                        : 'border-court/40 bg-court/10 text-court hover:bg-court/20 dark:border-court/55 dark:bg-court/35 dark:text-foreground/85 dark:hover:bg-court/50'
                    )
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="pt-5">
            <div className={cn('mb-2 h-px bg-border', collapsed && 'mx-1')} />
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-court">
                Torneos
              </p>
            )}
            <div className="space-y-1">
              {ADMIN_ITEMS_TORNEOS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  {...linkProps(tenantPath(to))}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive
                        ? 'border-transparent bg-court text-court-foreground'
                        : 'border-court/40 bg-court/10 text-court hover:bg-court/20 dark:border-court/55 dark:bg-court/35 dark:text-foreground/85 dark:hover:bg-court/50'
                    )
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="pt-5">
            <div className={cn('mb-2 h-px bg-border', collapsed && 'mx-5')} />
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-court">
                Entrenamientos
              </p>
            )}
            <NavLink
              {...linkProps(tenantPath('/admin/analisis-deportivo'))}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-transparent bg-court text-court-foreground'
                    : 'border-court/40 bg-court/10 text-court hover:bg-court/20 dark:border-court/55 dark:bg-court/35 dark:text-foreground/85 dark:hover:bg-court/50'
                )
              }
              title={!collapsed ? 'Admin: Analisis-deportivo' : undefined}
            >
              <Activity className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">Análisis deportivo</span>}
            </NavLink>
          </div>
        )}

        {isSuperadmin && (
          <div className="pt-5">
            <div className={cn('mb-2 h-px bg-border', collapsed && 'mx-5')} />
            {!collapsed && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-court">
                Configuración de sistema
              </p>
            )}
            <NavLink
              {...linkProps('/SystemMP/admin/organizaciones')}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-transparent bg-court text-court-foreground'
                    : 'border-court/40 bg-court/10 text-court hover:bg-court/20 dark:border-court/55 dark:bg-court/35 dark:text-foreground/85 dark:hover:bg-court/50'
                )
              }
              title={!collapsed ? 'Admin: Organizaciones' : undefined}
            >
              <Users className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">Admin: Organizaciones</span>}
            </NavLink>
          </div>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px] shrink-0" /> : <Moon className="h-[18px] w-[18px] shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>
      </div>
    </>
  )
}
