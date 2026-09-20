import { useState } from 'react'

/**
 * Hook that captures a DOM element and downloads it as a PDF.
 * Uses onclone to strip backdrop-filter, overflow:hidden and transforms
 * that cause html2canvas to cut off text.
 */
export function useGeneratePdf() {
  const [generating, setGenerating] = useState(false)

  async function generatePdf(elementRef, filename = 'documento.pdf') {
    if (!elementRef?.current) return
    setGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const element = elementRef.current

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
        // Fix text clipping: capture the full scrollable content
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (_doc, cloned) => {
          // Walk all elements in the clone and neutralise styles that break rendering
          cloned.querySelectorAll('*').forEach((el) => {
            const s = el.style
            // Remove backdrop-filter (renders as black box in html2canvas)
            s.backdropFilter = 'none'
            s.webkitBackdropFilter = 'none'
            // Remove overflow:hidden so text is not clipped
            const computed = window.getComputedStyle(el)
            if (computed.overflow === 'hidden') s.overflow = 'visible'
            if (computed.overflowY === 'hidden') s.overflowY = 'visible'
            // Reset transforms (zoom, scale) that misplace content
            if (s.transform && s.transform !== 'none') s.transform = 'none'
          })
          // Also fix the root cloned element itself
          cloned.style.overflow = 'visible'
          cloned.style.transform = 'none'
        },
      })

      const imgData = canvas.toDataURL('image/png')
      const imgW = canvas.width
      const imgH = canvas.height

      // Fit to A4 width (595pt), height proportional
      const pdfW = 595
      const ratio = pdfW / imgW
      const pdfH = imgH * ratio

      const pdf = new jsPDF({
        orientation: pdfH > pdfW ? 'portrait' : 'landscape',
        unit: 'pt',
        format: [pdfW, pdfH],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(filename)
    } catch (err) {
      console.error('Error generando PDF:', err)
    } finally {
      setGenerating(false)
    }
  }

  return { generating, generatePdf }
}
