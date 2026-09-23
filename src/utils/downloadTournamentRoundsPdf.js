import { jsPDF } from 'jspdf'

function safeFileName(value) {
  return String(value || 'torneo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function participantName(participant, isRoundRobin) {
  if (!participant) return isRoundRobin ? 'Fecha libre' : 'Por definir'
  if (participant.nombre || participant.apellido) return `${participant.nombre || ''} ${participant.apellido || ''}`.trim()
  if (participant.name || participant.lastname) return `${participant.name || ''} ${participant.lastname || ''}`.trim()
  if (participant.integrante1 || participant.integrante2) {
    return [participant.integrante1, participant.integrante2].filter(Boolean).map((member) => participantName(member, isRoundRobin)).join(' / ') || participant.name || 'Equipo'
  }
  return isRoundRobin ? 'Fecha libre' : 'Por definir'
}

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getMatchLabel(tournament, match, maxRound) {
  if ((tournament.formato || '').toLowerCase().includes('playoffs')) {
    if (match.thirdPlace) return 'Definición 3°'
    if (match.round === maxRound) return 'Final'
    if (match.round === maxRound - 1) return 'Semifinal'
  }
  return `Ronda ${match.round || 1}`
}

async function loadOrganizationLogo(logoUrl) {
  if (!logoUrl) return null

  try {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'

    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = logoUrl
    })

    const canvas = document.createElement('canvas')
    const maxSize = 300
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))

    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

async function drawHeader(doc, organization, tournament, title) {
  doc.setFillColor(241, 245, 249)
  doc.rect(0, 0, 210, 297, 'F')

  doc.setFillColor(15, 23, 42)
  doc.roundedRect(12, 10, 186, 24, 6, 6, 'F')

  const logoData = await loadOrganizationLogo(organization?.logoUrl)
  let logoAdded = false

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 18, 15, 18, 18)
      logoAdded = true
    } catch {
      logoAdded = false
    }
  }

  if (!logoAdded) {
    doc.setFillColor(16, 185, 129)
    doc.circle(27, 22, 9, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(String(organization?.name || 'O').slice(0, 1).toUpperCase(), 27, 26, { align: 'center' })
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(organization?.name || 'Organización', 48, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(186, 230, 253)
  doc.text('Fixture oficial de tenis', 48, 28)

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(tournament.name || 'Torneo', 105, 42, { align: 'center' })

  doc.setFillColor(16, 185, 129)
  doc.roundedRect(42, 49, 126, 11, 5.5, 5.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(title.toUpperCase(), 105, 56, { align: 'center' })

  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(tournament.formato || '', 105, 67, { align: 'center' })
}

export function getTournamentRoundOptions(tournament) {
  const matches = tournament.fechas || []
  const maxRound = Math.max(...matches.map((match) => Number(match.round) || 1), 1)
  const isPlayoffs = (tournament.formato || '').toLowerCase().includes('playoffs')
  const options = [...new Set(matches.map((match) => Number(match.round) || 1))].sort((a, b) => a - b).map((round) => ({ value: `round-${round}`, label: `Ronda ${round}`, title: `Ronda ${round}`, filter: (match) => (Number(match.round) || 1) === round }))
  if (isPlayoffs) {
    const definitions = [
      { value: 'semifinal', label: 'Semifinal', filter: (match) => !match.thirdPlace && Number(match.round) === maxRound - 1 },
      { value: 'final', label: 'Final', filter: (match) => !match.thirdPlace && Number(match.round) === maxRound },
      { value: 'third-place', label: 'Definición 3°', filter: (match) => Boolean(match.thirdPlace) },
    ].filter((option) => matches.some(option.filter))
    return [...options, ...definitions]
  }
  return options
}

export async function downloadTournamentRoundPdf(tournament, organization = {}, optionValue) {
  const options = getTournamentRoundOptions(tournament)
  const option = options.find((item) => item.value === optionValue) || options[0]
  if (!option) return

  const matches = (tournament.fechas || []).filter(option.filter)
  const isRoundRobin = (tournament.formato || '').toLowerCase().includes('roundrobin')
    || (tournament.formato || '').toLowerCase().includes('round robin')
  const title = option.title || option.label
  const rowsPerPage = 25
  const tableTop = 82
  const rowHeight = 6.5
  const pages = []

  for (let i = 0; i < matches.length; i += rowsPerPage) {
    pages.push(matches.slice(i, i + rowsPerPage))
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  if (!pages.length) {
    await drawHeader(doc, organization, tournament, title)
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(11)
    doc.text('No hay partidos cargados para esta instancia.', 105, 151, { align: 'center' })
    doc.save(`${safeFileName(tournament.name)}_${safeFileName(title)}.pdf`)
    return
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    if (pageIndex > 0) doc.addPage()
    await drawHeader(doc, organization, tournament, title)

    const pageMatches = pages[pageIndex]
    const tableWidth = 182
    const leftX = 14
    const centerX = 105
    const rightX = 176
    const col1X = leftX + 6
    const col2X = 105
    const col3X = 118
    const col4X = rightX

    doc.setFillColor(226, 232, 240)
    doc.roundedRect(leftX, tableTop, tableWidth, 9, 4, 4, 'F')
    doc.setTextColor(51, 65, 85)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('PARTICIPANTE 1', col1X, tableTop + 6)
    doc.text('VS', centerX, tableTop + 6, { align: 'center' })
    doc.text('PARTICIPANTE 2', col3X, tableTop + 6)
    doc.text('FECHA', col4X, tableTop + 6, { align: 'center' })

    pageMatches.forEach((match, index) => {
      const rowY = tableTop + 11 + index * rowHeight
      const isAlt = index % 2 === 0
      doc.setFillColor(isAlt ? 255 : 248, isAlt ? 255 : 250, isAlt ? 255 : 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(leftX, rowY, tableWidth, rowHeight - 0.4, 2.5, 2.5, 'FD')

      const leftName = participantName(match.participante1, isRoundRobin).slice(0, 23)
      const rightName = participantName(match.participante2, isRoundRobin).slice(0, 23)

      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.1)
      doc.text(leftName, col1X, rowY + 4.5)

      doc.setTextColor(5, 150, 105)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('VS', centerX, rowY + 4.5, { align: 'center' })

      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.1)
      doc.text(rightName, col3X, rowY + 4.5)

      doc.setTextColor(71, 85, 105)
      doc.setFontSize(7)
      doc.text(formatDate(match.fecha), col4X, rowY + 4.5, { align: 'center' })
    })

    doc.setDrawColor(203, 213, 225)
    doc.line(14, 278, 196, 278)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')} • Página ${pageIndex + 1}`, 105, 286, { align: 'center' })
  }

  doc.save(`${safeFileName(tournament.name)}_${safeFileName(title)}.pdf`)
}
