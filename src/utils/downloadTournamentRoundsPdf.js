import { jsPDF } from 'jspdf'

function safeFileName(value) {
  return String(value || 'torneo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function participantName(participant) {
  if (!participant) return 'Por definir'
  if (participant.nombre || participant.apellido) return `${participant.nombre || ''} ${participant.apellido || ''}`.trim()
  if (participant.name || participant.lastname) return `${participant.name || ''} ${participant.lastname || ''}`.trim()
  if (participant.integrante1 || participant.integrante2) {
    return [participant.integrante1, participant.integrante2].filter(Boolean).map(participantName).join(' / ') || participant.name || 'Equipo'
  }
  return 'Por definir'
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

function drawHeader(doc, organization, tournament, title) {
  doc.setFillColor(241, 245, 249)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(14, 12, 182, 38, 6, 6, 'F')

  let logoAdded = false
  if (organization?.logoUrl) {
    try { doc.addImage(organization.logoUrl, 'AUTO', 22, 19, 24, 24); logoAdded = true } catch { logoAdded = false }
  }
  if (!logoAdded) {
    doc.setFillColor(16, 185, 129)
    doc.circle(34, 31, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(String(organization?.name || 'O').slice(0, 1).toUpperCase(), 34, 35, { align: 'center' })
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(organization?.name || 'Organización', 53, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(186, 230, 253)
  doc.text('Fixture oficial de tenis', 53, 40)

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(21)
  doc.text(tournament.name || 'Torneo', 105, 72, { align: 'center' })
  doc.setFillColor(16, 185, 129)
  doc.roundedRect(61, 82, 88, 11, 5.5, 5.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.text(title.toUpperCase(), 105, 89, { align: 'center' })
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(tournament.formato || '', 105, 103, { align: 'center' })
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

export function downloadTournamentRoundPdf(tournament, organization = {}, optionValue) {
  const options = getTournamentRoundOptions(tournament)
  const option = options.find((item) => item.value === optionValue) || options[0]
  if (!option) return
  const matches = (tournament.fechas || []).filter(option.filter)
  const maxRound = Math.max(...(tournament.fechas || []).map((match) => Number(match.round) || 1), 1)
  const title = option.title || option.label
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  drawHeader(doc, organization, tournament, title)

  doc.setFillColor(226, 232, 240)
  doc.roundedRect(14, 116, 182, 16, 5, 5, 'F')
  doc.setTextColor(51, 65, 85)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('PARTICIPANTE 1', 24, 126)
  doc.text('VS', 105, 126, { align: 'center' })
  doc.text('PARTICIPANTE 2', 119, 126)
  doc.text('FECHA LÍMITE', 176, 126, { align: 'center' })

  let y = 143
  matches.forEach((match, index) => {
    if (y > 265) {
      doc.addPage()
      drawHeader(doc, organization, tournament, title)
      y = 116
    }
    const isAlt = index % 2 === 0
    doc.setFillColor(isAlt ? 255 : 248, isAlt ? 255 : 250, isAlt ? 255 : 252)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(14, y - 10, 182, 29, 5, 5, 'FD')

    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(participantName(match.participante1).slice(0, 31), 24, y + 1)
    doc.setTextColor(5, 150, 105)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('VS', 105, y + 1, { align: 'center' })
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(participantName(match.participante2).slice(0, 31), 119, y + 1)
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(9)
    doc.text(formatDate(match.fecha), 176, y + 1, { align: 'center' })
    y += 36
  })

  if (!matches.length) {
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(11)
    doc.text('No hay partidos cargados para esta instancia.', 105, 151, { align: 'center' })
  }

  doc.setDrawColor(203, 213, 225)
  doc.line(14, 278, 196, 278)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, 105, 286, { align: 'center' })
  doc.save(`${safeFileName(tournament.name)}_${safeFileName(title)}.pdf`)
}
