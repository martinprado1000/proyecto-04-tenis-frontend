import { useEffect, useState } from 'react'
import { CalendarDays, Trophy, Swords, Users, MessageCircle } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { getFechas } from '../api/fechas.api'

const ESTADO_VARIANT = {
  Confirmado: 'success',
  Pendiente: 'warning',
  'Por confirmar': 'secondary',
  Jugado: 'outline',
  Suspendido: 'destructive',
}

function whatsappUrl(phone) {
  const digits = String(phone || '').replace(/[^\d]/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

function TarjetaPartido({ partido, esDobles }) {
  const rivalPhones = Array.isArray(partido.rivalTelefonos) ? partido.rivalTelefonos : []
  const primaryPhone = rivalPhones[0]
  const whatsapp = whatsappUrl(primaryPhone)

  return (
    <Card className="overflow-hidden">
      <div className={`h-1.5 w-full ${esDobles ? 'bg-court' : 'bg-primary'}`} />
      <CardContent className="pt-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {esDobles ? <Users className="h-3.5 w-3.5" /> : <Swords className="h-3.5 w-3.5" />}
              {esDobles ? 'Rival (equipo)' : 'Rival'}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-lg font-semibold">{partido.rival}</p>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Escribir por WhatsApp a ${partido.rival}`}
                  title={`Escribir por WhatsApp${primaryPhone ? `: ${primaryPhone}` : ''}`}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>{primaryPhone}</span>
                </a>
              )}
            </div>
            {rivalPhones.length > 1 && (
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                {rivalPhones.slice(1).map((phone) => {
                  const link = whatsappUrl(phone)
                  return link ? <a key={phone} href={link} target="_blank" rel="noreferrer" className="hover:text-emerald-600">{phone}</a> : null
                })}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Torneo: {partido.torneo}</p>
            <p className="mt-1 text-l font-medium text-primary">Ronda {partido.round || 1}</p>
          </div>
          <Badge variant={ESTADO_VARIANT[partido.estado] || 'secondary'}>{partido.estado}</Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {partido.fecha
              ? new Date(`${partido.fecha}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
              : 'Fecha a confirmar'}
          </div>
        </div>

        {partido.resultado !== '-' && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-medium">Resultado:</span> {partido.resultado}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function MisFechas() {
  const [fechas, setFechas] = useState({ singles: [], dobles: [] })
  const [tab, setTab] = useState('singles')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFechas().then((data) => {
      setFechas(data)
      setLoading(false)
    })
  }, [])

  const lista = tab === 'singles' ? fechas.singles : fechas.dobles
  const fechasPorTorneo = lista.reduce((torneos, partido) => {
    const torneo = partido.torneo || 'Torneo sin nombre'
    if (!torneos[torneo]) torneos[torneo] = []
    torneos[torneo].push(partido)
    return torneos
  }, {})

  return (
    <div>
      <PageHeader
        eyebrow="Calendario"
        title="Mis Fechas"
        description="Próximos partidos programados en el fixture del torneo, separados por Singles y Dobles."
      />

      <div className="px-6 py-8 sm:px-8">
        <div className="mb-6 inline-flex rounded-lg bg-muted p-1 text-sm font-medium">
          <button
            onClick={() => setTab('singles')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${tab === 'singles' ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground'}`}
          >
            <Swords className="h-4 w-4" /> Singles
            {!loading && <Badge variant="secondary" className="ml-1">{fechas.singles.length}</Badge>}
          </button>
          <button
            onClick={() => setTab('dobles')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 transition-colors ${tab === 'dobles' ? 'bg-card shadow-soft text-foreground' : 'text-muted-foreground'}`}
          >
            <Users className="h-4 w-4" /> Dobles
            {!loading && <Badge variant="secondary" className="ml-1">{fechas.dobles.length}</Badge>}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando próximos partidos...</p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tenés partidos de {tab === 'singles' ? 'Singles' : 'Dobles'} por el momento.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(fechasPorTorneo).map(([torneo, partidos]) => (
              <Card key={torneo}>
                <CardHeader>
                  <CardTitle>{torneo}</CardTitle>
                  <p className="text-sm text-muted-foreground">{tab === 'singles' ? 'Singles' : 'Dobles'} · {partidos.length} {partidos.length === 1 ? 'partido' : 'partidos'}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...partidos].sort((a, b) => (a.round || 1) - (b.round || 1)).map((partido) => (
                      <TarjetaPartido key={partido.id} partido={partido} esDobles={tab === 'dobles'} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
