import { useNavigate } from 'react-router-dom'
import { PanelLeft, User, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../hooks/useTenant'
import { Avatar } from '../ui/Avatar'
import { DropdownMenu, DropdownItem, DropdownSeparator } from '../ui/DropdownMenu'
import { Badge } from '../ui/Badge'
import { OrganizationBrand } from './Brand'
import { useBranding } from '../../context/BrandingContext'

export function Navbar({ onToggleSidebar }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { tenantPath, loginPath, isSystem } = useTenant()
  const { branding } = useBranding()

  const handleLogout = () => {
    logout()
    const target = loginPath() || (isSystem ? '/SystemMP/login' : user?.organizationSlug ? `/${user.organizationSlug}/login` : '/')
    navigate(target, { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Colapsar menú lateral"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        <OrganizationBrand organization={isSystem ? branding : { name: user?.organizationName || user?.organizationSlug, logoUrl: user?.organizationLogoUrl }} compact />
      </div>

      <div className="flex items-center gap-3">
        {isAdmin && <Badge variant="admin" className="hidden sm:inline-flex">Administrador</Badge>}
        <DropdownMenu
          trigger={<Avatar nombre={user?.nombre} apellido={user?.apellido} />}
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
      </div>
    </header>
  )
}
