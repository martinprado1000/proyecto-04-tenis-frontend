export default function NotFound({ message }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="font-display text-2xl font-bold">URL no válida</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {message || (
          <>
            Todas las rutas deben incluir tu organización. Ejemplo:{' '}
            <span className="font-mono text-foreground">/deportivo_smp/login</span>
          </>
        )}
      </p>
    </div>
  )
}
