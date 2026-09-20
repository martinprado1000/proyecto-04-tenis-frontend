import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

export function DropdownMenu({ trigger, children, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {trigger}
      </button>
      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-2 w-56 animate-fade-in rounded-lg border border-border bg-card p-1.5 shadow-soft',
            align === 'right' ? 'right-0' : 'left-0'
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ className, icon: Icon, ...props }) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {props.children}
    </button>
  )
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" />
}
