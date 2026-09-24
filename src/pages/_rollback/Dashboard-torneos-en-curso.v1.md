# Rollback: sección "Torneos en Curso" del Dashboard (v1)

Fecha de respaldo: 2026-09-23

## Cómo volver atrás

1. Abrir `src/pages/Dashboard.jsx`.
2. Buscar el bloque que empieza con `{/* Torneos en Curso — layout v2` y reemplazarlo por el fragmento JSX guardado abajo (desde `{/* 4. Selector` hasta el cierre del `space-y-8` del detalle).
3. O usar git: `git checkout -- src/pages/Dashboard.jsx` si este cambio está commiteado y querés revertir todo el archivo.

## Comportamiento v1 (original)

- Título "Torneos en Curso" + búsqueda de participante en la misma fila.
- Selector horizontal con `flex gap-2.5 overflow-x-auto` (scroll lateral).
- Tarjetas `shrink-0`, ancho máx ~190px en el subtítulo.
- Detalle del torneo **separado** debajo (`space-y-8`), sin marco común; solo el botón seleccionado tenía borde primary.

## Fragmento JSX v1 (selector + inicio detalle)

```jsx
            {/* 4. Selector de Torneo Activo */}
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Torneos en Curso</h2>
                  <p className="text-xs text-muted-foreground">Seleccioná un torneo para explorar su tabla provisoria y calendario</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input ... />
                </div>
              </div>
              <div className="mt-4 flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
                {torneos.map((t) => (
                  <button ... shrink-0 ...>...</button>
                ))}
              </div>
            </div>
            {currentTorneo && (
              <div className="space-y-8">
                {/* cabecera + podio + fixtures sin contenedor unificado */}
              </div>
            )}
```

Ver historial git del archivo para el JSX completo exacto pre-v2.
