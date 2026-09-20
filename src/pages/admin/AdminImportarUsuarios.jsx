import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { ArrowLeft, FileSpreadsheet, Pencil, Save, Trash2, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '../../hooks/useTenant'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { crearUsuario } from '../../api/admin.api'
import { getOrganizations, getOrganizationBySlug } from '../../api/organizations.api'

const DEFAULT_PASSWORD = 'Usuario123*'
const COLUMNS = ['nombre', 'apellido', 'email', 'dni', 'sexo', 'categoria']
const HEADERS = { nombre: 'Nombre', apellido: 'Apellido', email: 'Email', dni: 'DNI', sexo: 'Sexo', categoria: 'Categoría' }

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

function normalizeValue(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeSexo(value) {
  const normalized = normalizeValue(value).toLowerCase()
  if (normalized === 'masculino') return 'Masculino'
  if (normalized === 'femenino') return 'Femenino'
  return normalizeValue(value)
}

function normalizeCategoria(value) {
  if (!value) return ''
  return String(value).trim().toUpperCase()
}

function parseWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!firstSheet) return []
  const matrix = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
  if (!matrix.length) return []

  const headers = matrix[0].map(normalizeHeader)
  const aliases = {
    nombre: ['nombre', 'name'],
    apellido: ['apellido', 'lastname', 'lastname', 'surname'],
    email: ['email', 'correo', 'correoelectronico'],
    dni: ['dni', 'documento', 'documentoidentidad'],
    sexo: ['sexo', 'genero', 'género', 'gender'],
    categoria: ['categoria', 'categoría', 'category'],
  }

  return matrix.slice(1)
    .filter((values) => values.some((value) => normalizeValue(value)))
    .map((values) => COLUMNS.reduce((row, column) => {
      const index = headers.findIndex((header) => aliases[column].map(normalizeHeader).includes(header))
      row[column] = index >= 0
        ? (column === 'sexo'
            ? normalizeSexo(values[index])
            : column === 'categoria'
            ? normalizeCategoria(values[index])
            : normalizeValue(values[index]))
        : ''
      return row
    }, { _id: crypto.randomUUID() }))
}

function rowHasRequiredFields(row) {
  return Boolean(row.nombre.trim() && row.apellido.trim() && row.email.trim() && row.sexo.trim())
}

export default function AdminImportarUsuarios() {
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const { tenantSlug } = useTenant()
  const isSystem = window.location.pathname.startsWith('/SystemMP')
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)
  const [savingAll, setSavingAll] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [organizationId, setOrganizationId] = useState('')

  useEffect(() => {
    if (isSystem) {
      getOrganizations().then(setOrganizations).catch(() => setOrganizations([]))
      return
    }

    if (tenantSlug) {
      getOrganizationBySlug(tenantSlug)
        .then((organization) => {
          setOrganizations(organization ? [organization] : [])
          setOrganizationId(organization?._id || organization?.id || '')
        })
        .catch(() => setOrganizations([]))
    }
  }, [isSystem, tenantSlug])

  function updateRow(id, field, value) {
    setRows((current) => current.map((row) => row._id === id ? { ...row, [field]: value } : row))
  }

  function removeRow(id) {
    setRows((current) => current.filter((row) => row._id !== id))
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = parseWorkbook(reader.result)
        if (!imported.length) setError('La planilla no contiene filas con datos.')
        else setRows(imported)
      } catch {
        setError('No se pudo leer la planilla. Verificá que sea un archivo .xlsx o .ods válido.')
      }
    }
    reader.onerror = () => setError('No se pudo leer la planilla.')
    reader.readAsArrayBuffer(file)
    event.target.value = ''
  }

  function hasOrganization() {
    return Boolean(organizationId)
  }

  async function saveRow(row) {
    if (!hasOrganization()) {
      setError('Seleccioná una organización antes de guardar usuarios.')
      return
    }
    if (!rowHasRequiredFields(row)) {
      setError('Para guardar un usuario son obligatorios nombre, apellido, email y sexo.')
      return
    }
    setSavingId(row._id)
    setError('')
    try {
      await crearUsuario({ ...row, organizationId, rol: 'user', activo: true, password: DEFAULT_PASSWORD, confirmPassword: DEFAULT_PASSWORD })
      removeRow(row._id)
    } catch (err) {
      const message = err.response?.data?.message || 'No se pudo guardar el usuario.'
      setError(Array.isArray(message) ? message.join('. ') : message)
    } finally {
      setSavingId(null)
    }
  }

  async function saveAll() {
    if (!hasOrganization()) {
      setError('Seleccioná una organización antes de guardar usuarios.')
      return
    }
    const validRows = rows.filter(rowHasRequiredFields)
    if (!validRows.length) {
      setError('No hay usuarios completos para guardar. Completá nombre, apellido, email y sexo.')
      return
    }
    setSavingAll(true)
    setError('')
    const pending = []
    for (const row of validRows) {
      try {
        await crearUsuario({ ...row, organizationId, rol: 'user', activo: true, password: DEFAULT_PASSWORD, confirmPassword: DEFAULT_PASSWORD })
      } catch (err) {
        pending.push(row)
        const message = err.response?.data?.message || 'No se pudo guardar uno de los usuarios.'
        setError(Array.isArray(message) ? message.join('. ') : message)
      }
    }
    setRows((current) => current.filter((row) => pending.some((pendingRow) => pendingRow._id === row._id) || !rowHasRequiredFields(row)))
    setSavingAll(false)
  }

  return (
    <div>
      <PageHeader eyebrow="Panel exclusivo de administración" title="Importar usuarios" description="Cargá una planilla y revisá los usuarios antes de guardarlos en esta organización." />
      <div className="space-y-6 px-6 py-8 sm:px-8">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-[18px] w-[18px] text-court" /> Planilla de usuarios</CardTitle>
            <div className="flex flex-wrap gap-2">
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.ods" className="sr-only" onChange={handleFile} />
              <Button size="lg" onClick={() => inputRef.current?.click()}><Upload className="h-4 w-4" /> Importar planilla de usuarios</Button>
              <Button variant="outline" onClick={() => navigate(isSystem ? '/SystemMP/admin/usuarios' : `/${tenantSlug}/admin/usuarios`)}><ArrowLeft className="h-4 w-4" /> Volver</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isSystem && (
              <div className="mb-4 max-w-md">
                <label className="mb-1 block text-sm font-medium">Organización de destino</label>
                <Select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>
                  <option value="">Seleccionar organización...</option>
                  {organizations.map((organization) => (
                    <option key={organization._id || organization.id} value={organization._id || organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <p className="mb-4 text-xs text-muted-foreground">Acepta archivos .xlsx de Microsoft Excel y .ods de LibreOffice Calc. Las columnas requeridas son nombre, apellido y email; el orden de las columnas es indistinto.</p>
            {error && <div className="mb-4 rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">{error}</div>}
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay usuarios importados.</p> : (
              <>
                <Table>
                  <THead><TR>{COLUMNS.map((column) => <TH key={column}>{HEADERS[column]}</TH>)}<TH>Acciones</TH></TR></THead>
                  <TBody>{rows.map((row) => <TR key={row._id}>
                    {COLUMNS.map((column) => <TD key={column}>
                      {column === 'sexo' ? <Select value={normalizeSexo(row.sexo)} onChange={(event) => updateRow(row._id, column, event.target.value)}><option value="">Seleccionar...</option><option value="Masculino">Masculino</option><option value="Femenino">Femenino</option></Select> : column === 'categoria' ? <Select value={normalizeCategoria(row.categoria)} onChange={(event) => updateRow(row._id, column, event.target.value)}><option value="">Seleccionar...</option>{['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}</Select> : <Input value={row[column]} onChange={(event) => updateRow(row._id, column, event.target.value)} error={['nombre', 'apellido', 'email'].includes(column) && !row[column].trim()} />}
                    </TD>)}
                    <TD><div className="flex gap-1"><Button size="sm" variant="outline" title="Editar usuario"><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="outline" title="Guardar usuario" loading={savingId === row._id} onClick={() => saveRow(row)}><Save className="h-4 w-4" /></Button><Button size="sm" variant="destructive" title="Eliminar usuario" onClick={() => removeRow(row._id)}><Trash2 className="h-4 w-4" /></Button></div></TD>
                  </TR>)}</TBody>
                </Table>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4"><p className="text-xs text-muted-foreground">Las filas incompletas quedan pendientes.</p><Button onClick={saveAll} loading={savingAll}><Save className="h-4 w-4" /> Guardar todos los usuarios</Button></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
