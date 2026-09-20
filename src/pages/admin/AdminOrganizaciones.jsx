import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Building2, Copy, ImagePlus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Label, Select } from '../../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/layout/PageHeader'
import { getOrganizations, createOrganization, updateOrganization, deleteOrganization, getSystemBranding, updateSystemBranding } from '../../api/organizations.api'
import { useBranding } from '../../context/BrandingContext'

const PLAN_OPTIONS = ['FREE', 'PRO']
const EMPTY_CREATE = { name: '', adminName: '', email: '', password: '', logoUrl: '', plan: 'FREE' }
const EMPTY_EDIT = { name: '', slug: '', email: '', logoUrl: '', plan: 'FREE', isActive: 'true' }
const EMPTY_BRANDING = { name: 'MatchPoint TC', logoUrl: '' }
const slugify = (value) => value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function ErrorMessage({ message }) {
  if (!message) return null
  return <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">{message}</div>
}

function LogoField({ register, setValue, watch, error, id = 'logo-create' }) {
  const inputRef = useRef(null)
  const logoUrl = watch('logoUrl')

  async function handleLogo(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setValue('logoUrl', '', { shouldValidate: true })
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setValue('logoUrl', '', { shouldValidate: true })
      return
    }
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    setValue('logoUrl', dataUrl, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <div>
      <Label htmlFor={id}>Logo (opcional, hasta 3 MB)</Label>
      <input id={id} type="file" accept="image/*" className="sr-only" ref={(element) => {
        inputRef.current = element
        register('logoUrl').ref(element)
      }} onChange={handleLogo} />
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" /> Seleccionar imagen
        </Button>
        {logoUrl && <img src={logoUrl} alt="Vista previa del logo" className="h-10 w-10 rounded-lg border border-border object-cover" />}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function OrganizationForm({ form, onSubmit, saving, submitLabel, errorMessage, editing = false }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form
  const name = watch('name') || ''

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <ErrorMessage message={errorMessage} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${editing ? 'edit' : 'create'}-name`}>Nombre de la organización, Slug / URL *</Label>
          <Input id={`${editing ? 'edit' : 'create'}-name`} placeholder="Deportivo SMP" error={Boolean(errors.name)} {...register('name', {
            required: 'El nombre de la organización es obligatorio',
            minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' },
          })} />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor={`${editing ? 'edit' : 'create'}-adminName`}>Responsable / administrador *</Label>
          <Input id={`${editing ? 'edit' : 'create'}-adminName`} placeholder="Juan Pérez" error={Boolean(errors.adminName)} {...register('adminName', {
            required: 'El responsable es obligatorio',
            validate: (val) => {
              const parts = (val || '').trim().split(/\s+/).filter(Boolean)
              if (parts.length < 2) {
                return 'Debes ingresar nombre y apellido (al menos dos palabras)'
              }
              return true
            },
          })} />
          {errors.adminName && <p className="mt-1 text-xs text-destructive">{errors.adminName.message}</p>}
        </div>
        {editing && (
          <>
          <div>
            <Label htmlFor="edit-slug">Slug / URL *</Label>
            <Input id="edit-slug" error={Boolean(errors.slug)} {...register('slug', {
              required: 'El slug es obligatorio',
              pattern: { value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Usá minúsculas, números y guiones' },
            })} />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div>
            <Label htmlFor="edit-email">Email de la organización</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="club@example.com"
              error={Boolean(errors.email)}
              {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresá un email válido' } })}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          </>
        )}
        {!editing && (
          <>
            <div>
              <Label htmlFor="create-email">Email del administrador *</Label>
              <Input id="create-email" type="email" error={Boolean(errors.email)} {...register('email', { required: 'El email es obligatorio', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ingresá un email válido' } })} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="create-password">Contraseña inicial *</Label>
              <Input id="create-password" type="password" error={Boolean(errors.password)} {...register('password', { required: 'La contraseña es obligatoria', minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' } })} />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </>
        )}
        {!editing && (
          <div>
            <Label htmlFor="create-plan">Plan</Label>
            <Select id="create-plan" {...register('plan')}>
              {PLAN_OPTIONS.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
            </Select>
          </div>
        )}
        {editing && (
          <>
            <div>
              <Label htmlFor="edit-plan">Plan</Label>
              <Select id="edit-plan" {...register('plan')}>
                {PLAN_OPTIONS.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-isActive">Estado</Label>
              <Select id="edit-isActive" {...register('isActive')}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </div>
          </>
        )}
        <LogoField register={register} setValue={setValue} watch={watch} id={`${editing ? 'edit' : 'create'}-logo`} />
      </div>
      {!editing && <p className="text-xs text-muted-foreground">URL: /{slugify(name) || 'nombre-del-club'}</p>}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        {editing && <Button type="button" variant="outline" onClick={form.onCancel}>Cancelar</Button>}
        <Button type="submit" loading={saving}>{saving ? 'Guardando...' : submitLabel}</Button>
      </div>
    </form>
  )
}

export default function AdminOrganizaciones() {
  const { branding, setBranding } = useBranding()
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalError, setModalError] = useState('')
  const [editing, setEditing] = useState(null)
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [brandingError, setBrandingError] = useState('')
  const brandingForm = useForm({ defaultValues: EMPTY_BRANDING })
  const createForm = useForm({ defaultValues: EMPTY_CREATE })
  const editForm = useForm({ defaultValues: EMPTY_EDIT })

  async function load() {
    setLoading(true)
    try { setOrgs(await getOrganizations()); setError('') } catch (err) { setError(formatError(err, 'No se pudieron cargar las organizaciones.')) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    getSystemBranding().then((data) => brandingForm.reset({ name: data.name || 'MatchPoint TC', logoUrl: data.logoUrl || '' })).catch(() => {})
  }, [])

  async function handleBrandingSave(data) {
    setBrandingSaving(true)
    setBrandingError('')
    try {
      const updated = await updateSystemBranding(data)
      setBranding(updated)
      brandingForm.reset(updated)
    } catch (err) {
      setBrandingError(formatError(err, 'No se pudo guardar la configuración del sistema.'))
    } finally {
      setBrandingSaving(false)
    }
  }

  async function handleCreate(data) {
    setSaving(true); setError('')
    try {
      await createOrganization({ ...data, slug: slugify(data.name) })
      createForm.reset(EMPTY_CREATE)
      await load()
    } catch (err) { setError(formatError(err, 'No se pudo crear la organización.')) } finally { setSaving(false) }
  }

  function openEdit(org) {
    setModalError('')
    setEditing(org)
    editForm.reset({
      name: org.name || '',
      adminName: org.adminName || '',
      slug: org.slug || slugify(org.name || ''),
      email: org.email || '',
      logoUrl: org.logoUrl || '',
      plan: org.plan || 'FREE',
      isActive: String(org.isActive ?? true),
    })
  }

  async function handleEdit(data) {
    setSaving(true); setModalError('')
    try {
      await updateOrganization(editing._id || editing.id, { ...data, isActive: data.isActive === 'true' })
      setEditing(null)
      await load()
    } catch (err) { setModalError(formatError(err, 'No se pudo editar la organización.')) } finally { setSaving(false) }
  }

  async function handleDelete(org) {
    if (!window.confirm(`¿Eliminar la organización ${org.name}? Esta acción no elimina automáticamente sus datos.`)) return
    try { await deleteOrganization(org._id || org.id); await load() } catch (err) { setError(formatError(err, 'No se pudo eliminar la organización.')) }
  }

  return <div>
    <PageHeader eyebrow="Panel global" title="Organizaciones" description="Creá clubes independientes con su propio administrador, URL y datos aislados." />
    <div className="space-y-6 px-6 py-8 sm:px-8">
      <Card>
        <CardHeader><CardTitle>Configuración del sistema</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={brandingForm.handleSubmit(handleBrandingSave)} className="space-y-4">
            {brandingError && <ErrorMessage message={brandingError} />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="system-brand-name">Nombre del sistema *</Label>
                <Input id="system-brand-name" {...brandingForm.register('name', { required: 'El nombre del sistema es obligatorio' })} error={Boolean(brandingForm.formState.errors.name)} />
                {brandingForm.formState.errors.name && <p className="mt-1 text-xs text-destructive">{brandingForm.formState.errors.name.message}</p>}
              </div>
              <LogoField register={brandingForm.register} setValue={brandingForm.setValue} watch={brandingForm.watch} id="system-brand-logo" />
            </div>
            <div className="flex items-center justify-end border-t border-border pt-4">
              <Button type="submit" loading={brandingSaving}>{brandingSaving ? 'Guardando...' : 'Guardar configuración'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Nueva organización</CardTitle></CardHeader>
        <CardContent><OrganizationForm form={createForm} onSubmit={handleCreate} saving={saving} submitLabel="Crear organización y administrador" errorMessage={error} /></CardContent>
      </Card>
      {loading ? <p className="text-sm text-muted-foreground">Cargando organizaciones...</p> : <div className="grid gap-4 md:grid-cols-2">
        {orgs.map((org) => <Card key={org._id || org.id}><CardContent className="flex items-center gap-3 pt-6">
          {org.logoUrl ? <img src={org.logoUrl} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary"><Building2 /></div>}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{org.name}</p>
            {org.adminName && <p className="text-xs text-muted-foreground font-medium">Responsable: {org.adminName}</p>}
            <p className="truncate text-sm text-muted-foreground">{window.location.origin}/{org.slug}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={org.isActive === false ? 'destructive' : 'success'}>{org.isActive === false ? 'Inactiva' : 'Activa'}</Badge>
              <Badge variant="outline">Plan {org.plan || 'FREE'}</Badge>{org.isProtected && <Badge variant="warning">Protegida</Badge>}
            </div>
          </div>
          <div className="flex gap-1"><Button size="sm" variant="outline" title="Copiar URL" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${org.slug}`)}><Copy className="h-4 w-4" /></Button><Button size="sm" variant="outline" title="Editar" onClick={() => openEdit(org)}><Pencil className="h-4 w-4" /></Button>{!org.isProtected && <Button size="sm" variant="destructive" title="Eliminar" onClick={() => handleDelete(org)}><Trash2 className="h-4 w-4" /></Button>}</div>
        </CardContent></Card>)}
      </div>}
    </div>
    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Editar organización: ${editing?.name || ''}`} description="Modificá todos los datos de la organización.">
      <OrganizationForm form={{ ...editForm, onCancel: () => setEditing(null) }} onSubmit={handleEdit} saving={saving} submitLabel="Guardar cambios" errorMessage={modalError} editing />
    </Modal>
  </div>
}

function formatError(err, fallback) {
  const message = err.response?.data?.message || fallback
  return Array.isArray(message) ? message.join('. ') : message
}
