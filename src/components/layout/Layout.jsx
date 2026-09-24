import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { MobileNavDrawer } from './MobileNavDrawer'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <MobileNavDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex">
        <Sidebar collapsed={collapsed} />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
