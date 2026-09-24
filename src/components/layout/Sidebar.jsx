import { SidebarNav } from './SidebarNav'
import { cn } from '../../lib/utils'

export function Sidebar({ collapsed }) {
  return (
    <aside
      className={cn(
        'hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-border bg-background transition-all duration-200 md:flex',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      <SidebarNav collapsed={collapsed} />
    </aside>
  )
}
