import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function safeFilePart(s: string) {
  return s
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');
}

function yyyyMmDd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function downloadDashboardPdf({
  element,
  userLabel,
}: {
  element: HTMLElement;
  userLabel: string;
}) {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);

  // Letter portrait
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'letter',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 28;
  const usableWidth = pageWidth - margin * 2;
  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = margin;
  let remainingHeight = imgHeight;
  let sourceY = 0;

  // Load logo (best-effort). If it fails, continue without it.
  async function loadLogoDataUrl() {
    try {
      const res = await fetch('/sensorbio-logo.png');
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read logo')); 
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  const themeBg = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
  const isLight = themeBg.toLowerCase() === '#f8fafc' || document.documentElement.classList.contains('light');

  const logo = await loadLogoDataUrl();

  while (remainingHeight > 0) {
    // How much vertical space we can fit on this page
    const space = pageHeight - margin * 2;
    const sliceHeightPx = Math.min(canvas.height - sourceY, (space * canvas.width) / imgWidth);

    // Create a page slice canvas
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceHeightPx;

    const ctx = slice.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

    const sliceData = slice.toDataURL('image/png', 1.0);
    const sliceHeightPt = (sliceHeightPx * imgWidth) / canvas.width;

    // Fill background to preserve theme even if page has transparency
    if (isLight) {
      pdf.setFillColor(248, 250, 252);
    } else {
      pdf.setFillColor(15, 23, 42);
    }
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header brand
    if (logo) {
      const logoH = 24;
      const logoW = 24 * 3.2;
      try {
        pdf.addImage(logo, 'PNG', margin, 16, logoW, logoH, undefined, 'FAST');
      } catch {
        // ignore
      }
    }

    pdf.addImage(sliceData, 'PNG', margin, y, imgWidth, sliceHeightPt, undefined, 'FAST');

    remainingHeight -= sliceHeightPt;
    sourceY += sliceHeightPx;

    if (sourceY < canvas.height) {
      pdf.addPage();
      y = margin;
    }
  }

  const filename = `${safeFilePart(userLabel)}_30-Day_Sleep_Report_${yyyyMmDd()}.pdf`;
  pdf.save(filename);
}
