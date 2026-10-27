import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  CertificateOfficialTemplate,
  CertificateFieldConfig,
  CertificateSide,
} from '../types';

export const STORAGE_KEY = 'deds_official_certificate_template_v2';

export const OFFICIAL_FRONT_BG = '/certificate-generator/frente.png';
export const OFFICIAL_BACK_BG = '/certificate-generator/verso.png';

export interface StudentCertificateData {
  studentName: string;
  studentCpf?: string;
  studentCode?: string;
  courseTitle: string;
  courseCategory?: string;
  hours: number;
  issueDate: string; // Data de conclusão / emissão
  code: string; // Código verificador único
  instructor?: string;
  institutionName?: string;
  institutionCnpj?: string;
  signatureImage?: string | null;
  signatureType?: 'draw' | 'upload' | 'font';
}

/**
 * Cache de imagens carregadas para acelerar a renderização
 */
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      // Tenta fallback sem barra inicial ou relativo
      const fallbackSrc = src.startsWith('/') ? src.slice(1) : '/' + src;
      const imgFallback = new Image();
      imgFallback.crossOrigin = 'anonymous';
      imgFallback.onload = () => {
        imageCache.set(src, imgFallback);
        resolve(imgFallback);
      };
      imgFallback.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
      imgFallback.src = fallbackSrc;
    };
    img.src = src;
  });
}

/**
 * Retorna o modelo salvo ou gera o modelo oficial nativo da Deds Academy
 */
export function getSavedCertificateTemplate(): CertificateOfficialTemplate {
  return {
    id: 'deds-official-template-v3',
    name: 'Modelo Oficial Deds Academy Frente e Verso (A4)',
    institutionName: 'Deds Academy Educação e Tecnologia Ltda.',
    institutionCnpj: '45.678.901/0001-23',
    institutionCity: 'São Paulo - SP',
    frontBgImage: OFFICIAL_FRONT_BG,
    backBgImage: OFFICIAL_BACK_BG,
    frontPreset: 'custom',
    backPreset: 'custom',
    showBorders: false,
    aspectRatioMode: 'a4',
    imageFitMode: 'cover',
    defaultFontFamily: 'Montserrat, sans-serif',
    fields: {},
  };
}

/**
 * Substitui marcadores no texto
 */
export function replaceCertificatePlaceholders(
  rawText: string,
  data: StudentCertificateData,
  template?: CertificateOfficialTemplate
): string {
  if (!rawText) return '';
  return rawText
    .replace(/\{aluno\}/gi, data.studentName)
    .replace(/\{nome_aluno\}/gi, data.studentName)
    .replace(/\{curso\}/gi, data.courseTitle)
    .replace(/\{nome_curso\}/gi, data.courseTitle)
    .replace(/\{carga_horaria\}/gi, `${data.hours} horas`)
    .replace(/\{horas\}/gi, `${data.hours} horas`)
    .replace(/\{data_conclusao\}/gi, data.issueDate)
    .replace(/\{data_emissao\}/gi, data.issueDate)
    .replace(/\{data\}/gi, data.issueDate)
    .replace(/\{codigo\}/gi, data.code)
    .replace(/\{codigo_emissao\}/gi, data.code)
    .replace(/\{cpf\}/gi, data.studentCpf || '123.456.789-00')
    .replace(/\{cpf_aluno\}/gi, data.studentCpf || '123.456.789-00')
    .replace(/\{instrutor\}/gi, data.instructor || 'Deds Academy')
    .replace(/\{instituicao\}/gi, template?.institutionName || 'Deds Academy Educação e Tecnologia Ltda.')
    .replace(/\{cnpj\}/gi, template?.institutionCnpj || '45.678.901/0001-23');
}

/**
 * Normalização de coordenadas para compatibilidade
 */
export function calculateNormalizedDropCoordinates(
  clientX: number,
  clientY: number,
  containerEl: HTMLElement,
  imageEl?: HTMLImageElement | null
) {
  const targetRect =
    imageEl && imageEl.getBoundingClientRect().width > 0
      ? imageEl.getBoundingClientRect()
      : containerEl.getBoundingClientRect();

  const rendered_image_width = targetRect.width || 1;
  const rendered_image_height = targetRect.height || 1;
  const drop_x = clientX - targetRect.left;
  const drop_y = clientY - targetRect.top;

  let x_percent = (drop_x / rendered_image_width) * 100;
  let y_percent = (drop_y / rendered_image_height) * 100;
  x_percent = Math.max(0, Math.min(100, Math.round(x_percent * 10) / 10));
  y_percent = Math.max(0, Math.min(100, Math.round(y_percent * 10) / 10));

  return {
    x_percent,
    y_percent,
    drop_x,
    drop_y,
    rendered_image_width,
    rendered_image_height,
  };
}

export function resolveFieldValue(
  fieldKey: string,
  data: StudentCertificateData,
  template?: CertificateOfficialTemplate
): string {
  switch (fieldKey) {
    case 'aluno':
    case 'nome_aluno':
      return data.studentName;
    case 'curso':
    case 'nome_curso':
      return data.courseTitle;
    case 'carga_horaria':
    case 'horas':
      return `${data.hours} horas`;
    case 'data_conclusao':
    case 'data_emissao':
    case 'data':
      return data.issueDate;
    case 'codigo':
    case 'codigo_emissao':
      return data.code;
    case 'cpf':
    case 'cpf_aluno':
      return data.studentCpf || '';
    default:
      return '';
  }
}

/**
 * Renderiza o lado (Frente ou Verso) do certificado em alta resolução (2048 x 1448)
 * utilizando o grid pixel-perfect oficial desenhado pelo Antigravity.
 */
export async function renderCertificateCanvas(
  studentData: StudentCertificateData,
  _template?: CertificateOfficialTemplate,
  side: CertificateSide = 'frente',
  options?: { forcedWidth?: number; forcedHeight?: number }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');

  // Resolução base de alta definição (2x do padrão 1024x724 = 2048x1448)
  const baseW = 1024;
  const baseH = 724;
  const scale = 2; // Alta resolução 300 DPI

  const outWidth = options?.forcedWidth || baseW * scale;
  const outHeight = options?.forcedHeight || baseH * scale;

  canvas.width = outWidth;
  canvas.height = outHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Não foi possível obter contexto 2D para renderização.');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fator multiplicador em relação à resolução de referência 1024x724
  const factorX = outWidth / baseW;
  const factorY = outHeight / baseH;

  const fx = (x: number) => x * factorX;
  const fy = (y: number) => y * factorY;
  const fsize = (size: number) => size * factorY;

  // 1. Carrega e desenha o plano de fundo
  const bgUrl = side === 'frente' ? OFFICIAL_FRONT_BG : OFFICIAL_BACK_BG;
  try {
    const bgImg = await loadImage(bgUrl);
    ctx.drawImage(bgImg, 0, 0, outWidth, outHeight);
  } catch (err) {
    console.warn(`[Certificado] Imagem de fundo não carregou (${bgUrl}), usando gradiente oficial:`, err);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, outWidth, outHeight);
  }

  const studentName = studentData.studentName || 'Nome do Aluno';
  const studentCpf = studentData.studentCpf || '000.000.000-00';
  const courseTitle = studentData.courseTitle || 'Nome do Curso';
  const hoursText = `${studentData.hours || 40} horas`;
  const issueDate = studentData.issueDate || new Date().toLocaleDateString('pt-BR');
  const certCode = studentData.code || 'DA2026-0001';
  const institutionCnpj = studentData.institutionCnpj || '45.678.901/0001-23';

  if (side === 'frente') {
    // -------------------------------------------------------------
    // FRENTE DO CERTIFICADO (Pixel-Perfect)
    // -------------------------------------------------------------

    // 1. Nome do Aluno (Caligráfico Great Vibes, top: 300, left: 175, width: 674, height: 84)
    ctx.font = `400 ${fsize(50)}px 'Great Vibes', 'Alex Brush', cursive`;
    ctx.fillStyle = '#091e2b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(studentName, fx(175 + 674 / 2), fy(300 + 84 / 2));

    // 2. CPF do Aluno (Montserrat 600, top: 388, left: 175, width: 674)
    ctx.font = `600 ${fsize(10.5)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#4b5563';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CPF: ${studentCpf}`, fx(175 + 674 / 2), fy(388 + 8));

    // 3. Coluna Curso (Montserrat 700, top: 521, left: 82, width: 198, height: 38)
    ctx.font = `700 ${fsize(12.5)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#1a2941';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Se o nome do curso for longo, abrevia ou desenha em 2 linhas se necessário
    if (courseTitle.length > 24) {
      const parts = courseTitle.split(' ');
      const mid = Math.ceil(parts.length / 2);
      const line1 = parts.slice(0, mid).join(' ');
      const line2 = parts.slice(mid).join(' ');
      ctx.font = `700 ${fsize(10.5)}px 'Montserrat', sans-serif`;
      ctx.fillText(line1, fx(82 + 198 / 2), fy(521 + 12));
      ctx.fillText(line2, fx(82 + 198 / 2), fy(521 + 26));
    } else {
      ctx.fillText(courseTitle, fx(82 + 198 / 2), fy(521 + 38 / 2));
    }

    // 4. Coluna Carga Horária (Montserrat 700, top: 521, left: 295, width: 162, height: 38)
    ctx.font = `700 ${fsize(13)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#1a2941';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hoursText, fx(295 + 162 / 2), fy(521 + 38 / 2));

    // 5. Coluna Data de Conclusão (Montserrat 700, top: 521, left: 478, width: 192, height: 38)
    ctx.font = `700 ${fsize(13)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#1a2941';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(issueDate, fx(478 + 192 / 2), fy(521 + 38 / 2));

    // 6. Coluna Código do Certificado (Montserrat 700, top: 521, left: 677, width: 190, height: 38)
    ctx.font = `700 ${fsize(13)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#1a2941';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(certCode, fx(677 + 190 / 2), fy(521 + 38 / 2));

    // 7. Assinatura do Aluno (top: 566, left: 140, width: 215, height: 66)
    if (studentData.signatureImage) {
      try {
        const sigImg = await loadImage(studentData.signatureImage);
        ctx.drawImage(sigImg, fx(140 + 10), fy(566 + 4), fx(195), fy(58));
      } catch (sigErr) {
        // Fallback para caligrafia
        ctx.font = `400 ${fsize(34)}px 'Alex Brush', 'Great Vibes', cursive`;
        ctx.fillStyle = '#0b2230';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(studentName, fx(140 + 215 / 2), fy(566 + 66 / 2));
      }
    } else {
      ctx.font = `400 ${fsize(34)}px 'Alex Brush', 'Great Vibes', cursive`;
      ctx.fillStyle = '#0b2230';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(studentName, fx(140 + 215 / 2), fy(566 + 66 / 2));
    }

    // 8. CPF na Assinatura (top: 672, left: 140, width: 215)
    ctx.font = `600 ${fsize(9.5)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CPF: ${studentCpf}`, fx(140 + 215 / 2), fy(672 + 9));

    // 9. CNPJ Deds Academy na Assinatura da Instituição (top: 672, left: 600, width: 280)
    ctx.font = `600 ${fsize(9.5)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CNPJ: ${institutionCnpj}`, fx(600 + 280 / 2), fy(672 + 9));
  } else {
    // -------------------------------------------------------------
    // VERSO DO CERTIFICADO (Pixel-Perfect)
    // -------------------------------------------------------------

    // 1. QR Code Dinâmico (top: 346, left: 646, width: 140, height: 140)
    try {
      const verifyUrl = `https://dedsacademy.vercel.app/validar?codigo=${encodeURIComponent(certCode)}`;
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, verifyUrl, {
        width: Math.round(140 * factorX),
        margin: 1,
        color: {
          dark: '#0b2230',
          light: '#ffffff',
        },
      });

      const qrLeft = fx(646);
      const qrTop = fy(346);
      const qrSize = fx(140);
      ctx.drawImage(qrCanvas, qrLeft, qrTop, qrSize, qrSize);
    } catch (qrErr) {
      console.error('Erro ao gerar QR Code:', qrErr);
    }

    // 2. Link de Validação abaixo do QR Code (top: 494, left: 624, width: 184)
    ctx.font = `600 ${fsize(8)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#006756';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('www.dedsacademy.com/validar-certificado', fx(624 + 184 / 2), fy(494 + 6));

    // 3. Código em Destaque na Pill Branca (top: 556, left: 360, width: 405, height: 44)
    ctx.font = `800 ${fsize(25)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#082132';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(certCode, fx(360 + 405 / 2), fy(556 + 44 / 2));

    // 4. CNPJ Institucional no Verso (top: 486, left: 106, width: 220)
    ctx.font = `600 ${fsize(8.5)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#006756';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CNPJ: ${institutionCnpj}`, fx(106), fy(486 + 6));

    // 5. Carimbo Digital Completo de Autenticidade (bottom: 24px, center)
    ctx.font = `500 ${fsize(8.5)}px 'Montserrat', sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const legalStamp = `🔐 Deds Academy • CNPJ: ${institutionCnpj} • Aluno: ${studentName} (CPF: ${studentCpf}) • Lei Federal 14.063/2020`;
    ctx.fillText(legalStamp, outWidth / 2, fy(695));
  }

  return canvas;
}

/**
 * Função utilitária para sanitizar o nome de arquivo
 */
function slugifyFileName(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 40);
}

/**
 * Faz o download do certificado oficial em imagem PNG de alta definição
 */
export async function downloadCertificatePng(
  studentData: StudentCertificateData,
  template?: CertificateOfficialTemplate,
  side: CertificateSide = 'frente'
): Promise<void> {
  const canvas = await renderCertificateCanvas(studentData, template, side);
  const dataUrl = canvas.toDataURL('image/png');

  const studentSlug = slugifyFileName(studentData.studentName || 'Aluno');
  const courseSlug = slugifyFileName(studentData.courseTitle || 'Curso');
  const filename = `Certificado_${studentSlug}_${courseSlug}_${side}.png`;

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Gera e faz o download do certificado oficial em formato PDF A4 Paisagem (297 x 210 mm).
 * Inclui Frente e Verso em alta definição (300 DPI) em 2 páginas no mesmo arquivo.
 */
export async function downloadCertificatePdf(
  studentData: StudentCertificateData,
  template?: CertificateOfficialTemplate,
  includeBackSide: boolean = true
): Promise<void> {
  // 1. Renderiza a Frente
  const frontCanvas = await renderCertificateCanvas(studentData, template, 'frente');
  const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.98);

  // 2. Inicializa o PDF A4 Paisagem (297 x 210 mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Página 1: Frente
  pdf.addImage(frontDataUrl, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');

  // Página 2: Verso
  if (includeBackSide) {
    const backCanvas = await renderCertificateCanvas(studentData, template, 'verso');
    const backDataUrl = backCanvas.toDataURL('image/jpeg', 0.98);
    pdf.addPage('a4', 'landscape');
    pdf.addImage(backDataUrl, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
  }

  const studentSlug = slugifyFileName(studentData.studentName || 'Aluno');
  const courseSlug = slugifyFileName(studentData.courseTitle || 'Curso');
  const filename = `Certificado_Oficial_DedsAcademy_${studentSlug}_${courseSlug}.pdf`;

  pdf.save(filename);
}
