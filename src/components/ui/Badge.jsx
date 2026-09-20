import { cn } from '../../lib/utils'

const VARIANTS = {
  default: 'bg-primary/15 text-primary border-primary/20',
  secondary: 'bg-secondary text-secondary-foreground border-border',
  outline: 'bg-transparent text-foreground border-border',
  success: 'bg-primary/15 text-primary border-primary/20',
  warning: 'bg-ball/15 text-ball border-ball/30',
  masculino: 'bg-blue-700/15 text-blue-700 border-blue-700/30',
  femenino: 'bg-emerald-700/15 text-emerald-700 border-emerald-700/30',
  admin: 'bg-court text-court-foreground border-transparent',
  destructive: 'bg-destructive/15 text-destructive border-destructive/30',
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  )
}
