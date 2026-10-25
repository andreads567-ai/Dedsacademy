import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  CertificateOfficialTemplate,
  CertificateFieldConfig,
  CertificateSide,
} from '../types';

export const STORAGE_KEY = 'deds_official_certificate_template_v2';

export interface StudentCertificateData {
  studentName: string;
  studentCpf?: string;
  studentCode?: string;
  courseTitle: string;
  courseCategory?: string;
  hours: number;
  issueDate: string; // Data de conclusão / emissão
  code: string;      // Código verificador
  instructor?: string;
  institutionName?: string;
  institutionCnpj?: string;
}

/**
 * Retorna o modelo salvo no localStorage ou o modelo padrão inicial.
 */
export function getSavedCertificateTemplate(): CertificateOfficialTemplate | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Erro ao ler modelo salvo do localStorage:', err);
  }
  return null;
}

/**
 * Normaliza as coordenadas para percentagem relativa (0 a 100%) da imagem de fundo renderizada.
 * Compensa o zoom do editor e qualquer transform: scale() aplicado ao container ou à imagem.
 */
export function calculateNormalizedDropCoordinates(
  clientX: number,
  clientY: number,
  containerEl: HTMLElement,
  imageEl?: HTMLImageElement | null
): {
  x_percent: number;
  y_percent: number;
  drop_x: number;
  drop_y: number;
  rendered_image_width: number;
  rendered_image_height: number;
} {
  // Se a tag <img> existir e tiver dimensões renderizadas, usamos o rect exato dela
  const targetRect =
    imageEl && imageEl.getBoundingClientRect().width > 0
      ? imageEl.getBoundingClientRect()
      : containerEl.getBoundingClientRect();

  const rendered_image_width = targetRect.width;
  const rendered_image_height = targetRect.height;

  // Distância do ponto do cursor até a borda superior/esquerda da imagem renderizada
  const drop_x = clientX - targetRect.left;
  const drop_y = clientY - targetRect.top;

  if (rendered_image_width <= 0 || rendered_image_height <= 0) {
    return {
      x_percent: 50,
      y_percent: 50,
      drop_x: 0,
      drop_y: 0,
      rendered_image_width: 1,
      rendered_image_height: 1,
    };
  }

  // x_percent = (drop_x / rendered_image_width) * 100
  // y_percent = (drop_y / rendered_image_height) * 100
  let x_percent = (drop_x / rendered_image_width) * 100;
  let y_percent = (drop_y / rendered_image_height) * 100;

  // Clampa estritamente entre 0% e 100% com precisão de 1 casa decimal
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

/**
 * Substitui os marcadores de dados dinâmicos do aluno ({aluno}, {curso}, {carga_horaria}, etc.)
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
    .replace(/\{carga_horaria\}/gi, `${data.hours}h`)
    .replace(/\{horas\}/gi, `${data.hours}h`)
    .replace(/\{data_conclusao\}/gi, data.issueDate)
    .replace(/\{data_emissao\}/gi, data.issueDate)
    .replace(/\{data\}/gi, data.issueDate)
    .replace(/\{codigo\}/gi, data.code)
    .replace(/\{codigo_emissao\}/gi, data.code)
    .replace(/\{cpf\}/gi, data.studentCpf || '')
    .replace(/\{cpf_aluno\}/gi, data.studentCpf || '')
    .replace(/\{instrutor\}/gi, data.instructor || 'Prof. Dr. Carlos Mendes')
    .replace(/\{instituicao\}/gi, template?.institutionName || 'Deds Academy Educação e Tecnologia Ltda.')
    .replace(/\{cnpj\}/gi, template?.institutionCnpj || '48.912.834/0001-92');
}

/**
 * Retorna o valor resolvido para uma chave de campo
 */
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
      return `${data.hours}h`;
    case 'data_conclusao':
    case 'data_emissao':
      return data.issueDate;
    case 'codigo':
    case 'codigo_emissao':
      return data.code;
    case 'cpf_aluno':
    case 'cpf':
      return data.studentCpf ? `CPF: ${data.studentCpf}` : '';
    case 'instrutor_assinatura':
    case 'instrutor':
      return data.instructor || 'Prof. Dr. Carlos Mendes';
    case 'dados_instituicao':
      return `${template?.institutionName || 'Deds Academy'} • CNPJ ${template?.institutionCnpj || '48.912.834/0001-92'}`;
    case 'registro_academico':
      return 'Livro de Registro: 14 • Folha: 89 • Registro Oficial Deds Academy';
    case 'amparo_legal':
      return 'Certificado válido em todo território nacional conforme Lei nº 9.394/96 e Dec. Presidencial nº 5.154/04.';
    case 'conteudo_programatico':
      return 'Conteúdo programático oficial: Módulos Teóricos, Laboratório Prático e Avaliação de Conhecimento.';
    default:
      return '';
  }
}

/**
 * Desenha o certificado diretamente sobre um elemento HTML5 Canvas (Offscreen) em alta resolução.
 * Não faz captura do DOM nem screenshot com html2canvas.
 */
export async function renderCertificateCanvas(
  studentData: StudentCertificateData,
  template: CertificateOfficialTemplate,
  side: CertificateSide = 'frente',
  options?: {
    forcedWidth?: number;
    forcedHeight?: number;
  }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const bgUrl = side === 'frente' ? template.frontBgImage : template.backBgImage;

  // 1. Carrega a imagem de fundo original (template A4 importado ou tema vetorizado)
  let bgImg: HTMLImageElement | null = null;
  if (bgUrl) {
    bgImg = new Image();
    bgImg.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      if (!bgImg) return resolve();
      bgImg.onload = () => resolve();
      bgImg.onerror = () => {
        console.warn('Não foi possível carregar a imagem de fundo do certificado:', bgUrl);
        resolve(); // Segue com fundo padrão se falhar
      };
      bgImg.src = bgUrl;
    });
  }

  // 2. Determina a resolução do Canvas (A4 landscape: proporção 297/210 = 1.414 ou resolução nativa da imagem)
  let outWidth = options?.forcedWidth || 2970;
  let outHeight = options?.forcedHeight || Math.round(outWidth / (297 / 210));

  if (bgImg && bgImg.naturalWidth > 0 && bgImg.naturalHeight > 0) {
    // Preserva a fidelidade e nitidez 100% da imagem original importada
    const natW = bgImg.naturalWidth;
    const natH = bgImg.naturalHeight;
    outWidth = Math.max(2480, natW);
    outHeight = Math.round(outWidth * (natH / natW));
  }

  canvas.width = outWidth;
  canvas.height = outHeight;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Não foi possível obter o contexto 2D do Canvas.');
  }

  // Ativa renderização de texto e suavização de alta qualidade
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 3. Desenha a arte de fundo importada ou gradiente oficial
  if (bgImg && bgImg.naturalWidth > 0) {
    ctx.drawImage(bgImg, 0, 0, outWidth, outHeight);
  } else {
    // Fundo vetorial sofisticado se o usuário ainda não tiver importado imagem própria
    const preset = side === 'frente' ? template.frontPreset : template.backPreset;
    const grad = ctx.createLinearGradient(0, 0, outWidth, outHeight);
    if (preset === 'classic_light') {
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(0.5, '#f1f5f9');
      grad.addColorStop(1, '#e2e8f0');
    } else if (preset === 'emerald_luxury') {
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#064e3b');
      grad.addColorStop(1, '#021f18');
    } else {
      grad.addColorStop(0, '#0c1324');
      grad.addColorStop(0.5, '#080d19');
      grad.addColorStop(1, '#04060d');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outWidth, outHeight);

    if (template.showBorders) {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.lineWidth = Math.round(outWidth * 0.002);
      ctx.strokeRect(outWidth * 0.02, outHeight * 0.025, outWidth * 0.96, outHeight * 0.95);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.8)';
      ctx.lineWidth = Math.round(outWidth * 0.0035);
      ctx.strokeRect(outWidth * 0.03, outHeight * 0.04, outWidth * 0.94, outHeight * 0.92);
    }
  }

  // 4. Renderiza cada um dos campos configurados exatamente nas coordenadas relativas (x_percent, y_percent)
  const fieldsArray = Object.values(template.fields || {}) as CertificateFieldConfig[];
  const sideFields = fieldsArray.filter((f) => f && f.side === side && f.visible !== false);

  for (const field of sideFields) {
    // Normalização das coordenadas (0 a 100%)
    const xPct = field.x_percent !== undefined ? field.x_percent : field.x !== undefined ? field.x : 50;
    const yPct = field.y_percent !== undefined ? field.y_percent : field.y !== undefined ? field.y : 50;

    const posX = (xPct / 100) * outWidth;
    const posY = (yPct / 100) * outHeight;

    // Caso especial: QR Code
    if (field.key === 'qr_code') {
      const qrPixelBase = field.size || 125;
      // Proporcional à altura do certificado
      const qrRenderSize = Math.round((qrPixelBase / 650) * outHeight);

      try {
        const verifyUrl = `https://dedsacademy.com/validar?codigo=${encodeURIComponent(studentData.code)}`;
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, verifyUrl, {
          width: qrRenderSize,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });

        const qrLeft = posX - qrRenderSize / 2;
        const qrTop = posY - qrRenderSize / 2;

        // Fundo branco com cantos arredondados sob o QR Code
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrLeft - 8, qrTop - 8, qrRenderSize + 16, qrRenderSize + 16);
        ctx.drawImage(qrCanvas, qrLeft, qrTop, qrRenderSize, qrRenderSize);
      } catch (qrErr) {
        console.error('Erro ao renderizar QR code no canvas:', qrErr);
      }
      continue;
    }

    // 5. Cálculo do Tamanho da Fonte com Base em tamanho_fonte_relativo
    let fontSizePx: number;
    if (field.tamanho_fonte_relativo !== undefined && field.tamanho_fonte_relativo > 0) {
      fontSizePx = Math.round((field.tamanho_fonte_relativo / 100) * outHeight);
    } else {
      // Fallback a partir de fontSize com base em altura de referência do editor (650px)
      const baseEditorHeight = 650;
      fontSizePx = Math.round(((field.fontSize || 14) / baseEditorHeight) * outHeight);
    }
    fontSizePx = Math.max(12, fontSizePx);

    // Formatação de fonte e estilo
    const weight =
      field.fontWeight === 'black'
        ? '900'
        : field.fontWeight === 'bold'
        ? 'bold'
        : field.fontWeight === 'semibold'
        ? '600'
        : field.fontWeight === 'medium'
        ? '500'
        : 'normal';

    const fontFamily = field.fontFamily || template.defaultFontFamily || 'Inter, sans-serif';
    ctx.font = `${weight} ${fontSizePx}px ${fontFamily}`;
    ctx.fillStyle = field.cor || field.color || '#ffffff';

    const align = (field.alinhamento || field.textAlign || 'center') as CanvasTextAlign;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';

    // 6. Resolução dos dados do aluno e substituição de tags ({aluno}, {curso}, {carga_horaria}, etc.)
    let rawFieldValue = resolveFieldValue(field.key, studentData, template);
    if (!rawFieldValue && field.sampleText) {
      rawFieldValue = field.sampleText;
    }
    // Suporta substituição de variáveis dentro de prefixos, sufixos ou textos customizados
    let resolvedText = replaceCertificatePlaceholders(rawFieldValue, studentData, template);

    // Evita prefixo redundante para data, horas ou código se já estiverem formatados
    const isSpecialField =
      field.key === 'data_emissao' ||
      field.key === 'data_conclusao' ||
      field.key === 'carga_horaria' ||
      field.key === 'codigo_emissao' ||
      field.key === 'codigo';

    const prefix = !isSpecialField && field.prefix ? replaceCertificatePlaceholders(field.prefix, studentData, template) : '';
    const suffix = !isSpecialField && field.suffix ? replaceCertificatePlaceholders(field.suffix, studentData, template) : '';
    const finalText = `${prefix}${resolvedText}${suffix}`.trim();

    if (!finalText) continue;

    // 7. Quebra de linha inteligente (Text Wrap)
    const isWrapped = field.textWrap !== false;
    if (isWrapped) {
      const maxWidthPct =
        field.maxWidth ||
        (field.key === 'nome_curso' || field.key === 'curso'
          ? 34
          : field.key === 'carga_horaria'
          ? 26
          : field.key === 'conteudo_programatico' || field.key === 'amparo_legal'
          ? 65
          : 70);

      const maxWidthPx = (maxWidthPct / 100) * outWidth;
      const lineHeightPx = fontSizePx * 1.25;

      const words = finalText.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const testLine = `${currentLine} ${words[i]}`;
        const metrics = ctx.measureText(testLine);
        if (metrics.width <= maxWidthPx) {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = words[i];
        }
      }
      lines.push(currentLine);

      const totalHeight = (lines.length - 1) * lineHeightPx;
      const startY = posY - totalHeight / 2;

      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], posX, startY + i * lineHeightPx);
      }
    } else {
      ctx.fillText(finalText, posX, posY);
    }
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
 * Faz o download do certificado oficial em imagem PNG de alta definição (desenhado diretamente no canvas)
 */
export async function downloadCertificatePng(
  studentData: StudentCertificateData,
  template?: CertificateOfficialTemplate,
  side: CertificateSide = 'frente'
): Promise<void> {
  const activeTemplate = template || getSavedCertificateTemplate();
  if (!activeTemplate) {
    throw new Error('Modelo de certificado não encontrado.');
  }

  const canvas = await renderCertificateCanvas(studentData, activeTemplate, side);
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
 * Gera e faz o download do certificado oficial em formato PDF A4 Paisagem (29,7 x 21 cm).
 * Desenha diretamente no Canvas e incorpora ao PDF com fidelidade milimétrica.
 */
export async function downloadCertificatePdf(
  studentData: StudentCertificateData,
  template?: CertificateOfficialTemplate,
  includeBackSide: boolean = true
): Promise<void> {
  const activeTemplate = template || getSavedCertificateTemplate();
  if (!activeTemplate) {
    throw new Error('Modelo de certificado não encontrado.');
  }

  // 1. Renderiza a Frente no Canvas
  const frontCanvas = await renderCertificateCanvas(studentData, activeTemplate, 'frente');
  const frontDataUrl = frontCanvas.toDataURL('image/png');

  // 2. Inicializa o PDF em A4 Paisagem
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297 x 210 mm
    compress: true,
  });

  // Insere a imagem da frente cobrindo exatamente a folha A4
  pdf.addImage(frontDataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');

  // 3. Renderiza o Verso (se houver arte ou campos configurados para o verso)
  const hasBackFields = Object.values(activeTemplate.fields || {}).some(
    (f) => f && f.side === 'verso' && f.visible !== false
  );

  if (includeBackSide && (activeTemplate.backBgImage || hasBackFields)) {
    const backCanvas = await renderCertificateCanvas(studentData, activeTemplate, 'verso');
    const backDataUrl = backCanvas.toDataURL('image/png');
    pdf.addPage('a4', 'landscape');
    pdf.addImage(backDataUrl, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
  }

  const studentSlug = slugifyFileName(studentData.studentName || 'Aluno');
  const courseSlug = slugifyFileName(studentData.courseTitle || 'Curso');
  const filename = `Certificado_Oficial_${studentSlug}_${courseSlug}.pdf`;

  pdf.save(filename);
}
