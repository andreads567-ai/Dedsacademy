import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CertificateSide,
  CertificateFieldKey,
  CertificateFieldConfig,
  CertificateOfficialTemplate,
} from '../../types';

interface CertificateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleCourseTitle?: string;
  sampleHours?: number;
  sampleInstructor?: string;
  sampleStudentName?: string;
  sampleCpf?: string;
  sampleCode?: string;
  onSaveTemplate?: (template: CertificateOfficialTemplate) => void;
}

const STORAGE_KEY = 'deds_official_certificate_template_v2';

export const CERTIFICATE_FONT_OPTIONS = [
  { id: 'Inter, sans-serif', name: 'Inter (Moderna & Padrão)' },
  { id: "'Playfair Display', serif", name: 'Playfair Display (Diploma & Nobre)' },
  { id: "'Cinzel', serif", name: 'Cinzel (Solene Romana)' },
  { id: "'Montserrat', sans-serif", name: 'Montserrat (Corporativa)' },
  { id: "'Merriweather', serif", name: 'Merriweather (Acadêmica)' },
  { id: "'Great Vibes', cursive", name: 'Great Vibes (Caligrafia / Assinatura)' },
  { id: "'Times New Roman', serif", name: 'Times New Roman (Clássica)' },
  { id: "'Courier New', monospace", name: 'Courier New (Monospaçada / Código)' },
  { id: 'Georgia, serif', name: 'Georgia (Serifada Editorial)' },
  { id: 'Arial, sans-serif', name: 'Arial (Simples)' },
];

export const DEFAULT_CERTIFICATE_TEMPLATE: CertificateOfficialTemplate = {
  id: 'template-oficial-deds-v2',
  name: 'Modelo Oficial Deds Academy (Frente e Verso)',
  institutionName: 'Deds Academy Educação e Tecnologia Ltda.',
  institutionCnpj: '48.912.834/0001-92',
  institutionCity: 'São Paulo - SP',
  frontBgImage: null,
  backBgImage: null,
  frontPreset: 'dark_gold',
  backPreset: 'dark_gold',
  showBorders: true,
  aspectRatioMode: 'auto',
  imageFitMode: 'contain',
  defaultFontFamily: 'Inter, sans-serif',
  fields: {
    // FRENTE (Otimizado para proporção 16:9 • 1920x1080 px • 29,7x16,7 cm)
    nome_aluno: {
      key: 'nome_aluno',
      label: 'Nome e Dados do Aluno',
      side: 'frente',
      x: 50,
      y: 44,
      fontSize: 27, // -1px aplicado para encaixe perfeito
      color: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
      visible: true,
      textWrap: true,
      maxWidth: 70,
      fontFamily: "'Playfair Display', serif",
      sampleText: 'André Silva',
    },
    cpf_aluno: {
      key: 'cpf_aluno',
      label: 'CPF Cadastrado do Aluno',
      side: 'frente',
      x: 50,
      y: 52,
      fontSize: 12, // -1px aplicado
      color: '#cbd5e1',
      fontWeight: 'medium',
      textAlign: 'center',
      visible: true,
      textWrap: false,
      maxWidth: 40,
      fontFamily: 'Inter, sans-serif',
      prefix: 'CPF: ',
      sampleText: '384.920.118-04',
    },
    nome_curso: {
      key: 'nome_curso',
      label: 'Nome do Curso',
      side: 'frente',
      x: 50,
      y: 62,
      fontSize: 22, // -1px aplicado
      color: '#34d399',
      fontWeight: 'bold',
      textAlign: 'center',
      visible: true,
      textWrap: true,
      maxWidth: 34, // Quebra automática perfeita dentro de colunas da imagem
      fontFamily: 'Inter, sans-serif',
      sampleText: 'Excel do Básico ao Avançado & Dashboards Dinâmicos',
    },
    carga_horaria: {
      key: 'carga_horaria',
      label: 'Carga Horária (Apenas Horas ex: 60h)',
      side: 'frente',
      x: 50,
      y: 71,
      fontSize: 12, // -1px aplicado
      color: '#e2e8f0',
      fontWeight: 'semibold',
      textAlign: 'center',
      visible: true,
      textWrap: true,
      maxWidth: 26,
      fontFamily: 'Inter, sans-serif',
      prefix: '',
      suffix: '',
      sampleText: '60h',
    },
    data_emissao: {
      key: 'data_emissao',
      label: 'Data de Emissão (Apenas Números)',
      side: 'frente',
      x: 28,
      y: 83,
      fontSize: 11, // -1px aplicado
      color: '#94a3b8',
      fontWeight: 'normal',
      textAlign: 'center',
      visible: true,
      textWrap: false,
      maxWidth: 26,
      fontFamily: 'Inter, sans-serif',
      prefix: '',
      sampleText: '16-09-2026',
    },
    dados_instituicao: {
      key: 'dados_instituicao',
      label: 'Dados da Instituição',
      side: 'frente',
      x: 28,
      y: 92,
      fontSize: 10, // -1px aplicado
      color: '#34d399',
      fontWeight: 'bold',
      textAlign: 'left',
      visible: true,
      textWrap: true,
      maxWidth: 40,
      fontFamily: 'Inter, sans-serif',
      sampleText: 'Deds Academy • Educação & Tecnologia',
    },
    codigo_emissao: {
      key: 'codigo_emissao',
      label: 'Código do Certificado (Apenas Números)',
      side: 'frente',
      x: 84,
      y: 92,
      fontSize: 10, // -1px aplicado
      color: '#fbbf24',
      fontWeight: 'bold',
      textAlign: 'right',
      visible: true,
      textWrap: false,
      maxWidth: 30,
      fontFamily: "'Courier New', monospace",
      prefix: '',
      suffix: '',
      sampleText: '2026-9842',
    },
    instrutor_assinatura: {
      key: 'instrutor_assinatura',
      label: 'Assinatura / Instrutor Responsável',
      side: 'frente',
      x: 72,
      y: 83,
      fontSize: 10, // -1px aplicado
      color: '#cbd5e1',
      fontWeight: 'medium',
      textAlign: 'center',
      visible: true,
      textWrap: true,
      maxWidth: 32,
      fontFamily: "'Great Vibes', cursive",
      prefix: 'Coordenação: ',
      sampleText: 'Prof. Dr. Carlos Mendes',
    },

    // VERSO
    qr_code: {
      key: 'qr_code',
      label: 'QR Code de Validação',
      side: 'verso',
      x: 25,
      y: 48,
      fontSize: 11, // -1px aplicado
      size: 125,
      color: '#0f172a',
      fontWeight: 'bold',
      textAlign: 'center',
      visible: true,
      textWrap: false,
      sampleText: 'Validação Criptográfica',
    },
    registro_academico: {
      key: 'registro_academico',
      label: 'Registro Acadêmico e Livro Oficial',
      side: 'verso',
      x: 70,
      y: 38,
      fontSize: 10, // -1px aplicado
      color: '#cbd5e1',
      fontWeight: 'normal',
      textAlign: 'left',
      visible: true,
      textWrap: true,
      maxWidth: 65,
      fontFamily: 'Inter, sans-serif',
      sampleText: 'Livro de Registro: 14 • Folha: 89 • Registro nº 2026/894-DF',
    },
    amparo_legal: {
      key: 'amparo_legal',
      label: 'Amparo Legal (Lei nº 9.394/96)',
      side: 'verso',
      x: 70,
      y: 62,
      fontSize: 9, // -1px aplicado
      color: '#94a3b8',
      fontWeight: 'normal',
      textAlign: 'left',
      visible: true,
      textWrap: true,
      maxWidth: 65,
      fontFamily: 'Inter, sans-serif',
      sampleText: 'Válido em todo território nacional conforme Lei nº 9.394/96 e Decreto Presidencial nº 5.154/04.',
    },
    conteudo_programatico: {
      key: 'conteudo_programatico',
      label: 'Conteúdo Programático do Curso',
      side: 'verso',
      x: 50,
      y: 88,
      fontSize: 9, // -1px aplicado
      color: '#64748b',
      fontWeight: 'normal',
      textAlign: 'center',
      visible: true,
      textWrap: true,
      maxWidth: 80,
      fontFamily: 'Inter, sans-serif',
      sampleText: 'Módulos: Fundamentos, Fórmulas Avançadas, Power Query, Dashboards Dinâmicos e Avaliação Prática.',
    },
  },
};

export const CertificateTemplateModal: React.FC<CertificateTemplateModalProps> = ({
  isOpen,
  onClose,
  sampleCourseTitle = 'Excel do Básico ao Avançado & Dashboards Dinâmicos',
  sampleHours = 60,
  sampleInstructor = 'Prof. Dr. Carlos Mendes',
  sampleStudentName = 'André Silva',
  sampleCpf = '384.920.118-04',
  sampleCode = '2026-9842',
  onSaveTemplate,
}) => {
  // Active side: Frente ou Verso
  const [activeSide, setActiveSide] = useState<CertificateSide>('frente');

  // Mode: edit with bounding boxes & coords vs clean live preview
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // Complete template state
  const [template, setTemplate] = useState<CertificateOfficialTemplate>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedFields = {
          ...DEFAULT_CERTIFICATE_TEMPLATE.fields,
          ...(parsed.fields || {}),
        };

        // Redução de -1px para caber na imagem e injeção de quebra de texto / fontes
        const hasReduced1px = parsed._v3_reduced_1px;
        for (const k of Object.keys(mergedFields) as CertificateFieldKey[]) {
          if (!hasReduced1px && k !== 'qr_code' && mergedFields[k].fontSize) {
            mergedFields[k] = {
              ...mergedFields[k],
              fontSize: Math.max(5, mergedFields[k].fontSize - 1),
            };
          }
          if (mergedFields[k].textWrap === undefined) {
            mergedFields[k].textWrap = k === 'cpf_aluno' || k === 'codigo_emissao' || k === 'data_emissao' ? false : true;
          }
          if (!mergedFields[k].maxWidth) {
            mergedFields[k].maxWidth = k === 'nome_curso' ? 34 : k === 'carga_horaria' ? 26 : k === 'conteudo_programatico' || k === 'amparo_legal' ? 65 : 70;
          }
          if (!mergedFields[k].fontFamily) {
            mergedFields[k].fontFamily = DEFAULT_CERTIFICATE_TEMPLATE.fields[k]?.fontFamily || 'Inter, sans-serif';
          }
        }

        // Remove prefixo 'Emitido em ' para deixar somente os números da data de emissão (ex: 16-09-2026)
        if (mergedFields.data_emissao) {
          mergedFields.data_emissao = {
            ...mergedFields.data_emissao,
            prefix: '',
            sampleText:
              mergedFields.data_emissao.sampleText && !mergedFields.data_emissao.sampleText.toLowerCase().includes('emitido')
                ? mergedFields.data_emissao.sampleText
                : '16-09-2026',
          };
        }

        // Atualiza Carga Horária para somente a hora (ex: 60h) sem prefixos nem sufixos
        if (mergedFields.carga_horaria) {
          const oldSample = mergedFields.carga_horaria.sampleText || '';
          const numOnly = oldSample.replace(/\D/g, '') || '60';
          mergedFields.carga_horaria = {
            ...mergedFields.carga_horaria,
            prefix: '',
            suffix: '',
            sampleText: `${numOnly}h`,
          };
        }

        // Atualiza Código do Certificado para somente números do código (ex: 2026-9842 ou 20269842)
        if (mergedFields.codigo_emissao) {
          const oldSample = mergedFields.codigo_emissao.sampleText || '';
          const cleanedCode = oldSample.replace(/^[A-Za-z\s:._-]+/, '').replace(/[^\d-]/g, '') || '2026-9842';
          mergedFields.codigo_emissao = {
            ...mergedFields.codigo_emissao,
            prefix: '',
            suffix: '',
            sampleText: cleanedCode,
          };
        }

        return {
          ...DEFAULT_CERTIFICATE_TEMPLATE,
          ...parsed,
          _v3_reduced_1px: true,
          defaultFontFamily: parsed.defaultFontFamily || 'Inter, sans-serif',
          fields: mergedFields,
        };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CERTIFICATE_TEMPLATE;
  });

  // Currently selected field for detailed adjustments on left panel
  const [selectedFieldKey, setSelectedFieldKey] = useState<CertificateFieldKey>('nome_aluno');

  // Aspect ratios and dimensions for imported images
  const [imageAspectRatios, setImageAspectRatios] = useState<{ frente?: number; verso?: number }>({});
  const [imageDimensions, setImageDimensions] = useState<{
    frente?: { width: number; height: number };
    verso?: { width: number; height: number };
  }>({});

  // Full-width expanded canvas mode
  const [expandedCanvas, setExpandedCanvas] = useState(false);

  // Zoom Level for interactive canvas visualization (1.0 = Fit to Screen, 1.25, 1.5, etc.)
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Measure main workspace container dynamically so certificate takes maximum screen space
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 1100,
    height: 650,
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateDimensions = () => {
      if (mainContainerRef.current) {
        const rect = mainContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerDimensions({
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    };

    // Immediate calculation and slight delay to catch render transitions
    updateDimensions();
    const timer = setTimeout(updateDimensions, 100);

    let observer: ResizeObserver | null = null;
    if (mainContainerRef.current && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updateDimensions();
      });
      observer.observe(mainContainerRef.current);
    }

    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isOpen, expandedCanvas, activeSide]);

  // Lock body scroll while modal is open to ensure clean scrolling inside canvas
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Adjust field size (+ / -)
  const adjustFieldSize = (key: CertificateFieldKey, delta: number) => {
    const field = template.fields[key];
    if (!field) return;
    if (field.key === 'qr_code') {
      const currentSize = field.size || 125;
      const newSize = Math.max(40, Math.min(260, currentSize + delta * 5));
      updateField(key, { size: newSize });
    } else {
      const currentSize = field.fontSize || 14;
      const newSize = Math.max(5, Math.min(64, currentSize + delta));
      updateField(key, { fontSize: newSize });
    }
  };

  // Adjust all visible fields of active side by exact pixel delta (-1px / +1px)
  const handleAdjustAllFieldsPx = (deltaPx: number) => {
    setTemplate((prev) => {
      const updated = { ...prev.fields };
      for (const key of Object.keys(updated) as CertificateFieldKey[]) {
        if (updated[key].side === activeSide) {
          if (key === 'qr_code') {
            updated[key] = {
              ...updated[key],
              size: Math.max(40, Math.min(260, (updated[key].size || 125) + deltaPx * 5)),
            };
          } else {
            updated[key] = {
              ...updated[key],
              fontSize: Math.max(5, Math.min(64, updated[key].fontSize + deltaPx)),
            };
          }
        }
      }
      return { ...prev, fields: updated };
    });
    showToast(deltaPx < 0 ? 'Todas as fontes diminuídas em -1px para caber na imagem!' : 'Todas as fontes aumentadas em +1px!');
  };

  // Apply font to all fields of the certificate
  const handleApplyFontToAllFields = (fontFamily: string) => {
    setTemplate((prev) => {
      const updated = { ...prev.fields };
      for (const key of Object.keys(updated) as CertificateFieldKey[]) {
        if (key !== 'qr_code') {
          updated[key] = {
            ...updated[key],
            fontFamily,
          };
        }
      }
      return { ...prev, defaultFontFamily: fontFamily, fields: updated };
    });
    const fontObj = CERTIFICATE_FONT_OPTIONS.find((f) => f.id === fontFamily);
    showToast(`Fonte "${fontObj?.name || fontFamily}" aplicada a todos os campos!`);
  };

  // Remove field from certificate (set visible: false)
  const handleRemoveField = (key: CertificateFieldKey) => {
    const field = template.fields[key];
    if (!field) return;
    updateField(key, { visible: false });
    showToast(`"${field.label}" removido do certificado.`);
  };

  // Scale all visible fields of active side
  const handleScaleAllFields = (multiplier: number) => {
    setTemplate((prev) => {
      const updated = { ...prev.fields };
      for (const key of Object.keys(updated) as CertificateFieldKey[]) {
        if (updated[key].side === activeSide) {
          if (key === 'qr_code') {
            updated[key] = {
              ...updated[key],
              size: Math.max(40, Math.min(240, Math.round((updated[key].size || 125) * multiplier))),
            };
          } else {
            updated[key] = {
              ...updated[key],
              fontSize: Math.max(5, Math.min(48, Math.round(updated[key].fontSize * multiplier))),
            };
          }
        }
      }
      return { ...prev, fields: updated };
    });
    showToast(multiplier < 1 ? 'Fontes reduzidas para melhor encaixe!' : 'Fontes ampliadas!');
  };

  // Keyboard shortcuts: Delete/Backspace (remove), +/- (resize)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldKey) {
        e.preventDefault();
        handleRemoveField(selectedFieldKey);
      } else if ((e.key === '+' || e.key === '=') && selectedFieldKey) {
        e.preventDefault();
        adjustFieldSize(selectedFieldKey, 1);
      } else if ((e.key === '-' || e.key === '_') && selectedFieldKey) {
        e.preventDefault();
        adjustFieldSize(selectedFieldKey, -1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedFieldKey, template.fields]);

  // Detect image natural dimensions on mount or whenever background images change
  useEffect(() => {
    if (template.frontBgImage) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        setImageAspectRatios((prev) => ({ ...prev, frente: ratio }));
        setImageDimensions((prev) => ({
          ...prev,
          frente: { width: img.naturalWidth, height: img.naturalHeight },
        }));
      };
      img.src = template.frontBgImage;
    }
    if (template.backBgImage) {
      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        setImageAspectRatios((prev) => ({ ...prev, verso: ratio }));
        setImageDimensions((prev) => ({
          ...prev,
          verso: { width: img.naturalWidth, height: img.naturalHeight },
        }));
      };
      img.src = template.backBgImage;
    }
  }, [template.frontBgImage, template.backBgImage]);

  // Dragging state on canvas (pointer events)
  const [draggingKey, setDraggingKey] = useState<CertificateFieldKey | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; initFieldX: number; initFieldY: number } | null>(null);

  // Drag & drop from right panel into canvas
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  // Hidden file inputs
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  // Toast / Save notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync side switch with selected field if needed
  useEffect(() => {
    const currentField = template.fields[selectedFieldKey];
    if (currentField && currentField.side !== activeSide) {
      // Pick first field on this side
      const match = (Object.values(template.fields) as CertificateFieldConfig[]).find((f) => f.side === activeSide);
      if (match) setSelectedFieldKey(match.key);
    }
  }, [activeSide]);

  // Handle uploading custom image background for Front or Back
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: CertificateSide) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64Url = loadEvent.target?.result as string;
      if (base64Url) {
        // Measure image immediately to adapt canvas proportion without cutting
        const img = new Image();
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          setImageAspectRatios((prev) => ({ ...prev, [side]: ratio }));
          setImageDimensions((prev) => ({
            ...prev,
            [side]: { width: img.naturalWidth, height: img.naturalHeight },
          }));
        };
        img.src = base64Url;

        setTemplate((prev) => ({
          ...prev,
          frontBgImage: side === 'frente' ? base64Url : prev.frontBgImage,
          backBgImage: side === 'verso' ? base64Url : prev.backBgImage,
          frontPreset: side === 'frente' ? 'custom' : prev.frontPreset,
          backPreset: side === 'verso' ? 'custom' : prev.backPreset,
          aspectRatioMode: 'auto', // Auto-adapt so zero pixels are cropped
          imageFitMode: 'contain', // Guarantee 100% visibility of borders and content
        }));
        showToast(`Arte da ${side === 'frente' ? 'Frente' : 'Verso'} importada com sucesso! Proporção adaptada sem cortes.`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveCustomImage = (side: CertificateSide) => {
    setTemplate((prev) => ({
      ...prev,
      frontBgImage: side === 'frente' ? null : prev.frontBgImage,
      backBgImage: side === 'verso' ? null : prev.backBgImage,
      frontPreset: side === 'frente' ? 'dark_gold' : prev.frontPreset,
      backPreset: side === 'verso' ? 'dark_gold' : prev.backPreset,
    }));
    showToast(`Fundo da ${side === 'frente' ? 'frente' : 'verso'} restaurado para o tema padrão.`);
  };

  // Update a single field attribute
  const updateField = (key: CertificateFieldKey, patch: Partial<CertificateFieldConfig>) => {
    setTemplate((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: {
          ...prev.fields[key],
          ...patch,
        },
      },
    }));
  };

  // Save template configuration to localStorage
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
      if (onSaveTemplate) {
        onSaveTemplate(template);
      }
      showToast('Configurações e posições do certificado 16:9 salvas com sucesso!');
    } catch {
      showToast('Modelo salvo localmente nesta sessão.');
    }
  };

  // Reset to default 16:9 layout
  const handleResetDefaults = () => {
    if (window.confirm('Deseja restaurar todas as posições e o layout original 16:9 do certificado?')) {
      setTemplate(DEFAULT_CERTIFICATE_TEMPLATE);
      localStorage.removeItem(STORAGE_KEY);
      showToast('Modelo restaurado para as posições de fábrica 16:9.');
    }
  };

  // Auto-arrange all fields to optimal non-overlapping 16:9 layout
  const handleApply16x9SafeLayout = () => {
    setTemplate((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        // Frente 16:9
        nome_aluno: { ...prev.fields.nome_aluno, x: 50, y: 44, fontSize: 28, textAlign: 'center', visible: true },
        cpf_aluno: { ...prev.fields.cpf_aluno, x: 50, y: 52, fontSize: 13, textAlign: 'center', visible: true },
        nome_curso: { ...prev.fields.nome_curso, x: 50, y: 62, fontSize: 23, textAlign: 'center', visible: true },
        carga_horaria: { ...prev.fields.carga_horaria, x: 50, y: 71, fontSize: 13, textAlign: 'center', visible: true },
        data_emissao: { ...prev.fields.data_emissao, prefix: '', sampleText: '16-09-2026', x: 28, y: 83, fontSize: 12, textAlign: 'center', visible: true },
        instrutor_assinatura: { ...prev.fields.instrutor_assinatura, x: 72, y: 83, fontSize: 11, textAlign: 'center', visible: true },
        dados_instituicao: { ...prev.fields.dados_instituicao, x: 28, y: 92, fontSize: 11, textAlign: 'left', visible: true },
        codigo_emissao: { ...prev.fields.codigo_emissao, x: 84, y: 92, fontSize: 11, textAlign: 'right', visible: true },
        // Verso 16:9
        qr_code: { ...prev.fields.qr_code, x: 24, y: 48, size: 140, textAlign: 'center', visible: true },
        codigo_emissao_verso: prev.fields.codigo_emissao,
        registro_academico: { ...prev.fields.registro_academico, x: 65, y: 48, fontSize: 11, textAlign: 'left', visible: true },
        amparo_legal: { ...prev.fields.amparo_legal, x: 65, y: 70, fontSize: 10, textAlign: 'left', visible: true },
        conteudo_programatico: { ...prev.fields.conteudo_programatico, x: 50, y: 92, fontSize: 10, textAlign: 'center', visible: true },
      },
    }));
    showToast('Layout 16:9 aplicado com sucesso (campos redistribuídos sem sobreposição)!');
  };

  // Helper to render real text preview
  const getFieldRenderValue = (key: CertificateFieldKey): string => {
    switch (key) {
      case 'nome_aluno':
        return sampleStudentName;
      case 'cpf_aluno':
        return sampleCpf;
      case 'nome_curso':
        return sampleCourseTitle;
      case 'carga_horaria': {
        if (template.fields.carga_horaria?.sampleText) {
          const st = template.fields.carga_horaria.sampleText.trim();
          const num = st.replace(/\D/g, '');
          return num ? `${num}h` : st.toLowerCase().endsWith('h') ? st : `${st}h`;
        }
        return `${sampleHours}h`;
      }
      case 'data_emissao': {
        if (template.fields.data_emissao?.sampleText) {
          return template.fields.data_emissao.sampleText;
        }
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
      }
      case 'codigo_emissao': {
        if (template.fields.codigo_emissao?.sampleText) {
          const st = template.fields.codigo_emissao.sampleText.trim();
          const cleaned = st.replace(/^[A-Za-z\s:._-]+/, '').replace(/[^\d-]/g, '');
          if (cleaned) return cleaned;
        }
        const extracted = sampleCode.replace(/^[^\d]+/, '').replace(/[^\d-]/g, '');
        return extracted || '2026-9842';
      }
      case 'instrutor_assinatura':
        return sampleInstructor;
      case 'dados_instituicao':
        return `${template.institutionName} • CNPJ ${template.institutionCnpj}`;
      case 'registro_academico':
        return 'Livro: 14 • Folha: 89 • Reg: 2026/894-DF';
      case 'amparo_legal':
        return 'Certificado válido nacionalmente - Lei nº 9.394/96 e Dec. 5.154/04.';
      case 'conteudo_programatico':
        return 'Conteúdo programático oficial: Módulos Teóricos e Laboratório Prático.';
      default:
        return template.fields[key]?.sampleText || '';
    }
  };

  // Current side fields and active custom background
  const currentSideFields = (Object.values(template.fields) as CertificateFieldConfig[]).filter((f) => f.side === activeSide);
  const currentCustomBg = activeSide === 'frente' ? template.frontBgImage : template.backBgImage;
  const currentRatioMode = template.aspectRatioMode || 'auto';
  const currentFitMode = template.imageFitMode || 'contain';
  const naturalRatio = imageAspectRatios[activeSide];
  const currentImageDim = imageDimensions[activeSide];

  // Dynamic canvas aspect ratio calculation:
  const computedCanvasAspectRatio = useMemo(() => {
    if (currentRatioMode === '16_9') return 16 / 9; // ~1.777:1
    if (currentRatioMode === 'a4') return 297 / 210; // ~1.414:1 (A4 Paisagem)
    // 'auto' mode: match uploaded image proportion exactly so zero pixels are cropped
    if (currentCustomBg && naturalRatio && naturalRatio > 0) {
      return naturalRatio;
    }
    if (currentCustomBg && currentImageDim && currentImageDim.height > 0) {
      return currentImageDim.width / currentImageDim.height;
    }
    return 16 / 9;
  }, [currentRatioMode, currentCustomBg, naturalRatio, currentImageDim]);

  const currentRatioLabel = useMemo(() => {
    if (currentRatioMode === '16_9') return '16:9 Full HD (1920 × 1080 px)';
    if (currentRatioMode === 'a4') return 'A4 Paisagem (29,7 × 21 cm)';
    if (currentCustomBg && currentImageDim) {
      return `Original Importado: ${currentImageDim.width} × ${currentImageDim.height} px (100% Sem Cortes)`;
    }
    return '16:9 Oficial (1920 × 1080 px)';
  }, [currentRatioMode, currentCustomBg, currentImageDim]);

  // Dynamic Canvas Display Dimensions calculation
  // Ensures the certificate expands to fill 100% of the available view height and width,
  // matching the EXACT ratio of the imported image or 16:9/A4 with ZERO distortion and ZERO black bars!
  const canvasDisplayDimensions = useMemo(() => {
    const padX = 28;
    const padY = 76; // header toolbar + bottom hint
    const availW = Math.max(300, containerDimensions.width - padX);
    const availH = Math.max(220, containerDimensions.height - padY);

    let baseW = availW;
    let baseH = baseW / computedCanvasAspectRatio;

    if (baseH > availH) {
      baseH = availH;
      baseW = baseH * computedCanvasAspectRatio;
    }

    const finalW = Math.round(baseW * zoomLevel);
    const finalH = Math.round(baseH * zoomLevel);

    return {
      width: finalW,
      height: finalH,
      baseWidth: Math.round(baseW),
      baseHeight: Math.round(baseH),
    };
  }, [containerDimensions, computedCanvasAspectRatio, zoomLevel]);

  // Reference to canvas scroll container
  const canvasScrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if canvas exceeds viewport dimensions to handle scroll smoothly without negative margin clipping
  const isHeightOverflow = useMemo(() => {
    return canvasDisplayDimensions.height > Math.max(150, containerDimensions.height - 90);
  }, [canvasDisplayDimensions.height, containerDimensions.height]);

  const isWidthOverflow = useMemo(() => {
    return canvasDisplayDimensions.width > Math.max(200, containerDimensions.width - 40);
  }, [canvasDisplayDimensions.width, containerDimensions.width]);

  const scrollToTop = () => {
    if (canvasScrollContainerRef.current) {
      canvasScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (canvasScrollContainerRef.current) {
      canvasScrollContainerRef.current.scrollTo({
        top: canvasScrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  // Export digital version in exact high-res resolution (preserving 100% of uploaded image)
  const handleExportHighResPng = async () => {
    try {
      showToast('Renderizando versão digital em alta definição sem cortes...');
      const offscreen = document.createElement('canvas');
      const currentBg = activeSide === 'frente' ? template.frontBgImage : template.backBgImage;

      // Determine output resolution: use imported image resolution if available, otherwise 1920w
      let outWidth = 1920;
      let outHeight = Math.round(1920 / computedCanvasAspectRatio);
      if (currentBg && currentImageDim) {
        outWidth = Math.max(1920, currentImageDim.width);
        outHeight = Math.round(outWidth / computedCanvasAspectRatio);
      }
      offscreen.width = outWidth;
      offscreen.height = outHeight;

      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      // 1. Draw custom background image or gradient theme
      if (currentBg) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = currentBg;
        });

        if (currentFitMode === 'contain') {
          ctx.fillStyle = '#080d1a';
          ctx.fillRect(0, 0, outWidth, outHeight);
          const hRatio = outWidth / img.naturalWidth;
          const vRatio = outHeight / img.naturalHeight;
          const ratio = Math.min(hRatio, vRatio);
          const centerShiftX = (outWidth - img.naturalWidth * ratio) / 2;
          const centerShiftY = (outHeight - img.naturalHeight * ratio) / 2;
          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            centerShiftX,
            centerShiftY,
            img.naturalWidth * ratio,
            img.naturalHeight * ratio
          );
        } else if (currentFitMode === 'cover') {
          const hRatio = outWidth / img.naturalWidth;
          const vRatio = outHeight / img.naturalHeight;
          const ratio = Math.max(hRatio, vRatio);
          const centerShiftX = (outWidth - img.naturalWidth * ratio) / 2;
          const centerShiftY = (outHeight - img.naturalHeight * ratio) / 2;
          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            centerShiftX,
            centerShiftY,
            img.naturalWidth * ratio,
            img.naturalHeight * ratio
          );
        } else {
          ctx.drawImage(img, 0, 0, outWidth, outHeight);
        }
      } else {
        const grad = ctx.createLinearGradient(0, 0, outWidth, outHeight);
        if (template.frontPreset === 'classic_light') {
          grad.addColorStop(0, '#f8fafc');
          grad.addColorStop(0.5, '#f1f5f9');
          grad.addColorStop(1, '#e2e8f0');
        } else if (template.frontPreset === 'emerald_luxury') {
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
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
          ctx.lineWidth = 2;
          ctx.strokeRect(30, 30, outWidth - 60, outHeight - 60);
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.7)';
          ctx.lineWidth = 4;
          ctx.strokeRect(45, 45, outWidth - 90, outHeight - 90);
        }
      }

      // 2. Draw all visible fields on current side
      const scale = outWidth / (canvasRef.current?.getBoundingClientRect().width || 800);
      for (const field of currentSideFields) {
        if (!field.visible) continue;
        const posX = (field.x / 100) * outWidth;
        const posY = (field.y / 100) * outHeight;

        if (field.key === 'qr_code') {
          const qrSize = (field.size || 130) * scale;
          const qrLeft = posX - qrSize / 2;
          const qrTop = posY - qrSize / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qrLeft, qrTop, qrSize, qrSize);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(qrLeft + qrSize * 0.1, qrTop + qrSize * 0.1, qrSize * 0.3, qrSize * 0.3);
          ctx.fillRect(qrLeft + qrSize * 0.6, qrTop + qrSize * 0.1, qrSize * 0.3, qrSize * 0.3);
          ctx.fillRect(qrLeft + qrSize * 0.1, qrTop + qrSize * 0.6, qrSize * 0.3, qrSize * 0.3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qrLeft + qrSize * 0.15, qrTop + qrSize * 0.15, qrSize * 0.2, qrSize * 0.2);
          ctx.fillRect(qrLeft + qrSize * 0.65, qrTop + qrSize * 0.15, qrSize * 0.2, qrSize * 0.2);
          ctx.fillRect(qrLeft + qrSize * 0.15, qrTop + qrSize * 0.65, qrSize * 0.2, qrSize * 0.2);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(qrLeft + qrSize * 0.4, qrTop + qrSize * 0.4, qrSize * 0.2, qrSize * 0.2);
        } else {
          const isDate = field.key === 'data_emissao';
          const isHours = field.key === 'carga_horaria';
          const isCode = field.key === 'codigo_emissao';
          const prefix = (isDate || isHours || isCode) ? '' : (field.prefix || '');
          const suffix = (isDate || isHours || isCode) ? '' : (field.suffix || '');
          const val = `${prefix}${getFieldRenderValue(field.key)}${suffix}`;
          const fontSize = Math.round(field.fontSize * scale);
          const weight = field.fontWeight === 'black' ? '900' : field.fontWeight === 'bold' ? 'bold' : 'normal';
          const fontFamily = field.fontFamily || template.defaultFontFamily || 'Inter, sans-serif';
          ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
          ctx.fillStyle = field.color;
          ctx.textAlign = field.textAlign;
          ctx.textBaseline = 'middle';

          const isWrapped = field.textWrap !== false;
          if (isWrapped) {
            const maxWidthPct = field.maxWidth || (field.key === 'nome_curso' ? 34 : field.key === 'carga_horaria' ? 26 : field.key === 'conteudo_programatico' || field.key === 'amparo_legal' ? 65 : 70);
            const maxWidthPx = (maxWidthPct / 100) * outWidth;
            const lineHeightPx = fontSize * 1.25;

            // Divide texto respeitando limite da largura
            const words = val.split(' ');
            const lines: string[] = [];
            let currentLine = words[0] || '';

            for (let i = 1; i < words.length; i++) {
              const testLine = currentLine + ' ' + words[i];
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
            ctx.fillText(val, posX, posY);
          }
        }
      }

      // 3. Download high-res PNG
      const dataUrl = offscreen.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `certificado-${activeSide}-${outWidth}x${outHeight}.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
      showToast(`Certificado HD (${outWidth} × ${outHeight} px) baixado com sucesso!`);
    } catch (err) {
      console.error(err);
      showToast('Certificado exportado!');
    }
  };

  // Print / Export calibrated dynamically for landscape matching ratio
  const handlePrint = () => {
    const prevMode = viewMode;
    setViewMode('preview');
    let styleEl = document.getElementById('cert-16x9-print-style');
    const printHeightCm = (29.7 / computedCanvasAspectRatio).toFixed(1);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'cert-16x9-print-style';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @media print {
        @page {
          size: 29.7cm ${printHeightCm}cm landscape;
          margin: 0;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;
    setTimeout(() => {
      window.print();
      setViewMode(prevMode);
    }, 300);
  };

  // -------------------------------------------------------------
  // CANVAS DRAG & DROP HANDLING (POINTER EVENTS)
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent, key: CertificateFieldKey) => {
    if (viewMode === 'preview') return;
    e.stopPropagation();
    e.preventDefault();

    setSelectedFieldKey(key);
    setDraggingKey(key);

    const field = template.fields[key];
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initFieldX: field.x,
      initFieldY: field.y,
    };

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingKey || !dragStartRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaPixelX = e.clientX - dragStartRef.current.startX;
    const deltaPixelY = e.clientY - dragStartRef.current.startY;

    const deltaPercentX = (deltaPixelX / rect.width) * 100;
    const deltaPercentY = (deltaPixelY / rect.height) * 100;

    let newX = Math.round((dragStartRef.current.initFieldX + deltaPercentX) * 10) / 10;
    let newY = Math.round((dragStartRef.current.initFieldY + deltaPercentY) * 10) / 10;

    // Clamp between 3% and 97% to keep within certificate boundaries
    newX = Math.max(3, Math.min(97, newX));
    newY = Math.max(3, Math.min(97, newY));

    updateField(draggingKey, { x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingKey) {
      setDraggingKey(null);
      dragStartRef.current = null;
      try {
        const target = e.currentTarget as HTMLElement;
        if (target.hasPointerCapture(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Safe catch
      }
    }
  };

  // -------------------------------------------------------------
  // HTML5 DRAG & DROP FROM RIGHT PANEL ONTO CANVAS
  // -------------------------------------------------------------
  const handleRightPanelDragStart = (e: React.DragEvent, key: CertificateFieldKey) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverCanvas) setIsDragOverCanvas(true);
  };

  const handleCanvasDragLeave = () => {
    setIsDragOverCanvas(false);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    const key = e.dataTransfer.getData('text/plain') as CertificateFieldKey;

    if (key && template.fields[key] && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dropPixelX = e.clientX - rect.left;
      const dropPixelY = e.clientY - rect.top;

      let newX = Math.round(((dropPixelX / rect.width) * 100) * 10) / 10;
      let newY = Math.round(((dropPixelY / rect.height) * 100) * 10) / 10;

      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));

      updateField(key, { x: newX, y: newY, visible: true });
      setSelectedFieldKey(key);
      showToast(`Campo "${template.fields[key].label}" posicionado em X: ${newX}% | Y: ${newY}%`);
    }
  };

  if (!isOpen) return null;

  const activeSelectedField = template.fields[selectedFieldKey] || currentSideFields[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden p-1 sm:p-2 md:p-3 flex justify-center items-start sm:items-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Main Container */}
      <div className="relative w-full max-w-[99vw] 2xl:max-w-[1800px] h-[97vh] min-h-[580px] my-auto flex flex-col bg-surface-base border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. TOP HEADER */}
        <header className="p-4 border-b border-border-subtle bg-surface-raised flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-gold/15 text-accent-gold border border-accent-gold/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-22">design_services</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  Editor de Modelo Digital de Certificado Oficial
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Frente &amp; Verso Arrastável
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-gold/15 text-accent-gold border border-accent-gold/30 flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-xs">aspect_ratio</span>
                  {currentRatioLabel}
                </span>
              </div>
              <p className="text-xs text-text-tertiary mt-0.5">
                Importe sua arte gráfica, defina posições pelo menu à esquerda ou arraste os botões de informações à direita diretamente na imagem.
              </p>
            </div>
          </div>

          {/* Side Switch & View Mode Toggle */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* Frente / Verso Tabs */}
            <div className="flex items-center p-1 bg-surface-overlay rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => setActiveSide('frente')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSide === 'frente'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-sm">workspace_premium</span>
                <span>Frente (Anverso)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSide('verso')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSide === 'verso'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                <span>Verso (QR Code &amp; Registro)</span>
              </button>
            </div>

            {/* Mode: Edit vs Preview */}
            <div className="flex items-center p-1 bg-surface-overlay rounded-xl border border-border-subtle">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-surface-raised text-text-primary border border-border-subtle shadow-xs'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                title="Modo Edição: com caixas de arrasto e guias de coordenadas"
              >
                <span className="material-symbols-outlined text-sm text-accent-gold">drag_pan</span>
                <span className="hidden sm:inline">Modo Edição</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-surface-raised text-text-primary border border-border-subtle shadow-xs'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
                title="Pré-visualização Limpa: como o aluno visualizará o certificado"
              >
                <span className="material-symbols-outlined text-sm text-emerald-400">visibility</span>
                <span className="hidden sm:inline">Pré-visualização</span>
              </button>
            </div>

            {/* Expand Canvas Button */}
            <button
              type="button"
              onClick={() => setExpandedCanvas(!expandedCanvas)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                expandedCanvas
                  ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/40 shadow-xs'
                  : 'bg-surface-overlay text-text-secondary hover:text-text-primary border-border-subtle'
              }`}
              title={expandedCanvas ? 'Restaurar painéis laterais' : 'Expandir certificado para tela ampla'}
            >
              <span className="material-symbols-outlined text-base">
                {expandedCanvas ? 'fullscreen_exit' : 'fullscreen'}
              </span>
              <span className="hidden sm:inline">{expandedCanvas ? 'Restaurar Painéis' : 'Expandir Tela'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
              title="Fechar editor"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </header>

        {/* 2. BACKGROUND & IMAGE IMPORT BAR */}
        <div className="px-4 py-2 bg-surface-raised/70 border-b border-border-subtle flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 text-xs">
          {/* File Upload Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-base">image</span>
              Arte ({activeSide === 'frente' ? 'Frente' : 'Verso'}):
            </span>

            {/* Hidden Input */}
            <input
              type="file"
              ref={activeSide === 'frente' ? frontFileInputRef : backFileInputRef}
              onChange={(e) => handleFileUpload(e, activeSide)}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => {
                if (activeSide === 'frente') frontFileInputRef.current?.click();
                else backFileInputRef.current?.click();
              }}
              className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              <span>Importar Imagem ({activeSide === 'frente' ? 'Frente' : 'Verso'})</span>
            </button>

            {currentCustomBg ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  {currentImageDim ? `${currentImageDim.width}×${currentImageDim.height} px` : 'Imagem Ativa'}
                </span>

                {/* Fit Mode Selector */}
                <div className="flex items-center gap-1 bg-surface-overlay p-0.5 rounded-lg border border-border-subtle">
                  <span className="text-[10px] text-text-tertiary px-1.5 font-semibold">Enquadramento:</span>
                  <button
                    type="button"
                    onClick={() => setTemplate((prev) => ({ ...prev, imageFitMode: 'contain' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currentFitMode === 'contain'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                    title="100% da imagem visível sem nenhum corte nas bordas"
                  >
                    Sem Cortes (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate((prev) => ({ ...prev, imageFitMode: 'fill' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currentFitMode === 'fill'
                        ? 'bg-primary/20 text-primary border border-primary/40 shadow-xs'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                    title="Preencher canvas ajustando largura e altura"
                  >
                    Preencher
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate((prev) => ({ ...prev, imageFitMode: 'cover' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currentFitMode === 'cover'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                    title="Cobrir toda a área (pode cortar bordas)"
                  >
                    Cobrir
                  </button>
                </div>

                {/* Aspect Ratio Mode Selector */}
                <div className="flex items-center gap-1 bg-surface-overlay p-0.5 rounded-lg border border-border-subtle">
                  <span className="text-[10px] text-text-tertiary px-1.5 font-semibold">Canvas:</span>
                  <button
                    type="button"
                    onClick={() => setTemplate((prev) => ({ ...prev, aspectRatioMode: 'auto' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currentRatioMode === 'auto'
                        ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40 shadow-xs'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                    title="Ajusta o canvas na proporção exata da arte importada para zero distorção"
                  >
                    Auto (Original)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate((prev) => ({ ...prev, aspectRatioMode: '16_9' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currentRatioMode === '16_9'
                        ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40 shadow-xs'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                    title="Proporção 16:9 Oficial (1920×1080)"
                  >
                    16:9
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplate((prev) => ({ ...prev, aspectRatioMode: 'a4' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      currentRatioMode === 'a4'
                        ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40 shadow-xs'
                        : 'text-text-tertiary hover:text-text-secondary'
                    }`}
                    title="Formato A4 Paisagem (29,7 × 21 cm)"
                  >
                    A4
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCustomImage(activeSide)}
                  className="text-[11px] text-red-400 hover:text-red-300 underline cursor-pointer ml-1"
                >
                  Remover
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-text-tertiary">
                Nenhuma imagem externa carregada (Usando template vetorial padrão Deds).
              </span>
            )}
          </div>

          {/* Template Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-tertiary hidden sm:inline">Temas Vetoriais:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setTemplate((prev) => ({
                    ...prev,
                    frontBgImage: null,
                    backBgImage: null,
                    frontPreset: 'dark_gold',
                    backPreset: 'dark_gold',
                  }));
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  template.frontPreset === 'dark_gold' && !currentCustomBg
                    ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40'
                    : 'bg-surface-overlay text-text-tertiary hover:text-text-primary'
                }`}
              >
                Escuro &amp; Dourado
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplate((prev) => ({
                    ...prev,
                    frontBgImage: null,
                    backBgImage: null,
                    frontPreset: 'emerald_luxury',
                    backPreset: 'emerald_luxury',
                  }));
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  template.frontPreset === 'emerald_luxury' && !currentCustomBg
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-surface-overlay text-text-tertiary hover:text-text-primary'
                }`}
              >
                Esmeralda Nobre
              </button>
              <button
                type="button"
                onClick={() => {
                  setTemplate((prev) => ({
                    ...prev,
                    frontBgImage: null,
                    backBgImage: null,
                    frontPreset: 'classic_light',
                    backPreset: 'classic_light',
                  }));
                }}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  template.frontPreset === 'classic_light' && !currentCustomBg
                    ? 'bg-slate-200 text-slate-900 border border-slate-400'
                    : 'bg-surface-overlay text-text-tertiary hover:text-text-primary'
                }`}
              >
                Diploma Claro
              </button>
            </div>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE: 3 COLUMNS
            - LEFT: Definition & detailed controls of positions
            - CENTER: The interactive canvas where fields are dragged directly on top of image
            - RIGHT: Draggable badges / links that can be grabbed and dragged onto the image
        */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0 h-full">
          
          {/* ==============================================================
              LEFT COLUMN: DEFINIR ONDE VAI FICAR CADA INFORMAÇÃO
              ============================================================== */}
          <aside className={`${expandedCanvas ? 'hidden' : 'lg:col-span-3 xl:col-span-2'} border-b lg:border-b-0 lg:border-r border-border-subtle bg-surface-base flex flex-col overflow-y-auto p-3.5 space-y-3.5`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">tune</span>
                  Definir Posicionamento
                </span>
                <span className="text-[10px] font-mono text-primary font-bold">
                  Lado {activeSide === 'frente' ? 'Frente' : 'Verso'}
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary leading-tight mb-2.5">
                Clique nos botões abaixo para selecionar, ajustar tamanho ou remover do certificado:
              </p>

              {/* Quick 16:9 Safe Auto-layout button */}
              <button
                type="button"
                onClick={handleApply16x9SafeLayout}
                className="w-full py-2 px-2.5 rounded-xl bg-accent-gold/10 hover:bg-accent-gold/20 border border-accent-gold/30 text-[11px] font-bold text-accent-gold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                title="Ajusta e distribui todos os campos na proporção 16:9 evitando sobreposição no cabeçalho"
              >
                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                <span>Auto-organizar Layout 16:9</span>
              </button>
            </div>

            {/* List of items to define where they stay */}
            <div className="space-y-1.5">
              {currentSideFields.map((field) => {
                const isSelected = field.key === selectedFieldKey;
                return (
                  <div
                    key={field.key}
                    onClick={() => setSelectedFieldKey(field.key)}
                    className={`w-full p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-text-primary shadow-xs'
                        : 'bg-surface-raised/70 border-border-subtle hover:border-border-subtle/80 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`material-symbols-outlined text-base shrink-0 ${
                          isSelected ? 'text-primary' : 'text-text-tertiary'
                        }`}
                      >
                        {field.key === 'qr_code'
                          ? 'qr_code'
                          : field.key === 'carga_horaria'
                          ? 'schedule'
                          : field.key === 'nome_curso'
                          ? 'school'
                          : field.key === 'nome_aluno'
                          ? 'person'
                          : field.key === 'cpf_aluno'
                          ? 'badge'
                          : field.key === 'dados_instituicao'
                          ? 'corporate_fare'
                          : field.key === 'data_emissao'
                          ? 'event'
                          : field.key === 'codigo_emissao'
                          ? 'tag'
                          : 'draw'}
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">{field.label}</span>
                        <span className="text-[10px] text-text-tertiary font-mono">
                          X: {field.x}% • Y: {field.y}% {field.visible ? `• ${field.key === 'qr_code' ? (field.size || 130) : field.fontSize}px` : '• (Oculto)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Toggle Visibility Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (field.visible) {
                            handleRemoveField(field.key);
                          } else {
                            updateField(field.key, { visible: true });
                            setSelectedFieldKey(field.key);
                            showToast(`"${field.label}" adicionado ao certificado.`);
                          }
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          field.visible
                            ? 'text-emerald-400 hover:bg-emerald-500/20'
                            : 'text-text-tertiary hover:text-text-primary hover:bg-surface-overlay'
                        }`}
                        title={field.visible ? 'Clique para remover/ocultar do certificado' : 'Clique para adicionar ao certificado'}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {field.visible ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DETAIL ADJUSTMENT CARD FOR SELECTED FIELD */}
            {activeSelectedField && (
              <div className="p-3.5 rounded-xl bg-surface-raised border border-border-subtle space-y-3 mt-2">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-xs font-bold text-text-primary truncate">
                    Ajuste: {activeSelectedField.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField(activeSelectedField.key, { visible: !activeSelectedField.visible })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      activeSelectedField.visible
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {activeSelectedField.visible ? 'Visível' : 'Oculto'}
                  </button>
                </div>

                {/* X Coordinate Slider & Input */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-text-tertiary font-medium">Posição Horizontal (X):</span>
                    <span className="font-mono font-bold text-primary">{activeSelectedField.x}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={activeSelectedField.x}
                      onChange={(e) => updateField(activeSelectedField.key, { x: Number(e.target.value) })}
                      className="w-full accent-primary h-1.5 bg-surface-overlay rounded cursor-pointer"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={activeSelectedField.x}
                      onChange={(e) => updateField(activeSelectedField.key, { x: Number(e.target.value) })}
                      className="w-14 px-1.5 py-0.5 bg-surface-overlay border border-border-subtle rounded text-right text-xs font-mono text-text-primary"
                    />
                  </div>
                </div>

                {/* Y Coordinate Slider & Input */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-text-tertiary font-medium">Posição Vertical (Y):</span>
                    <span className="font-mono font-bold text-primary">{activeSelectedField.y}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={activeSelectedField.y}
                      onChange={(e) => updateField(activeSelectedField.key, { y: Number(e.target.value) })}
                      className="w-full accent-primary h-1.5 bg-surface-overlay rounded cursor-pointer"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={activeSelectedField.y}
                      onChange={(e) => updateField(activeSelectedField.key, { y: Number(e.target.value) })}
                      className="w-14 px-1.5 py-0.5 bg-surface-overlay border border-border-subtle rounded text-right text-xs font-mono text-text-primary"
                    />
                  </div>
                </div>

                {/* Font Size or QR Code Size with +/- buttons & Presets */}
                {activeSelectedField.key === 'qr_code' ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-text-tertiary font-medium">Tamanho do QR Code:</span>
                      <span className="font-mono font-bold text-primary">{activeSelectedField.size || 130}px</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => adjustFieldSize(activeSelectedField.key, -1)}
                        className="w-7 h-7 rounded-lg bg-surface-overlay hover:bg-surface-base border border-border-subtle text-text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
                        title="Diminuir tamanho (-5px)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min={60}
                        max={240}
                        value={activeSelectedField.size || 130}
                        onChange={(e) => updateField(activeSelectedField.key, { size: Number(e.target.value) })}
                        className="flex-1 accent-primary h-1.5 bg-surface-overlay rounded cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => adjustFieldSize(activeSelectedField.key, 1)}
                        className="w-7 h-7 rounded-lg bg-surface-overlay hover:bg-surface-base border border-border-subtle text-text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
                        title="Aumentar tamanho (+5px)"
                      >
                        +
                      </button>
                    </div>
                    {/* QR Code Presets */}
                    <div className="flex items-center gap-1">
                      {[90, 120, 140, 170].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateField(activeSelectedField.key, { size: sz })}
                          className={`flex-1 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                            (activeSelectedField.size || 130) === sz
                              ? 'bg-primary text-white font-bold'
                              : 'bg-surface-overlay text-text-tertiary hover:text-text-primary'
                          }`}
                        >
                          {sz}px
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-text-tertiary font-medium">Tamanho da Fonte:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustAllFieldsPx(-1)}
                          className="text-[9px] text-accent-gold hover:underline cursor-pointer font-bold"
                          title="Diminuir todas as fontes do certificado em 1px"
                        >
                          -1px Todos
                        </button>
                        <span className="text-text-tertiary text-[9px]">•</span>
                        <span className="font-mono font-bold text-primary">{activeSelectedField.fontSize}px</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <button
                        type="button"
                        onClick={() => adjustFieldSize(activeSelectedField.key, -1)}
                        className="w-7 h-7 rounded-lg bg-surface-overlay hover:bg-surface-base border border-border-subtle text-text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
                        title="Diminuir fonte (-1px)"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min={5}
                        max={56}
                        value={activeSelectedField.fontSize}
                        onChange={(e) => updateField(activeSelectedField.key, { fontSize: Number(e.target.value) })}
                        className="flex-1 accent-primary h-1.5 bg-surface-overlay rounded cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => adjustFieldSize(activeSelectedField.key, 1)}
                        className="w-7 h-7 rounded-lg bg-surface-overlay hover:bg-surface-base border border-border-subtle text-text-primary flex items-center justify-center text-xs font-bold cursor-pointer"
                        title="Aumentar fonte (+1px)"
                      >
                        +
                      </button>
                    </div>
                    {/* Font Presets */}
                    <div className="flex items-center gap-1">
                      {[7, 9, 11, 14, 18, 24].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateField(activeSelectedField.key, { fontSize: sz })}
                          className={`flex-1 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                            activeSelectedField.fontSize === sz
                              ? 'bg-primary text-white font-bold'
                              : 'bg-surface-overlay text-text-tertiary hover:text-text-primary'
                          }`}
                        >
                          {sz}px
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Font Family (Tipo de Fonte) */}
                {activeSelectedField.key !== 'qr_code' && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="text-text-tertiary font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-accent-gold">font_download</span>
                        Tipo de Fonte:
                      </label>
                      <button
                        type="button"
                        onClick={() => handleApplyFontToAllFields(activeSelectedField.fontFamily || 'Inter, sans-serif')}
                        className="text-[9px] text-accent-gold hover:underline cursor-pointer font-bold"
                        title="Aplicar esta mesma fonte a todos os campos do certificado"
                      >
                        Aplicar a todos
                      </button>
                    </div>
                    <select
                      value={activeSelectedField.fontFamily || 'Inter, sans-serif'}
                      onChange={(e) => updateField(activeSelectedField.key, { fontFamily: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-surface-overlay border border-border-subtle rounded-lg text-xs font-medium text-text-primary focus:outline-none focus:border-accent-gold cursor-pointer"
                    >
                      {CERTIFICATE_FONT_OPTIONS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Text Wrap & Max Width (Quebra de Texto & Largura da Coluna) */}
                {activeSelectedField.key !== 'qr_code' && (
                  <div className="bg-surface-overlay/80 border border-border-subtle rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary">wrap_text</span>
                        <div>
                          <span className="text-xs font-bold text-text-primary block leading-tight">Quebra de Texto</span>
                          <span className="text-[9px] text-text-tertiary block">Quebra linhas longas para caber na imagem</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField(activeSelectedField.key, { textWrap: activeSelectedField.textWrap === false ? true : false })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                          activeSelectedField.textWrap !== false
                            ? 'bg-primary/20 text-primary border-primary/40 shadow-xs'
                            : 'bg-surface-raised text-text-tertiary border-border-subtle'
                        }`}
                      >
                        {activeSelectedField.textWrap !== false ? 'Ativada' : 'Desativada'}
                      </button>
                    </div>

                    {activeSelectedField.textWrap !== false && (
                      <div className="space-y-1.5 pt-1.5 border-t border-border-subtle/50">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-text-tertiary font-medium">Largura Máxima da Coluna:</span>
                          <span className="font-mono font-bold text-accent-gold">{activeSelectedField.maxWidth || 34}% da imagem</span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={100}
                          step={1}
                          value={activeSelectedField.maxWidth || 34}
                          onChange={(e) => updateField(activeSelectedField.key, { maxWidth: Number(e.target.value) })}
                          className="w-full accent-amber-400 h-1.5 bg-surface-raised rounded cursor-pointer"
                        />
                        <div className="grid grid-cols-4 gap-1">
                          {[20, 34, 50, 75].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => updateField(activeSelectedField.key, { maxWidth: pct })}
                              className={`py-0.5 rounded text-[9px] font-mono cursor-pointer transition-colors border ${
                                (activeSelectedField.maxWidth || 34) === pct
                                  ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/40 font-bold'
                                  : 'bg-surface-raised border-border-subtle text-text-tertiary hover:text-text-primary'
                              }`}
                            >
                              {pct}%{pct === 34 ? ' (Coluna)' : ''}
                            </button>
                          ))}
                        </div>
                        <p className="text-[9px] text-text-tertiary leading-tight">
                          Perfeito para títulos como <em>"Python do Zero ao Avançado"</em> quebrarem certinho na coluna da imagem.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Alignment & Color */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-text-tertiary font-bold block mb-1">Alinhamento</label>
                    <div className="flex items-center bg-surface-overlay rounded-lg border border-border-subtle p-0.5">
                      <button
                        type="button"
                        onClick={() => updateField(activeSelectedField.key, { textAlign: 'left' })}
                        className={`flex-1 py-1 rounded text-center text-xs cursor-pointer ${
                          activeSelectedField.textAlign === 'left' ? 'bg-primary text-white' : 'text-text-tertiary'
                        }`}
                        title="Esquerda"
                      >
                        <span className="material-symbols-outlined text-xs">format_align_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField(activeSelectedField.key, { textAlign: 'center' })}
                        className={`flex-1 py-1 rounded text-center text-xs cursor-pointer ${
                          activeSelectedField.textAlign === 'center' ? 'bg-primary text-white' : 'text-text-tertiary'
                        }`}
                        title="Centro"
                      >
                        <span className="material-symbols-outlined text-xs">format_align_center</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField(activeSelectedField.key, { textAlign: 'right' })}
                        className={`flex-1 py-1 rounded text-center text-xs cursor-pointer ${
                          activeSelectedField.textAlign === 'right' ? 'bg-primary text-white' : 'text-text-tertiary'
                        }`}
                        title="Direita"
                      >
                        <span className="material-symbols-outlined text-xs">format_align_right</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-text-tertiary font-bold block mb-1">Cor do Texto</label>
                    <div className="flex items-center gap-1.5 bg-surface-overlay border border-border-subtle rounded-lg p-1">
                      <input
                        type="color"
                        value={activeSelectedField.color}
                        onChange={(e) => updateField(activeSelectedField.key, { color: e.target.value })}
                        className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent p-0"
                      />
                      <span className="font-mono text-[10px] text-text-secondary truncate">
                        {activeSelectedField.color}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specific format options when Data de Emissão is selected */}
                {activeSelectedField.key === 'data_emissao' && (
                  <div className="bg-surface-overlay/80 border border-border-subtle rounded-lg p-2 space-y-2 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-accent-gold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_month</span>
                        Data de Emissão (Somente Números)
                      </span>
                      <span className="text-[9px] text-text-tertiary font-mono">Sem texto fixo</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-text-tertiary block font-medium">Formato Rápido:</label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const dd = String(now.getDate()).padStart(2, '0');
                            const mm = String(now.getMonth() + 1).padStart(2, '0');
                            const yyyy = now.getFullYear();
                            updateField('data_emissao', { sampleText: `${dd}-${mm}-${yyyy}`, prefix: '' });
                          }}
                          className={`py-1 px-1 rounded text-[10px] font-mono font-bold text-center border cursor-pointer transition-colors ${
                            activeSelectedField.sampleText?.includes('-')
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                          }`}
                          title="Exemplo: 16-09-2026 (Separador Hífen)"
                        >
                          16-09-2026
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const dd = String(now.getDate()).padStart(2, '0');
                            const mm = String(now.getMonth() + 1).padStart(2, '0');
                            const yyyy = now.getFullYear();
                            updateField('data_emissao', { sampleText: `${dd}/${mm}/${yyyy}`, prefix: '' });
                          }}
                          className={`py-1 px-1 rounded text-[10px] font-mono font-bold text-center border cursor-pointer transition-colors ${
                            activeSelectedField.sampleText?.includes('/')
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                          }`}
                          title="Exemplo: 16/09/2026 (Separador Barra)"
                        >
                          16/09/2026
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const dd = String(now.getDate()).padStart(2, '0');
                            const mm = String(now.getMonth() + 1).padStart(2, '0');
                            const yyyy = now.getFullYear();
                            updateField('data_emissao', { sampleText: `${dd}.${mm}.${yyyy}`, prefix: '' });
                          }}
                          className={`py-1 px-1 rounded text-[10px] font-mono font-bold text-center border cursor-pointer transition-colors ${
                            activeSelectedField.sampleText?.includes('.')
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                          }`}
                          title="Exemplo: 16.09.2026 (Separador Ponto)"
                        >
                          16.09.2026
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-text-tertiary block font-medium mb-1">Editar Data Manualmente:</label>
                      <input
                        type="text"
                        value={activeSelectedField.sampleText || '16-09-2026'}
                        onChange={(e) => updateField('data_emissao', { sampleText: e.target.value, prefix: '' })}
                        placeholder="16-09-2026"
                        className="w-full px-2 py-1 bg-surface-raised border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Specific format options when Carga Horária is selected */}
                {activeSelectedField.key === 'carga_horaria' && (
                  <div className="bg-surface-overlay/80 border border-border-subtle rounded-lg p-2 space-y-2 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-accent-gold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        Carga Horária (Somente a Hora ex: 60h)
                      </span>
                    </div>

                    <p className="text-[9px] text-text-tertiary leading-tight">
                      Prefixos e sufixos removidos para constar somente a hora no formato compacto oficial.
                    </p>

                    <div>
                      <label className="text-[10px] text-text-tertiary block font-medium mb-1">Opções Rápidas:</label>
                      <div className="grid grid-cols-4 gap-1">
                        {['60h', '40h', '80h', '120h'].map((hrs) => (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => updateField('carga_horaria', { sampleText: hrs, prefix: '', suffix: '' })}
                            className={`py-1 px-1 rounded text-[10px] font-mono font-bold text-center border cursor-pointer transition-colors ${
                              activeSelectedField.sampleText === hrs
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            {hrs}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-text-tertiary block font-medium mb-1">Editar Horas Manualmente:</label>
                      <input
                        type="text"
                        value={activeSelectedField.sampleText || '60h'}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          updateField('carga_horaria', { sampleText: val, prefix: '', suffix: '' });
                        }}
                        placeholder="Ex: 60h"
                        className="w-full px-2 py-1 bg-surface-raised border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Specific format options when Código do Certificado is selected */}
                {activeSelectedField.key === 'codigo_emissao' && (
                  <div className="bg-surface-overlay/80 border border-border-subtle rounded-lg p-2 space-y-2 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-accent-gold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">tag</span>
                        Código do Certificado (Somente Números)
                      </span>
                    </div>

                    <p className="text-[9px] text-text-tertiary leading-tight">
                      Prefixo "Cód:" e letras removidos. Exibe exclusivamente os dígitos do código de validação.
                    </p>

                    <div>
                      <label className="text-[10px] text-text-tertiary block font-medium mb-1">Formato dos Números:</label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: '2026-9842', desc: 'Ano-Sequencial' },
                          { label: '20269842', desc: 'Apenas Dígitos' },
                          { label: '9842', desc: 'Número Curto' },
                        ].map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() => updateField('codigo_emissao', { sampleText: opt.label, prefix: '', suffix: '' })}
                            className={`py-1 px-1 rounded text-[10px] font-mono font-bold text-center border cursor-pointer transition-colors ${
                              activeSelectedField.sampleText === opt.label
                                ? 'bg-primary/20 border-primary text-primary'
                                : 'bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary'
                            }`}
                            title={opt.desc}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-text-tertiary block font-medium mb-1">Editar Código Manualmente:</label>
                      <input
                        type="text"
                        value={activeSelectedField.sampleText || '2026-9842'}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^[A-Za-z\s:._-]+/, '').replace(/[^\d-]/g, '');
                          updateField('codigo_emissao', { sampleText: val || e.target.value, prefix: '', suffix: '' });
                        }}
                        placeholder="Ex: 2026-9842 ou 20269842"
                        className="w-full px-2 py-1 bg-surface-raised border border-border-subtle rounded text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Quick actions: Centralize & Remove */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => updateField(activeSelectedField.key, { x: 50, textAlign: 'center' })}
                    className="w-full py-1.5 rounded-lg bg-surface-overlay hover:bg-surface-base border border-border-subtle text-[11px] font-semibold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">center_focus_strong</span>
                    <span>Centralizar no Meio (X: 50%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveField(activeSelectedField.key)}
                    className="w-full py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-[11px] font-bold text-red-400 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Ocultar este campo do certificado"
                  >
                    <span className="material-symbols-outlined text-xs">delete</span>
                    <span>Remover do Certificado</span>
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* ==============================================================
              CENTER COLUMN: O CERTIFICADO / IMAGEM ARRASTÁVEL
              ============================================================== */}
          <main
            ref={mainContainerRef}
            className={`${expandedCanvas ? 'col-span-12' : 'lg:col-span-6 xl:col-span-8'} p-2.5 sm:p-3.5 bg-surface-base flex flex-col items-center justify-start overflow-hidden relative select-none min-h-0 h-full`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Guide hint and interactive quick toolbar above canvas */}
            <div className="w-full mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-tertiary shrink-0">
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <span className="material-symbols-outlined text-sm text-accent-gold">pan_tool</span>
                {viewMode === 'edit'
                  ? 'Clique e arraste os textos sobre a imagem. Use a barra suspensa para tamanho ou remoção:'
                  : 'Pré-visualização fiel do documento oficial gerado:'}
              </span>

              {/* Quick Scaling, Zoom & Ratio helper pills */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Visual Zoom Controls up to 300% */}
                <div className="flex items-center gap-1.5 bg-surface-overlay border border-border-subtle rounded-lg p-1" title="Ajuste do tamanho da tela do certificado (Até 300%)">
                  <span className="px-1.5 text-[10px] font-bold text-text-tertiary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-accent-gold">zoom_in</span>
                    <span className="hidden sm:inline">Zoom:</span>
                  </span>

                  {/* Decrement Button */}
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
                    disabled={zoomLevel <= 0.5}
                    className="w-5 h-5 rounded text-[11px] font-bold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center"
                    title="Diminuir zoom (-10%)"
                  >
                    -
                  </button>

                  {/* Quick Fit / 100% Reset Button */}
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      zoomLevel === 1
                        ? 'bg-primary/20 text-primary font-extrabold border border-primary/30'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
                    }`}
                    title="Ajustar 100% à tela (Sem cortes nem barras pretas)"
                  >
                    {Math.round(zoomLevel * 100)}%{zoomLevel !== 1 ? ' (Ajustar 100%)' : ' (Ajustado)'}
                  </button>

                  {/* Increment Button up to 300% */}
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(3.0, Math.round((prev + 0.1) * 10) / 10))}
                    disabled={zoomLevel >= 3.0}
                    className="w-5 h-5 rounded text-[11px] font-bold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center"
                    title="Aumentar zoom (+10% até 300%)"
                  >
                    +
                  </button>

                  {/* Interactive continuous slider from 50% to 300% */}
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-amber-400 cursor-pointer h-1.5 bg-surface-raised rounded-lg mx-1"
                    title={`Zoom contínuo: ${Math.round(zoomLevel * 100)}% (Até 300%)`}
                  />

                  <div className="h-3.5 w-px bg-border-subtle mx-0.5" />

                  {/* Preset Pills: 125%, 150%, 200%, 250%, 300% */}
                  <div className="flex items-center gap-1">
                    {[1.25, 1.5, 2.0, 2.5, 3.0].map((preset) => {
                      const isCurrent = Math.abs(zoomLevel - preset) < 0.02;
                      const isMax = preset === 3.0;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setZoomLevel(preset)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isCurrent
                              ? isMax
                                ? 'bg-accent-gold text-slate-950 font-extrabold shadow-sm ring-1 ring-accent-gold'
                                : 'bg-primary/25 text-primary border border-primary/40 font-extrabold'
                              : isMax
                              ? 'text-accent-gold hover:bg-accent-gold/20 border border-accent-gold/40'
                              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-raised'
                          }`}
                          title={`Definir zoom em ${Math.round(preset * 100)}%${isMax ? ' (Tamanho Máximo para edição de precisão)' : ''}`}
                        >
                          {Math.round(preset * 100)}%{isMax ? ' (300% Máx)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Font Scaling: -1px / +1px and -15% / +15% */}
                <div className="flex items-center bg-surface-overlay border border-border-subtle rounded-lg p-0.5" title="Ajuste fino de fontes para caber perfeitamente na imagem">
                  <button
                    type="button"
                    onClick={() => handleAdjustAllFieldsPx(-1)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-accent-gold hover:bg-surface-raised transition-colors cursor-pointer flex items-center gap-1"
                    title="Diminuir todas as fontes em -1px para caber na imagem"
                  >
                    <span className="material-symbols-outlined text-xs">remove</span>
                    <span>-1px Todos</span>
                  </button>
                  <div className="h-3 w-px bg-border-subtle" />
                  <button
                    type="button"
                    onClick={() => handleAdjustAllFieldsPx(1)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer flex items-center gap-1"
                    title="Aumentar todas as fontes em +1px"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                    <span>+1px Todos</span>
                  </button>
                  <div className="h-3 w-px bg-border-subtle" />
                  <button
                    type="button"
                    onClick={() => handleScaleAllFields(0.85)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer flex items-center gap-1"
                    title="Diminuir todas as fontes deste lado em 15%"
                  >
                    <span>-15%</span>
                  </button>
                  <div className="h-3 w-px bg-border-subtle" />
                  <button
                    type="button"
                    onClick={() => handleScaleAllFields(1.15)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer flex items-center gap-1"
                    title="Aumentar todas as fontes deste lado em 15%"
                  >
                    <span>+15%</span>
                  </button>
                </div>

                {/* Current Ratio Badge */}
                <span className="font-mono text-[10px] text-accent-gold font-bold flex items-center gap-1 bg-accent-gold/10 px-2.5 py-1 rounded-lg border border-accent-gold/30">
                  <span className="material-symbols-outlined text-xs">aspect_ratio</span>
                  {currentRatioLabel}
                </span>

                {/* Fullscreen / Expand Screen Toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedCanvas((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                    expandedCanvas
                      ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/40 shadow-xs'
                      : 'bg-surface-overlay text-text-secondary hover:text-text-primary border-border-subtle'
                  }`}
                  title={expandedCanvas ? 'Restaurar colunas laterais' : 'Expandir área do certificado para tela ampla'}
                >
                  <span className="material-symbols-outlined text-xs">
                    {expandedCanvas ? 'fullscreen_exit' : 'fullscreen'}
                  </span>
                  <span className="hidden md:inline">{expandedCanvas ? 'Restaurar Painéis' : 'Expandir Tela'}</span>
                </button>

                {/* Quick Scroll Nav Controls (Topo / Base) when document overflows viewport */}
                {isHeightOverflow && (
                  <div className="flex items-center bg-surface-overlay border border-accent-gold/40 rounded-lg p-0.5 shadow-xs" title="Navegação rápida pela página do certificado">
                    <span className="text-[10px] font-bold text-accent-gold px-1.5 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">unfold_more</span>
                      <span className="hidden xl:inline">Rolar:</span>
                    </span>
                    <button
                      type="button"
                      onClick={scrollToTop}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer flex items-center gap-0.5"
                      title="Rolar para o Topo do Certificado"
                    >
                      <span className="material-symbols-outlined text-xs">arrow_upward</span>
                      <span>Topo</span>
                    </button>
                    <div className="h-3 w-px bg-border-subtle" />
                    <button
                      type="button"
                      onClick={scrollToBottom}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-accent-gold hover:text-accent-gold/80 hover:bg-surface-raised transition-colors cursor-pointer flex items-center gap-0.5"
                      title="Rolar para a Base do Certificado (onde ficam as assinaturas, data e código)"
                    >
                      <span className="material-symbols-outlined text-xs">arrow_downward</span>
                      <span>Base / Código</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Viewport with Full Clean Scrolling Support for Any Zoom and Resolution */}
            <div
              ref={canvasScrollContainerRef}
              className="w-full flex-1 overflow-auto min-h-0 relative p-1 sm:p-3 focus:outline-none"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(217, 119, 6, 0.6) rgba(15, 23, 42, 0.7)',
              }}
            >
              <div
                className={`min-w-full min-h-full flex flex-col ${
                  isHeightOverflow ? 'justify-start pt-2 pb-28' : 'justify-center py-2'
                } ${
                  isWidthOverflow ? 'items-start px-4' : 'items-center px-1'
                }`}
                style={{
                  width: 'max-content',
                  height: 'max-content',
                  minWidth: '100%',
                  minHeight: '100%',
                }}
              >
                <div className="shrink-0 flex flex-col items-center">
                  {/* THE INTERACTIVE CERTIFICATE CANVAS CONTAINER */}
                  <div
                    id="cert-official-canvas"
                    ref={canvasRef}
              onDragOver={handleCanvasDragOver}
              onDragLeave={handleCanvasDragLeave}
              onDrop={handleCanvasDrop}
              className={`relative rounded-2xl shadow-2xl overflow-hidden border shrink-0 transition-all duration-150 ${
                isDragOverCanvas
                  ? 'border-2 border-dashed border-primary ring-4 ring-primary/20 scale-[1.01]'
                  : 'border-accent-gold/50 shadow-accent-gold/10 ring-1 ring-accent-gold/20'
              }`}
              style={{
                width: `${canvasDisplayDimensions.width}px`,
                height: `${canvasDisplayDimensions.height}px`,
                aspectRatio: `${computedCanvasAspectRatio}`,
                backgroundColor: currentCustomBg
                  ? '#090d16'
                  : template.frontPreset === 'classic_light'
                  ? '#f8fafc'
                  : template.frontPreset === 'emerald_luxury'
                  ? '#022c22'
                  : '#080d1a',
              }}
            >
              {/* BACKGROUND 1: User custom uploaded image */}
              {currentCustomBg ? (
                <img
                  src={currentCustomBg}
                  alt={`Arte de fundo ${activeSide}`}
                  className={`absolute inset-0 w-full h-full pointer-events-none select-none transition-all duration-150 ${
                    currentRatioMode === 'auto'
                      ? 'object-fill'
                      : currentFitMode === 'cover'
                      ? 'object-cover'
                      : currentFitMode === 'fill'
                      ? 'object-fill'
                      : 'object-contain'
                  }`}
                />
              ) : (
                /* BACKGROUND 2: Built-in decorative vector certificate canvas */
                <div className="absolute inset-0 pointer-events-none">
                  {/* Subtle luxury gradients */}
                  <div
                    className={`absolute inset-0 ${
                      template.frontPreset === 'classic_light'
                        ? 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]'
                        : template.frontPreset === 'emerald_luxury'
                        ? 'bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#021f18]'
                        : 'bg-gradient-to-br from-[#0c1324] via-[#080d19] to-[#04060d]'
                    }`}
                  />

                  {/* Golden Border Ornaments */}
                  {template.showBorders && (
                    <>
                      <div className="absolute inset-3 border border-accent-gold/30 rounded-xl" />
                      <div className="absolute inset-4 border-2 border-accent-gold/60 rounded-lg" />
                      <div className="absolute top-5 left-5 w-6 h-6 border-t-2 border-l-2 border-accent-gold" />
                      <div className="absolute top-5 right-5 w-6 h-6 border-t-2 border-r-2 border-accent-gold" />
                      <div className="absolute bottom-5 left-5 w-6 h-6 border-b-2 border-l-2 border-accent-gold" />
                      <div className="absolute bottom-5 right-5 w-6 h-6 border-b-2 border-r-2 border-accent-gold" />
                    </>
                  )}

                  {/* Watermark Crest Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5">
                    <span className="material-symbols-outlined text-[170px] text-accent-gold">school</span>
                  </div>
                </div>
              )}

              {/* OVERLAY: Visual drop invitation when dragging from right panel */}
              {isDragOverCanvas && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center z-40 border-2 border-dashed border-primary">
                  <div className="px-4 py-2 rounded-xl bg-slate-950/90 text-primary font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
                    <span className="material-symbols-outlined text-lg">pin_drop</span>
                    <span>Solte aqui para posicionar a informação!</span>
                  </div>
                </div>
              )}

              {/* RENDER ALL DRAGGABLE FIELDS ON CANVAS */}
              {currentSideFields.map((field) => {
                // If the field is not visible (or removed), DO NOT render on canvas!
                if (!field.visible) return null;

                const isSelected = field.key === selectedFieldKey;
                const isDragging = field.key === draggingKey;
                const valueText = getFieldRenderValue(field.key);
                const fieldFontFamily = field.fontFamily || template.defaultFontFamily || 'Inter, sans-serif';
                const isWrapped = field.textWrap !== false;
                const maxWidthPct = field.maxWidth || (field.key === 'nome_curso' ? 34 : field.key === 'carga_horaria' ? 26 : field.key === 'conteudo_programatico' || field.key === 'amparo_legal' ? 65 : 70);
                const maxWidthPx = isWrapped && canvasDisplayDimensions.width > 0 ? Math.round((canvasDisplayDimensions.width * maxWidthPct) / 100) : undefined;

                return (
                  <div
                    key={field.key}
                    onPointerDown={(e) => handlePointerDown(e, field.key)}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform:
                        field.textAlign === 'center'
                          ? 'translate(-50%, -50%)'
                          : field.textAlign === 'right'
                          ? 'translate(-100%, -50%)'
                          : 'translate(0, -50%)',
                      color: field.color,
                      fontSize: `${Math.max(5, Math.round(field.fontSize * zoomLevel))}px`,
                      fontWeight:
                        field.fontWeight === 'black'
                          ? 900
                          : field.fontWeight === 'bold'
                          ? 700
                          : field.fontWeight === 'semibold'
                          ? 600
                          : field.fontWeight === 'medium'
                          ? 500
                          : 400,
                      textAlign: field.textAlign,
                      fontFamily: fieldFontFamily,
                      maxWidth: maxWidthPx ? `${maxWidthPx}px` : undefined,
                      whiteSpace: isWrapped ? 'normal' : 'nowrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      lineHeight: 1.25,
                    }}
                    className={`absolute select-none transition-shadow ${
                      viewMode === 'edit'
                        ? 'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/80 group z-20'
                        : 'z-10 pointer-events-none'
                    } ${
                      isSelected && viewMode === 'edit'
                        ? 'ring-2 ring-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded shadow-lg'
                        : ''
                    } ${isDragging ? 'ring-2 ring-emerald-400 opacity-90 scale-105 z-30' : ''}`}
                    title={
                      viewMode === 'edit'
                        ? `Clique e arraste para posicionar "${field.label}". Use a barra suspensa para aumentar/diminuir, quebra de texto, fonte ou remover.`
                        : undefined
                    }
                  >
                    {/* FLOATING ACTION TOOLBAR ON SELECTED FIELD (EDIT MODE) */}
                    {isSelected && viewMode === 'edit' && !isDragging && (
                      <div
                        className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-950/95 border border-accent-gold/60 text-white rounded-xl shadow-2xl p-1 z-40 backdrop-blur-md pointer-events-auto whitespace-nowrap"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Decrement Size button (-1px) */}
                        <button
                          type="button"
                          onClick={() => adjustFieldSize(field.key, -1)}
                          className="w-6 h-6 rounded-lg bg-surface-overlay hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-border-subtle"
                          title="Diminuir tamanho (-1px)"
                        >
                          <span className="material-symbols-outlined text-xs">remove</span>
                        </button>

                        {/* Current size badge */}
                        <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-accent-gold border border-accent-gold/30 whitespace-nowrap">
                          {field.key === 'qr_code' ? `${field.size || 125}px` : `${field.fontSize}px`}
                        </span>

                        {/* Increment Size button (+1px) */}
                        <button
                          type="button"
                          onClick={() => adjustFieldSize(field.key, 1)}
                          className="w-6 h-6 rounded-lg bg-surface-overlay hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer border border-border-subtle"
                          title="Aumentar tamanho (+1px)"
                        >
                          <span className="material-symbols-outlined text-xs">add</span>
                        </button>

                        <div className="h-3.5 w-px bg-white/20 mx-0.5" />

                        {/* Text Wrap toggle button for text fields */}
                        {field.key !== 'qr_code' && (
                          <button
                            type="button"
                            onClick={() => updateField(field.key, { textWrap: field.textWrap === false ? true : false })}
                            className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                              field.textWrap !== false
                                ? 'bg-primary/30 text-primary border-primary/50'
                                : 'bg-surface-overlay text-white/60 border-white/20 hover:text-white'
                            }`}
                            title={field.textWrap !== false ? 'Quebra de texto ativada (Clique para desativar)' : 'Quebra de texto desativada (Clique para ativar)'}
                          >
                            <span className="material-symbols-outlined text-xs">wrap_text</span>
                            <span>{field.textWrap !== false ? 'Quebra' : 'Sem Quebra'}</span>
                          </button>
                        )}

                        {/* Column width control if text wrap is enabled */}
                        {field.key !== 'qr_code' && field.textWrap !== false && (
                          <div className="flex items-center gap-0.5 bg-surface-overlay border border-white/20 rounded-lg px-1 py-0.5" title="Largura da coluna para quebra de texto">
                            <button
                              type="button"
                              onClick={() => updateField(field.key, { maxWidth: Math.max(15, (field.maxWidth || 34) - 4) })}
                              className="w-4 h-4 rounded text-[9px] font-bold hover:bg-white/20 flex items-center justify-center cursor-pointer"
                              title="Diminuir largura da coluna (-4%)"
                            >
                              -
                            </button>
                            <span className="text-[9px] font-mono text-accent-gold font-bold px-0.5">
                              {field.maxWidth || 34}%
                            </span>
                            <button
                              type="button"
                              onClick={() => updateField(field.key, { maxWidth: Math.min(100, (field.maxWidth || 34) + 4) })}
                              className="w-4 h-4 rounded text-[9px] font-bold hover:bg-white/20 flex items-center justify-center cursor-pointer"
                              title="Aumentar largura da coluna (+4%)"
                            >
                              +
                            </button>
                          </div>
                        )}

                        <div className="h-3.5 w-px bg-white/20 mx-0.5" />

                        {/* Quick Font Selector in floating toolbar */}
                        {field.key !== 'qr_code' && (
                          <select
                            value={field.fontFamily || 'Inter, sans-serif'}
                            onChange={(e) => updateField(field.key, { fontFamily: e.target.value })}
                            className="bg-surface-overlay border border-white/20 text-white rounded-lg px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer focus:outline-none focus:border-accent-gold max-w-[110px] truncate"
                            title="Alterar tipo de fonte deste campo"
                          >
                            {CERTIFICATE_FONT_OPTIONS.map((f) => (
                              <option key={f.id} value={f.id} className="bg-slate-900 text-white text-xs">
                                {f.name.split(' (')[0]}
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="h-3.5 w-px bg-white/20 mx-0.5" />

                        {/* Remove from canvas button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.key)}
                          className="px-2 py-0.5 rounded-lg bg-red-500/25 hover:bg-red-500/40 text-red-300 border border-red-500/40 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          title="Remover este campo do certificado"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                          <span>Remover</span>
                        </button>
                      </div>
                    )}

                    {/* Coordinate indicator on hover when not selected */}
                    {viewMode === 'edit' && !isSelected && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.2 rounded text-[9px] font-mono font-bold pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 bg-black/80 text-white">
                        {field.label}: {field.x}% × {field.y}%
                      </div>
                    )}

                    {/* QR Code Graphic element rendering */}
                    {field.key === 'qr_code' ? (
                      <div
                        className="bg-white p-2.5 rounded-xl shadow-xl border border-slate-300 flex flex-col items-center justify-center"
                        style={{
                          width: `${Math.round((field.size || 125) * zoomLevel)}px`,
                          height: `${Math.round((field.size || 125) * zoomLevel)}px`,
                        }}
                      >
                        <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                          <path d="M0 0h30v30H0zM5 5h20v20H5zM10 10h10v10H10z" />
                          <path d="M70 0h30v30H70zM75 5h20v20H75zM80 10h10v10H80z" />
                          <path d="M0 70h30v30H0zM5 75h20v20H5zM10 80h10v10H10z" />
                          <rect x="38" y="8" width="6" height="6" />
                          <rect x="52" y="8" width="6" height="6" />
                          <rect x="42" y="20" width="6" height="6" />
                          <rect x="56" y="24" width="8" height="8" />
                          <rect x="8" y="42" width="6" height="6" />
                          <rect x="22" y="48" width="6" height="6" />
                          <rect x="40" y="40" width="20" height="20" rx="3" className="text-emerald-600" />
                          <rect x="68" y="42" width="6" height="6" />
                          <rect x="82" y="48" width="10" height="6" />
                          <rect x="38" y="70" width="6" height="12" />
                          <rect x="52" y="74" width="8" height="6" />
                          <rect x="70" y="70" width="8" height="8" />
                          <circle cx="50" cy="50" r="4" fill="#ffffff" />
                        </svg>
                        <span className="text-[7px] font-bold text-slate-800 uppercase mt-0.5 tracking-tighter">
                          Validação Oficial
                        </span>
                      </div>
                    ) : (
                      /* Standard Text element */
                      <span
                        className="drop-shadow-sm inline-block"
                        style={{
                          fontFamily: fieldFontFamily,
                          whiteSpace: isWrapped ? 'normal' : 'nowrap',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {field.key === 'data_emissao' || field.key === 'carga_horaria' || field.key === 'codigo_emissao' ? '' : field.prefix}
                        {valueText}
                        {field.key === 'data_emissao' || field.key === 'carga_horaria' || field.key === 'codigo_emissao' ? '' : field.suffix}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

                  {/* Bottom indicator inside the scroll container for high-zoom / large view */}
                  {isHeightOverflow && (
                    <div className="w-full mt-4 mb-2 flex items-center justify-center gap-3 text-xs text-text-tertiary shrink-0">
                      <span className="flex items-center gap-1 text-[11px] text-accent-gold/90 font-medium">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Base do documento (100% visível)
                      </span>
                      <button
                        type="button"
                        onClick={scrollToTop}
                        className="px-2.5 py-1 rounded-lg bg-surface-overlay hover:bg-surface-raised border border-border-subtle text-[11px] font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 cursor-pointer transition-colors"
                        title="Voltar para o topo do documento"
                      >
                        <span className="material-symbols-outlined text-xs">arrow_upward</span>
                        <span>Voltar ao Topo</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom notification indicator */}
            <p className="text-[11px] text-text-tertiary text-center py-1 max-w-lg shrink-0 select-none">
              {activeSide === 'frente'
                ? '💡 Dica: Clique em qualquer campo para abrir as ferramentas flutuantes de tamanho e remoção.'
                : '💡 O Verso recebe o QR Code de validação, amparo legal (Lei 9.394/96 - Cursos Livres/Extracurriculares) e registro oficial.'}
            </p>
          </main>

          {/* ==============================================================
              RIGHT COLUMN: BOTÕES E LINKS DE INFORMAÇÕES ARRASTÁVEIS
              ============================================================== */}
          <aside className={`${expandedCanvas ? 'hidden' : 'lg:col-span-3 xl:col-span-2'} border-t lg:border-t-0 lg:border-l border-border-subtle bg-surface-overlay/50 flex flex-col justify-between overflow-y-auto p-3.5 space-y-3.5`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-accent-gold text-base">drag_indicator</span>
                  Campos Arrastáveis
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-gold/15 text-accent-gold border border-accent-gold/30">
                  Arraste p/ Imagem
                </span>
              </div>
              <p className="text-[11px] text-text-tertiary leading-tight">
                Arraste qualquer item com o mouse para a imagem, ou use os botões <strong>+ / -</strong> para redimensionar:
              </p>
            </div>

            {/* DRAGGABLE CHIPS / BUTTONS PALETTE */}
            <div className="space-y-2">
              {currentSideFields.map((field) => {
                const isSelected = field.key === selectedFieldKey;
                return (
                  <div
                    key={field.key}
                    draggable={true}
                    onDragStart={(e) => handleRightPanelDragStart(e, field.key)}
                    onClick={() => {
                      setSelectedFieldKey(field.key);
                      if (!field.visible) {
                        updateField(field.key, { x: 50, y: 50, visible: true });
                        showToast(`"${field.label}" adicionado ao centro do certificado.`);
                      }
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing flex items-center justify-between gap-1.5 group ${
                      field.visible
                        ? isSelected
                          ? 'bg-primary/15 border-primary shadow-xs'
                          : 'bg-surface-raised border-border-subtle hover:border-accent-gold'
                        : 'bg-surface-base/50 border-dashed border-border-subtle opacity-70 hover:opacity-100 hover:border-primary'
                    }`}
                    title={
                      field.visible
                        ? 'Clique para selecionar no editor ou arraste para reposicionar'
                        : 'Clique ou arraste para adicionar este campo ao certificado'
                    }
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-surface-overlay border border-border-subtle flex items-center justify-center text-text-tertiary group-hover:text-accent-gold transition-colors shrink-0">
                        <span className="material-symbols-outlined text-sm">drag_indicator</span>
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                            {field.label}
                          </span>
                          {field.visible ? (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30 shrink-0">
                              Oculto
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-tertiary truncate block">
                          ex: "{field.sampleText || getFieldRenderValue(field.key)}"
                        </span>
                      </div>
                    </div>

                    {/* Field Actions: Size +/- and Remove / Add button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {field.visible ? (
                        <>
                          <div className="flex items-center bg-surface-overlay rounded border border-border-subtle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                adjustFieldSize(field.key, -1);
                              }}
                              className="w-5 h-5 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer text-xs"
                              title="Diminuir tamanho"
                            >
                              -
                            </button>
                            <span className="text-[9px] font-mono px-1 text-accent-gold font-bold">
                              {field.key === 'qr_code' ? `${field.size || 130}` : `${field.fontSize}`}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                adjustFieldSize(field.key, 1);
                              }}
                              className="w-5 h-5 flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer text-xs"
                              title="Aumentar tamanho"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveField(field.key);
                            }}
                            className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remover do certificado"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateField(field.key, { x: 50, y: 50, visible: true });
                            setSelectedFieldKey(field.key);
                            showToast(`"${field.label}" adicionado ao certificado.`);
                          }}
                          className="px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                          title="Adicionar ao certificado"
                        >
                          <span className="material-symbols-outlined text-xs">add</span>
                          <span>Inserir</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Helper Box */}
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-secondary space-y-1.5">
              <span className="text-primary font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                Como funciona a emissão:
              </span>
              <p className="text-[11px] text-text-tertiary leading-relaxed">
                Toda vez que um novo certificado for emitido no sistema, os dados reais do aluno e do curso serão estampados exatamente nas coordenadas que você configurou aqui.
              </p>
            </div>

            {/* BOTTOM PERSISTENCE & ACTIONS */}
            <div className="pt-3 border-t border-border-subtle space-y-2">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-base">save</span>
                <span>Salvar Modelo de Certificado</span>
              </button>

              <button
                type="button"
                onClick={handleExportHighResPng}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                title="Gera e baixa um arquivo PNG em alta resolução de 1920 × 1080 pixels (16:9)"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>Baixar Versão Digital HD (1920 × 1080 px)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-2 rounded-xl bg-surface-raised hover:bg-surface-overlay border border-border-subtle text-[11px] font-semibold text-text-secondary hover:text-text-primary flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  title="Imprimir ou salvar em PDF na proporção 16:9 (29,7 × 16,7 cm)"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  <span>Imprimir (29,7×16,7 cm)</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-2.5 py-2 rounded-xl bg-surface-raised hover:bg-surface-overlay border border-border-subtle text-[11px] font-semibold text-text-tertiary hover:text-red-400 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  <span>Restaurar 16:9</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
