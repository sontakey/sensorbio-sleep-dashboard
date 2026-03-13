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

function toRgb(input: string) {
  // Canvas parser returns a normalized rgb()/rgba()/hex string even if input was lab()/oklch().
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return input;
  try {
    ctx.fillStyle = '#000';
    ctx.fillStyle = input;
    return String(ctx.fillStyle);
  } catch {
    return input;
  }
}

function inlineSafeColors(root: HTMLElement) {
  const props = [
    'color',
    'background-color',
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'caret-color',
    'fill',
    'stroke',
    'box-shadow',
  ];

  const all: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
  for (const el of all) {
    const cs = window.getComputedStyle(el);

    for (const prop of props) {
      const val = cs.getPropertyValue(prop);
      if (!val) continue;
      if (val.includes('lab(') || val.includes('oklch(') || val.includes('oklab(')) {
        el.style.setProperty(prop, toRgb(val));
      }
    }

    const bg = cs.getPropertyValue('background');
    if (bg && (bg.includes('lab(') || bg.includes('oklch(') || bg.includes('oklab('))) {
      const bgc = cs.getPropertyValue('background-color');
      if (bgc) el.style.setProperty('background-color', toRgb(bgc));
    }
  }
}

export async function downloadDashboardPdf({
  element,
  userLabel,
}: {
  element: HTMLElement;
  userLabel: string;
}) {
  // Clone and inline computed colors as rgb(), html2canvas cannot parse lab()/oklch().
  const source = element;
  const clone = source.cloneNode(true) as HTMLElement;

  clone.style.width = `${source.offsetWidth}px`;
  clone.style.maxWidth = `${source.offsetWidth}px`;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-100000px';
  wrapper.style.top = '0';
  wrapper.style.background =
    getComputedStyle(document.documentElement).getPropertyValue('--background').trim() || '#0a0e1a';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

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

  try {
    inlineSafeColors(clone);

    const canvas = await html2canvas(clone, {
      backgroundColor: null,
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
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
  } finally {
    wrapper.remove();
  }
}
