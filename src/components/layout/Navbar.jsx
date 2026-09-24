import { useNavigate } from 'react-router-dom'
import { PanelLeft, Menu, User, LogOut, LogIn } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../hooks/useTenant'
import { Avatar } from '../ui/Avatar'
import { DropdownMenu, DropdownItem, DropdownSeparator } from '../ui/DropdownMenu'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { OrganizationBrand } from './Brand'
import { useBranding } from '../../context/BrandingContext'
import { cn } from '../../lib/utils'

export function Navbar({ onToggleSidebar, onToggleMobileMenu, mobileMenuOpen }) {
  const { user, logout, isAdmin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { tenantPath, loginPath, isSystem } = useTenant()
  const { branding } = useBranding()

  const organization = isSystem
    ? branding
    : { name: user?.organizationName || user?.organizationSlug, logoUrl: user?.organizationLogoUrl }

  const handleLogout = () => {
    logout()
    const target = loginPath() || (isSystem ? '/SystemMP/login' : user?.organizationSlug ? `/${user.organizationSlug}/login` : '/')
    navigate(target, { replace: true })
  }

  const loginTo = loginPath()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className={cn(
            'rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden',
            mobileMenuOpen && 'bg-accent text-foreground'
          )}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex"
          aria-label="Colapsar menú lateral"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 md:flex-none">
          <OrganizationBrand organization={organization} compact showNameOnMobile />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {isAuthenticated ? (
          <>
            {isAdmin && <Badge variant="admin" className="hidden sm:inline-flex">Administrador</Badge>}
            <DropdownMenu
              trigger={
                <button type="button" className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent md:gap-0 md:p-0">
                  <span className="max-w-[7rem] truncate text-sm font-medium sm:max-w-[10rem] md:hidden">
                    {user?.nombre} {user?.apellido}
                  </span>
                  <Avatar nombre={user?.nombre} apellido={user?.apellido} />
                </button>
              }
            >
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-medium">{user?.nombre} {user?.apellido}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownSeparator />
              <DropdownItem icon={User} onClick={() => navigate(tenantPath('/perfil'))}>
                Editar Datos Personales
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={LogOut} onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                Cerrar Sesión
              </DropdownItem>
            </DropdownMenu>
          </>
        ) : (
          loginTo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              aria-label="Iniciar sesión"
              onClick={() => navigate(loginTo)}
            >
              <LogIn className="h-4 w-4 shrink-0" />
              <span className="hidden min-[400px]:inline">Iniciar sesión</span>
            </Button>
          )
        )}
      </div>
    </header>
  )
}
