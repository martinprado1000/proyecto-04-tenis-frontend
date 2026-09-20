import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const Input = forwardRef(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive/50',
        className
      )}
      aria-invalid={Boolean(error)}
      {...props}
    />
  )
})

export function Label({ className, ...props }) {
  return (
    <label className={cn('mb-1.5 block text-xs font-medium text-muted-foreground', className)} {...props} />
  )
}

export const Select = forwardRef(function Select({ className, error, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        error && 'border-destructive focus-visible:ring-destructive/50',
        className
      )}
      aria-invalid={Boolean(error)}
      {...props}
    >
      {children}
    </select>
  )
})
