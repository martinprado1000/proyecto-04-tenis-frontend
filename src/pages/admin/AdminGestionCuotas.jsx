import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { CalendarRange, Check, CircleDollarSign, Clock3, Pencil, Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { createQuota, deleteQuota, getQuotasMatrix, updateQuota } from '../../api/quotas.api'
import { getOrganizationBySlug, getOrganizations } from '../../api/organizations.api'
import { useTenant } from '../../hooks/useTenant'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const STATUS = {
  PAID: { label: 'Pagado', className: 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300' },
  PENDING: { label: 'Pendiente', className: 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300' },
  OVERDUE: { label: 'Vencido', className: 'border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300' },
  PARTIAL: { label: 'Parcial', className: 'border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300' },
}

const emptyForm = { amount: '', status: 'PENDING', paymentPlanEnabled: false, installments: 1, dueDate: '', planNotes: '', notes: '' }

function studentId(student) { return String(student?.id || student?._id || '') }
function studentName(student) { return `${student?.nombre || student?.name || ''} ${student?.apellido || student?.lastname || ''}`.trim() || 'Alumno' }
function quotaKey(userId, month) { return `${userId}-${month}` }

export default function AdminGestionCuotas() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [matrix, setMatrix] = useState({ students: [], quotas: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [organizations, setOrganizations] = useState([])
  const [filtroOrganizacion, setFiltroOrganizacion] = useState('')
  const { isSystem, tenantSlug } = useTenant()
  const form = useForm({ defaultValues: emptyForm })

  const quotasByKey = useMemo(() => new Map((matrix.quotas || []).map((quota) => [quotaKey(String(quota.userId?._id || quota.userId), quota.month), quota])), [matrix.quotas])

  async function loadMatrix(selectedYear = year) {
    setLoading(true)
    try {
      setMatrix(await getQuotasMatrix(selectedYear))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo cargar la gestión de cuotas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMatrix() }, [year])

  useEffect(() => {
    const loadOrganizations = isSystem ? getOrganizations() : tenantSlug ? getOrganizationBySlug(tenantSlug).then((org) => org ? [org] : []) : Promise.resolve([])
    loadOrganizations.then(setOrganizations).catch(() => setOrganizations([]))
  }, [isSystem, tenantSlug])

  function nombreOrganizacion(organizationId) {
    return organizations.find((org) => String(org._id || org.id) === String(organizationId))?.name || 'Sin organización'
  }

  const studentsFiltrados = (matrix.students || []).filter((student) => !filtroOrganizacion || String(student.organizationId) === String(filtroOrganizacion))

  function openQuota(student, month) {
    const existing = quotasByKey.get(quotaKey(studentId(student), month))
    setSelected({ student, month, quota: existing })
    setError('')
    form.reset(existing ? {
      amount: existing.amount,
      status: existing.status,
      paymentPlanEnabled: Boolean(existing.paymentPlan?.enabled),
      installments: existing.paymentPlan?.installments || 1,
      dueDate: existing.paymentPlan?.dueDates?.[0] ? String(existing.paymentPlan.dueDates[0]).slice(0, 10) : '',
      planNotes: existing.paymentPlan?.notes || '',
      notes: existing.notes || '',
    } : emptyForm)
  }

  function closeModal() { setSelected(null); form.reset(emptyForm); setError('') }

  async function saveQuota(values) {
    setSaving(true)
    setError('')
    const payload = {
      userId: studentId(selected.student),
      year,
      month: selected.month,
      amount: Number(values.amount || 0),
      status: values.status,
      notes: values.notes || '',
      paymentPlan: {
        enabled: Boolean(values.paymentPlanEnabled),
        installments: Number(values.installments || 1),
        dueDates: values.dueDate ? [values.dueDate] : [],
        notes: values.planNotes || '',
      },
    }
    try {
      if (selected.quota?._id) await updateQuota(selected.quota._id, payload)
      else await createQuota(payload)
      await loadMatrix()
      closeModal()
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'No se pudo guardar la cuota.'
      setError(Array.isArray(message) ? message.join(', ') : message)
    } finally {
      setSaving(false)
    }
  }

  async function removeQuota() {
    if (!selected?.quota?._id || !window.confirm('¿Eliminar esta cuota?')) return
    setSaving(true)
    try {
      await deleteQuota(selected.quota._id)
      await loadMatrix()
      closeModal()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No se pudo eliminar la cuota.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Administración financiera" title="Gestión de cuotas" description="Consultá y actualizá el estado de cuenta mensual de los alumnos de tu organización." />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><CircleDollarSign className="h-5 w-5 text-court" /> Estado de cuenta anual</CardTitle>
              <p className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-400">Esta tabla solo se mustra los usuario que son CLIENTES.</p>
            </div>
            <div className="flex items-center gap-2">
              {isSystem && <select value={filtroOrganizacion} onChange={(event) => setFiltroOrganizacion(event.target.value)} className="h-9 min-w-[180px] rounded-lg border border-input bg-background px-3 text-sm" aria-label="Filtrar cuotas por organización">
                <option value="">Organización: Todas</option>
                {organizations.map((org) => <option key={org._id || org.id} value={org._id || org.id}>{org.name}</option>)}
              </select>}
              <Label htmlFor="quotaYear" className="mb-0">Año</Label>
              <select id="quotaYear" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-9 rounded-lg border border-input bg-background px-3 text-sm">
                {[currentYear - 1, currentYear, currentYear + 1].map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {error && !selected && <p className="mb-4 rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error}</p>}
            {loading ? <p className="text-sm text-muted-foreground">Cargando estado de cuenta...</p> : studentsFiltrados.length === 0 ? <p className="text-sm text-muted-foreground">No hay clientes para la organización seleccionada.</p> : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-[1120px] w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="sticky left-0 z-10 bg-muted/95 px-4 py-3">Alumno</th><th className="px-4 py-3">Organización</th>{MONTHS.map((month) => <th key={month} className="px-2 py-3 text-center">{month.slice(0, 3)}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {studentsFiltrados.map((student) => (
                      <tr key={studentId(student)} className="hover:bg-muted/30">
                        <td className="sticky left-0 z-10 whitespace-nowrap bg-background px-4 py-3 font-medium">{studentName(student)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{nombreOrganizacion(student.organizationId)}</td>
                        {MONTHS.map((month, index) => {
                          const quota = quotasByKey.get(quotaKey(studentId(student), index + 1))
                          const status = quota ? STATUS[quota.status] : null
                          return <td key={month} className="px-1.5 py-2 text-center"><button type="button" onClick={() => openQuota(student, index + 1)} className="group flex min-h-12 w-full min-w-[72px] flex-col items-center justify-center rounded-lg border border-dashed border-border px-1 py-1 transition-colors hover:border-primary hover:bg-primary/5" title={quota ? `Editar ${quota.period}` : `Registrar cuota de ${month}`}>
                            {quota ? <><span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${status?.className}`}>{status?.label}</span><span className="mt-1 text-[10px] text-muted-foreground">${Number(quota.amount || 0).toLocaleString('es-AR')}</span></> : <Plus className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />}
                          </button></td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={Boolean(selected)} onClose={closeModal} title={`${selected?.quota ? 'Editar' : 'Registrar'} cuota · ${selected ? MONTHS[selected.month - 1] : ''} ${year}`} description={selected ? studentName(selected.student) : ''}>
        <form onSubmit={form.handleSubmit(saveQuota)} className="space-y-4">
          {error && <p className="rounded-lg bg-destructive/15 p-3 text-sm text-destructive">{error}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="quotaAmount">Monto</Label><Input id="quotaAmount" type="number" min="0" step="0.01" {...form.register('amount', { required: 'Ingresá el monto', min: { value: 0, message: 'El monto no puede ser negativo' } })} />{form.formState.errors.amount && <p className="mt-1 text-xs text-destructive">{form.formState.errors.amount.message}</p>}</div>
            <div><Label htmlFor="quotaStatus">Estado</Label><Select id="quotaStatus" {...form.register('status')}><option value="PENDING">Pendiente</option><option value="PAID">Pagado</option><option value="PARTIAL">Pago parcial</option><option value="OVERDUE">Vencido</option></Select></div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" {...form.register('paymentPlanEnabled')} /> Aplicar plan de pagos</label>
          {form.watch('paymentPlanEnabled') && <div className="grid gap-4 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2"><div><Label htmlFor="installments">Cantidad de cuotas</Label><Input id="installments" type="number" min="1" step="1" {...form.register('installments')} /></div><div><Label htmlFor="dueDate">Primer vencimiento</Label><Input id="dueDate" type="date" {...form.register('dueDate')} /></div><div className="sm:col-span-2"><Label htmlFor="planNotes">Detalle del plan</Label><Input id="planNotes" {...form.register('planNotes')} /></div></div>}
          <div><Label htmlFor="quotaNotes">Notas</Label><textarea id="quotaNotes" rows="3" className="mt-1.5 flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...form.register('notes')} /></div>
          <div className="flex items-center justify-between border-t border-border pt-4"><div>{selected?.quota && <Button type="button" variant="destructive" size="sm" onClick={removeQuota} disabled={saving}><Trash2 className="h-4 w-4" /> Eliminar</Button>}</div><div className="flex gap-2"><Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button><Button type="submit" loading={saving}><Check className="h-4 w-4" /> Guardar</Button></div></div>
        </form>
      </Modal>
    </div>
  )
}
