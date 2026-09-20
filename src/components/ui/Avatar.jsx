import { cn } from '../../lib/utils'

export function Avatar({ nombre = '', apellido = '', className }) {
  const iniciales = `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase()
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground',
        className
      )}
    >
      {iniciales || '?'}
    </div>
  )
}
