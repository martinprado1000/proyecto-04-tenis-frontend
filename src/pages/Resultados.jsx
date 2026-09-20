import { useEffect, useState } from 'react'
import { Swords, Trophy, Target, GitBranch, BarChart2 } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { getResultados, getResultadoTorneo } from '../api/resultados.api'
import { TournamentBracketModal } from '../components/tournaments/TournamentBracketModal'
import { TournamentBracketModal2 } from '../components/tournaments/TournamentBracketModal2'
import { RoundRobinStandingsModal } from '../components/tournaments/RoundRobinStandingsModal'
import { RoundRobinStandingsModal2 } from '../components/tournaments/RoundRobinStandingsModal2'

const STATS = [
  { key: 'partidosJugados', label: 'Partidos jugados', Icon: Swords },
  { key: 'partidosGanados', label: 'Partidos ganados', Icon: Trophy },
  { key: 'puntos', label: 'Puntos', Icon: Target },
]

function formatDate(date) {
  if (!date) return 'Fecha a confirmar'
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Resultados() {
  const [torneos, setTorneos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalTorneo, setModalTorneo] = useState(null)
  const [modalTipo, setModalTipo] = useState(null)

  useEffect(() => {
    getResultados()
      .then(setTorneos)
      .catch(() => setError('No se pudieron cargar tus resultados. Intentá nuevamente.'))
      .finally(() => setLoading(false))
  }, [])

  async function abrirModal(torneo, tipo) {
    try {
      const completo = await getResultadoTorneo(torneo.id)
      setModalTorneo(completo)
      setModalTipo(tipo)
    } catch {
      setModalTorneo(torneo.torneoCompleto)
      setModalTipo(tipo)
    }
  }

  function cerrarModal() {
    setModalTorneo(null)
    setModalTipo(null)
  }

  return (
    <div>
      <PageHeader eyebrow="Mi actividad" title="Resultados" description="Tus estadísticas y los partidos jugados, organizados por torneo." />

      <div className="space-y-6 px-6 py-8 sm:px-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando resultados...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : torneos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no estás inscripto en ningún torneo.</p>
        ) : torneos.map((torneo) => (
          <Card key={torneo.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div>
                  <CardTitle>{torneo.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{torneo.formato}</p>
                </div>
                {torneo.formato?.toLowerCase().includes('roundrobin') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirModal(torneo, 'posiciones2')}
                    className="shrink-0"
                  >
                    <BarChart2 className="h-4 w-4" /> Mostrar tabla de posiciones
                  </Button>
                )}
                {torneo.formato?.toLowerCase().includes('playoffs') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirModal(torneo, 'llave2')}
                    className="shrink-0"
                  >
                    <GitBranch className="h-4 w-4" /> Mostrar llave
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STATS.map(({ key, label, Icon }) => (
                  <Card key={key} className="border-border/70 shadow-none">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
                      <div><p className="text-2xl font-bold leading-none">{torneo.stats?.[key] ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {torneo.matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no tenés partidos generados en este torneo.</p>
              ) : (
                <Table>
                  <THead><TR><TH>Rival</TH><TH>Instancia</TH><TH>Fecha</TH><TH>Resultado</TH><TH>Estado</TH></TR></THead>
                  <TBody>{torneo.matches.map((partido) => (
                    <TR key={partido.id}>
                      <TD className="font-medium">{partido.rival}</TD>
                      <TD className="text-muted-foreground">Ronda {partido.round || 1}</TD>
                      <TD className="text-muted-foreground">{formatDate(partido.fecha)}</TD>
                      <TD>{partido.resultado}</TD>
                      <TD><Badge variant={!partido.jugado ? 'warning' : partido.ganado ? 'success' : 'secondary'}>{!partido.jugado ? 'Pendiente' : partido.ganado ? 'Ganado' : 'Perdido'}</Badge></TD>
                    </TR>
                  ))}</TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {modalTipo === 'llave' && (
        <TournamentBracketModal
          torneo={modalTorneo}
          open={Boolean(modalTorneo)}
          onClose={cerrarModal}
        />
      )}
      {modalTipo === 'llave2' && (
        <TournamentBracketModal2
          torneo={modalTorneo}
          open={Boolean(modalTorneo)}
          onClose={cerrarModal}
        />
      )}
      {modalTipo === 'posiciones' && (
        <RoundRobinStandingsModal
          torneo={modalTorneo}
          open={Boolean(modalTorneo)}
          onClose={cerrarModal}
        />
      )}
      {modalTipo === 'posiciones2' && (
        <RoundRobinStandingsModal2
          torneo={modalTorneo}
          open={Boolean(modalTorneo)}
          onClose={cerrarModal}
        />
      )}
    </div>
  )
}
