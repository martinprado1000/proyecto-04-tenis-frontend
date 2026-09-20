/**
 * Combina clases condicionalmente (equivalente simplificado a "cn" de shadcn/ui,
 * sin dependencia de clsx/tailwind-merge para mantener el proyecto liviano).
 */
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
}
