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

function maybeUnsupportedColor(value: string) {
  const v = value.toLowerCase();
  return v.includes('lab(') || v.includes('oklab(') || v.includes('oklch(');
}

function toRgb(input: string): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return input;
  ctx.fillStyle = '#000';
  ctx.fillStyle = input;
  return ctx.fillStyle;
}

function normalizeElementColors(el: Element) {
  const style = window.getComputedStyle(el);

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
    'fill',
    'stroke',
  ] as const;

  for (const prop of props) {
    const value = style.getPropertyValue(prop);
    if (value && maybeUnsupportedColor(value)) {
      (el as HTMLElement).style.setProperty(prop, toRgb(value));
    }
  }

  const bg = style.getPropertyValue('background');
  if (bg && maybeUnsupportedColor(bg)) {
    (el as HTMLElement).style.setProperty('background', toRgb(bg));
  }
}

function normalizeTreeColors(root: Element) {
  normalizeElementColors(root);
  const all = root.querySelectorAll('*');
  for (const el of all) normalizeElementColors(el);
}

export async function downloadDashboardPdf({
  element,
  userLabel,
}: {
  element: HTMLElement;
  userLabel: string;
}) {
  const clone = element.cloneNode(true) as HTMLElement;

  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${element.getBoundingClientRect().width}px`;
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = '0';
  wrapper.appendChild(clone);

  document.body.appendChild(wrapper);

  try {
    normalizeTreeColors(clone);

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
    const spaceHeight = pageHeight - margin * 2;

    let sourceY = 0;
    while (sourceY < canvas.height) {
      const sliceHeightPx = Math.min(canvas.height - sourceY, (spaceHeight * canvas.width) / imgWidth);

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceHeightPx;

      const ctx = slice.getContext('2d');
      if (!ctx) throw new Error('Failed to create canvas context');

      ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      const sliceData = slice.toDataURL('image/png', 1.0);
      const sliceHeightPt = (sliceHeightPx * imgWidth) / canvas.width;

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceHeightPt, undefined, 'FAST');

      sourceY += sliceHeightPx;
      if (sourceY < canvas.height) pdf.addPage();
    }

    const filename = `${safeFilePart(userLabel)}_30-Day_Sleep_Report_${yyyyMmDd()}.pdf`;
    pdf.save(filename);
  } finally {
    wrapper.remove();
  }
}
