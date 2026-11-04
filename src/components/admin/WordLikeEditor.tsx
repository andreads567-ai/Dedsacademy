import React, { useState, useRef, useEffect, DragEvent, useCallback } from 'react';
import { LessonAttachment } from '../../types';
import { uploadImageToServer } from '../../lib/platformSyncClient';
import {
  DocumentSheetRenderer,
  InteractiveNoticeBox,
  InteractiveNoticeBoxProps,
  TableCardBlock,
} from '../DocumentSheetRenderer';

export { InteractiveNoticeBox };

interface WordLikeEditorProps {
  value: string;
  onChange: (value: string) => void;
  attachments: LessonAttachment[];
  onAddAttachment: (att: LessonAttachment) => void;
  onRemoveAttachment: (attId: string) => void;
}

export interface NoticePreset {
  id: string;
  label: string;
  icon: string;
  title: string;
  message: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  hasTimer: boolean;
  timerSeconds: number;
}

const NOTICE_PRESETS: NoticePreset[] = [
  {
    id: 'aviso-geral',
    label: 'Aviso Geral',
    icon: '⚠️',
    title: 'AVISO IMPORTANTE',
    message: 'Atenção para as orientações essenciais desta aula antes de prosseguir.',
    bgColor: '#1E293B',
    textColor: '#FEF3C7',
    borderColor: '#F59E0B',
    hasTimer: false,
    timerSeconds: 10,
  },
  {
    id: 'popup-timer',
    label: 'Pop-up Temporizado',
    icon: '⏱️',
    title: 'AVISO TEMPORIZADO (POP-UP)',
    message: 'Esta caixa de aviso contém contagem regressiva para leitura recomendada da lição.',
    bgColor: '#18181B',
    textColor: '#FED7AA',
    borderColor: '#F97316',
    hasTimer: true,
    timerSeconds: 15,
  },
  {
    id: 'dica-pratica',
    label: 'Dica do Instrutor',
    icon: '💡',
    title: 'DICA DO INSTRUTOR',
    message: 'Boas práticas de mercado: aplique este padrão técnico em seus projetos profissionais.',
    bgColor: '#064E3B',
    textColor: '#D1FAE5',
    borderColor: '#10B981',
    hasTimer: false,
    timerSeconds: 10,
  },
  {
    id: 'atencao-critica',
    label: 'Atenção Crítica',
    icon: '🚨',
    title: 'ATENÇÃO OBRIGATÓRIA',
    message: 'Etapa fundamental: este módulo é pré-requisito obrigatório para a avaliação final.',
    bgColor: '#450A0A',
    textColor: '#FEE2E2',
    borderColor: '#EF4444',
    hasTimer: true,
    timerSeconds: 10,
  },
  {
    id: 'info-tecnica',
    label: 'Nota Técnica',
    icon: 'ℹ️',
    title: 'INFORMAÇÃO COMPLEMENTAR',
    message: 'Verifique se as bibliotecas e ferramentas do seu ambiente estão atualizadas.',
    bgColor: '#082F49',
    textColor: '#E0F2FE',
    borderColor: '#0284C7',
    hasTimer: false,
    timerSeconds: 10,
  },
  {
    id: 'conteudo-bonus',
    label: 'Conteúdo Bônus',
    icon: '⭐',
    title: 'RECURSO BÔNUS EXCLUSIVO',
    message: 'Template de código e material para download gratuito disponibilizado na aula.',
    bgColor: '#3B0764',
    textColor: '#F3E8FF',
    borderColor: '#A855F7',
    hasTimer: false,
    timerSeconds: 10,
  },
];

export const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  value,
  onChange,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  // Modes: 'visual' (continuous visual document with directly displayed images & cards), 'code' (raw text), 'preview' (full student sheet)
  const [editorMode, setEditorMode] = useState<'visual' | 'code' | 'preview'>('visual');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  // Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Image Modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Reformulated Table / 16:9 Card Modal (with multiple vertical block stacking)
  const [showTableCardModal, setShowTableCardModal] = useState(false);
  const [cardBlocks, setCardBlocks] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      imageUrl: string;
      linkText: string;
      linkUrl: string;
    }>
  >([
    {
      id: '1',
      title: 'Tópico Estruturado 1',
      description: 'Explicação detalhada dos conceitos teóricos e aplicação prática.',
      imageUrl: '',
      linkText: 'Ver Detalhes / Link',
      linkUrl: '',
    },
  ]);

  // Notice & Pop-up Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [customNoticeTitle, setCustomNoticeTitle] = useState('AVISO IMPORTANTE');
  const [customNoticeMessage, setCustomNoticeMessage] = useState(
    'Digite aqui a orientação ou aviso que aparecerá para os alunos no documento da aula.'
  );
  const [customNoticeIcon, setCustomNoticeIcon] = useState('⚠️');
  const [customNoticeBgColor, setCustomNoticeBgColor] = useState('#1E293B');
  const [customNoticeTextColor, setCustomNoticeTextColor] = useState('#FEF3C7');
  const [customNoticeBorderColor, setCustomNoticeBorderColor] = useState('#F59E0B');
  const [customNoticeHasTimer, setCustomNoticeHasTimer] = useState(false);
  const [customNoticeTimerSeconds, setCustomNoticeTimerSeconds] = useState(10);

  // Refs for cursor and scroll tracking to prevent jumping to bottom
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleImageInputRef = useRef<HTMLInputElement>(null);
  const cardImageInputRef = useRef<HTMLInputElement>(null);
  const activeCardIndexForUploadRef = useRef<number>(0);

  // Saved cursor / selection range
  const lastSelectionRangeRef = useRef<{ start: number; end: number; scrollTop: number }>({
    start: 0,
    end: 0,
    scrollTop: 0,
  });

  const showNotification = (msg: string) => {
    setUploadFeedback(msg);
    setTimeout(() => setUploadFeedback(null), 3500);
  };

  /**
   * Save selection and scroll position whenever user clicks or types in textarea
   */
  const handleSaveTextareaSelection = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      lastSelectionRangeRef.current = {
        start: textarea.selectionStart || 0,
        end: textarea.selectionEnd || 0,
        scrollTop: textarea.scrollTop || 0,
      };
    }
  };

  /**
   * Insert snippet at current or last remembered cursor position.
   * FIX: Keeps viewport and cursor exactly at insertion point, never jumping to footer!
   */
  const insertSnippetAtCursor = useCallback(
    (snippet: string) => {
      const textarea = textareaRef.current;
      const saved = lastSelectionRangeRef.current;

      let insertStart = saved.start;
      let insertEnd = saved.end;
      let currentScrollTop = saved.scrollTop;

      if (textarea && document.activeElement === textarea) {
        insertStart = textarea.selectionStart;
        insertEnd = textarea.selectionEnd;
        currentScrollTop = textarea.scrollTop;
      }

      // Safe boundaries
      const safeStart = Math.min(Math.max(0, insertStart), value.length);
      const safeEnd = Math.min(Math.max(safeStart, insertEnd), value.length);

      const before = value.substring(0, safeStart);
      const after = value.substring(safeEnd);

      // Clean spacing before & after if block snippet
      const needsPrefixNewline = before.length > 0 && !before.endsWith('\n');
      const needsSuffixNewline = after.length > 0 && !after.startsWith('\n');
      const formattedSnippet = `${needsPrefixNewline ? '\n' : ''}${snippet}${needsSuffixNewline ? '\n' : ''}`;

      const newValue = before + formattedSnippet + after;
      onChange(newValue);

      const newCursorPos = safeStart + formattedSnippet.length;
      lastSelectionRangeRef.current = {
        start: newCursorPos,
        end: newCursorPos,
        scrollTop: currentScrollTop,
      };

      // Restore focus, cursor, and scroll position immediately
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.scrollTop = currentScrollTop;
        }
      }, 0);
    },
    [value, onChange]
  );

  /**
   * GENERATE HTML SNIPPET FOR NOTICE/POP-UP BOX
   */
  const generateNoticeHtml = (notice: {
    title: string;
    message: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    hasTimer: boolean;
    timerSeconds: number;
    icon: string;
  }) => {
    const timerAttr = notice.hasTimer ? notice.timerSeconds : 0;
    return `<div class="deds-alert-box" data-title="${notice.title}" data-timer="${timerAttr}" data-bg="${notice.bgColor}" data-color="${notice.textColor}" data-border="${notice.borderColor}" data-icon="${notice.icon}" style="background-color: ${notice.bgColor}; color: ${notice.textColor}; border-left: 5px solid ${notice.borderColor}; padding: 14px 18px; border-radius: 12px; margin: 16px 0;">\n<strong>${notice.icon} ${notice.title}${notice.hasTimer ? ` (⏱️ Temporizador: ${notice.timerSeconds}s)` : ''}</strong>\n<p>${notice.message}</p>\n</div>`;
  };

  /**
   * INLINE FORMATTING (B, I, U, strike) strictly applied to selection
   */
  const applyInlineFormat = (prefix: string, suffix: string = prefix, placeholder: string = 'texto') => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRangeRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRangeRef.current.end;
    const currentScrollTop = textarea ? textarea.scrollTop : lastSelectionRangeRef.current.scrollTop;

    const isSelected = start !== end;
    const selectedText = isSelected ? value.substring(start, end) : placeholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        if (isSelected) {
          textareaRef.current.setSelectionRange(start, start + replacement.length);
        } else {
          textareaRef.current.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
        }
        textareaRef.current.scrollTop = currentScrollTop;
      }
    }, 0);
  };

  /**
   * HEADINGS (H1, H2, H3) applied cleanly
   */
  const applyHeading = (level: 1 | 2 | 3) => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRangeRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRangeRef.current.end;
    const currentScrollTop = textarea ? textarea.scrollTop : lastSelectionRangeRef.current.scrollTop;

    const isSelected = start !== end;
    const selectedText = isSelected ? value.substring(start, end) : `Título H${level}`;
    const hashes = '#'.repeat(level);

    // Standard clean markdown heading
    const cleanHeadingText = selectedText.replace(/^#+\s*/, '').replace(/#+$/, '').trim();
    const replacement = `\n${hashes} ${cleanHeadingText}\n`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + 1, start + replacement.length - 1);
        textareaRef.current.scrollTop = currentScrollTop;
      }
    }, 0);
  };

  /**
   * NUMBERED LIST
   */
  const applyNumberedList = () => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRangeRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRangeRef.current.end;
    const currentScrollTop = textarea ? textarea.scrollTop : lastSelectionRangeRef.current.scrollTop;

    const selectedText = value.substring(start, end);
    if (selectedText.trim()) {
      const lines = selectedText.split('\n');
      let counter = 1;
      const formatted = lines
        .map((line) => {
          const clean = line.replace(/^\s*(\d+\.|•|-|\*)\s*/, '');
          if (!clean.trim()) return line;
          const numbered = `${counter}. ${clean}`;
          counter++;
          return numbered;
        })
        .join('\n');

      const newValue = value.substring(0, start) + formatted + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, start + formatted.length);
          textareaRef.current.scrollTop = currentScrollTop;
        }
      }, 0);
    } else {
      const insertText = `\n1. Primeiro item\n2. Segundo item\n`;
      insertSnippetAtCursor(insertText);
    }
  };

  /**
   * BULLETED LIST
   */
  const applyBulletList = () => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRangeRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRangeRef.current.end;
    const currentScrollTop = textarea ? textarea.scrollTop : lastSelectionRangeRef.current.scrollTop;

    const selectedText = value.substring(start, end);
    if (selectedText.trim()) {
      const lines = selectedText.split('\n');
      const formatted = lines
        .map((line) => {
          const clean = line.replace(/^\s*(\d+\.|•|-|\*)\s*/, '');
          if (!clean.trim()) return line;
          return `• ${clean}`;
        })
        .join('\n');

      const newValue = value.substring(0, start) + formatted + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, start + formatted.length);
          textareaRef.current.scrollTop = currentScrollTop;
        }
      }, 0);
    } else {
      insertSnippetAtCursor(`\n• Primeiro item do marcador\n• Segundo item do marcador\n`);
    }
  };

  /**
   * QUOTE / CALLOUT
   */
  const insertQuote = () => {
    const textarea = textareaRef.current;
    const start = textarea ? textarea.selectionStart : lastSelectionRangeRef.current.start;
    const end = textarea ? textarea.selectionEnd : lastSelectionRangeRef.current.end;
    const selectedText = value.substring(start, end) || 'Destaque importante para a aula';
    insertSnippetAtCursor(`\n> 💡 **Destaque:** ${selectedText}\n`);
  };

  /**
   * PROCESS MULTIPLE FILES (DRAG & DROP OR FILE SELECTOR)
   * UPLOADS IMAGES DIRECTLY AND INSERTS AT CURSOR WITHOUT JUMPING TO BOTTOM!
   */
  const processFilesBatch = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    showNotification(`Processando ${fileArray.length} arquivo(s)...`);

    for (const file of fileArray) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImg = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

      let type: LessonAttachment['type'] = 'outro';
      if (['doc', 'docx'].includes(ext)) type = 'word';
      else if (['xls', 'xlsx', 'csv'].includes(ext)) type = 'excel';
      else if (['pdf'].includes(ext)) type = 'pdf';
      else if (['ppt', 'pptx'].includes(ext)) type = 'powerpoint';

      const sizeFormatted =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      try {
        let fileUrl = '';
        if (isImg) {
          // Upload through platform sync client to get optimized permanent URL
          fileUrl = await uploadImageToServer(file, 'lesson_img');
        } else {
          fileUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(typeof e.target?.result === 'string' ? e.target.result : '');
            reader.readAsDataURL(file);
          });
        }

        const newAttachment: LessonAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          fileName: file.name,
          type: type,
          fileSize: sizeFormatted,
          fileUrl: fileUrl,
        };
        onAddAttachment(newAttachment);

        if (isImg) {
          // Insert image markdown at exact cursor position!
          const imageSnippet = `\n![${file.name}](${fileUrl})\n`;
          insertSnippetAtCursor(imageSnippet);
        } else {
          // Insert download attachment link at cursor!
          const attachSnippet = `\n> 📥 **Material para Download anexado:** [${file.name}] (${sizeFormatted})\n`;
          insertSnippetAtCursor(attachSnippet);
        }
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
      }
    }

    showNotification('Arquivos e imagens inseridos com sucesso na posição atual!');
  };

  /**
   * DRAG & DROP HANDLERS
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);

    // If alert snippet was dragged from presets
    const draggedText = e.dataTransfer.getData('text/plain');
    if (draggedText && (draggedText.includes('deds-alert-box') || draggedText.includes('deds-table-card'))) {
      insertSnippetAtCursor(draggedText);
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesBatch(e.dataTransfer.files);
    }
  };

  // Link insertion
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || linkUrl.trim();
    const linkMarkdown = `[${text}](${linkUrl.trim()})`;
    insertSnippetAtCursor(linkMarkdown);

    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Image insertion via URL modal
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) return;
    const caption = imageCaption.trim() || 'Imagem Ilustrativa';
    const imageMarkdown = `\n![${caption}](${imageUrl.trim()})\n`;
    insertSnippetAtCursor(imageMarkdown);

    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
  };

  // Reformulated Table / 16:9 Card Inserter (supports stacking multiple vertical blocks)
  const handleInsertTableCards = () => {
    if (cardBlocks.length === 0) return;

    // Generate stacked card HTML blocks
    const cardsHtml = cardBlocks
      .map((block) => {
        return `<div class="deds-table-card" data-title="${block.title.replace(/"/g, '&quot;')}" data-desc="${block.description.replace(/"/g, '&quot;')}" data-img="${block.imageUrl || ''}" data-link-text="${(block.linkText || 'Acessar Link').replace(/"/g, '&quot;')}" data-link-url="${block.linkUrl || ''}">\n<strong>${block.title}</strong>\n<p>${block.description}</p>\n</div>`;
      })
      .join('\n\n');

    insertSnippetAtCursor(`\n${cardsHtml}\n`);
    setShowTableCardModal(false);
    showNotification(
      `${cardBlocks.length} bloco(s) de card empilhados inseridos com sucesso!`
    );
  };

  // Add another vertical card block to modal
  const handleAddCardBlock = () => {
    setCardBlocks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: `Tópico Estruturado ${prev.length + 1}`,
        description: 'Descrição detalhada dos conceitos teóricos e aplicação prática.',
        imageUrl: '',
        linkText: 'Acessar Hiperlink',
        linkUrl: '',
      },
    ]);
  };

  // Remove a block from modal
  const handleRemoveCardBlock = (id: string) => {
    if (cardBlocks.length <= 1) return;
    setCardBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // Update a card block field
  const handleUpdateCardBlock = (
    id: string,
    field: keyof (typeof cardBlocks)[0],
    val: string
  ) => {
    setCardBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: val } : b))
    );
  };

  // Upload image for a specific card block
  const handleCardBlockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotification('Enviando imagem do bloco...');
      const url = await uploadImageToServer(file, 'card_img');
      const idx = activeCardIndexForUploadRef.current;
      setCardBlocks((prev) => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = { ...next[idx], imageUrl: url };
        }
        return next;
      });
      showNotification('Imagem do card carregada!');
    } catch (err) {
      console.error(err);
      alert('Falha ao carregar imagem para o card.');
    }
  };

  const wordsCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charsCount = value.length;

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Toast Notification */}
      {uploadFeedback && (
        <div className="bg-primary text-on-primary px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{uploadFeedback}</span>
          </div>
          <button type="button" onClick={() => setUploadFeedback(null)} className="cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Ribbon Header bar - Word-Like Toolbar */}
      <div className="bg-surface-overlay border-b border-border-subtle p-2 space-y-2">
        {/* Top bar: Document Title and View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              W
            </span>
            <span className="text-xs font-bold text-text-primary">
              Editor de Conteúdo &amp; Descrição Detalhada
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium hidden sm:inline">
              Formatação Rica Word • Inline &amp; Mídia Contínua
            </span>
          </div>

          {/* Mode Switcher: Continuous Visual, Code, and Final Student Sheet */}
          <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                editorMode === 'visual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              title="Editor visual contínuo com imagens carregadas, blocos e formatação em tempo real"
            >
              <span className="material-symbols-outlined text-sm">wysiwyg</span>
              <span>Edição Visual</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode('code')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                editorMode === 'code'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              title="Edição direta de texto e sintaxe Markdown"
            >
              <span className="material-symbols-outlined text-sm">code</span>
              <span>Texto / Código</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                editorMode === 'preview'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
              title="Visualizar a folha exatamente como aparecerá no painel do aluno"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span>Visualizar Folha</span>
            </button>
          </div>
        </div>

        {/* Word Ribbon Tools */}
        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-border-subtle/60 text-text-secondary">
          {/* Group 1: Typography Formatting (Strictly on Selected Text) */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => applyInlineFormat('**', '**', 'texto em negrito')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center font-bold text-xs text-text-primary hover:text-blue-400 cursor-pointer"
              title="Negrito (B) — Aplica ao texto selecionado"
            >
              <span className="font-black">B</span>
            </button>
            <button
              type="button"
              onClick={() => applyInlineFormat('*', '*', 'texto em itálico')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center italic text-xs text-text-primary hover:text-blue-400 cursor-pointer"
              title="Itálico (I) — Aplica ao texto selecionado"
            >
              <span className="font-serif italic font-bold">I</span>
            </button>
            <button
              type="button"
              onClick={() => applyInlineFormat('<u>', '</u>', 'texto sublinhado')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-xs text-text-primary hover:text-blue-400 cursor-pointer underline underline-offset-2"
              title="Sublinhado (S) — Aplica ao texto selecionado"
            >
              <u>S</u>
            </button>
            <button
              type="button"
              onClick={() => applyInlineFormat('~~', '~~', 'texto tachado')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-xs text-text-primary hover:text-blue-400 cursor-pointer line-through"
              title="Tachado"
            >
              <span className="line-through">abc</span>
            </button>
          </div>

          {/* Group 2: Headings (H1, H2, H3 strictly on selected text) */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => applyHeading(1)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-[11px] font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Título 1 (H1)"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => applyHeading(2)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-[11px] font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Título 2 (H2)"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => applyHeading(3)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-[11px] font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Título 3 (H3)"
            >
              H3
            </button>
          </div>

          {/* Group 3: Alignments */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setTextAlign('left')}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                textAlign === 'left'
                  ? 'bg-blue-500/20 text-blue-400 font-bold'
                  : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Alinhar à Esquerda"
            >
              <span className="material-symbols-outlined text-base">format_align_left</span>
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('center')}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                textAlign === 'center'
                  ? 'bg-blue-500/20 text-blue-400 font-bold'
                  : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Centralizar"
            >
              <span className="material-symbols-outlined text-base">format_align_center</span>
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('right')}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                textAlign === 'right'
                  ? 'bg-blue-500/20 text-blue-400 font-bold'
                  : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Alinhar à Direita"
            >
              <span className="material-symbols-outlined text-base">format_align_right</span>
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('justify')}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                textAlign === 'justify'
                  ? 'bg-blue-500/20 text-blue-400 font-bold'
                  : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Justificar"
            >
              <span className="material-symbols-outlined text-base">format_align_justify</span>
            </button>
          </div>

          {/* Group 4: Sequential Lists & Quotes */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={applyBulletList}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Lista com Marcadores"
            >
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            </button>
            <button
              type="button"
              onClick={applyNumberedList}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Lista Numerada (1., 2., 3...)"
            >
              <span className="material-symbols-outlined text-base">format_list_numbered</span>
            </button>
            <button
              type="button"
              onClick={insertQuote}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Citação / Destaque"
            >
              <span className="material-symbols-outlined text-base">format_quote</span>
            </button>

            {/* REFORMULATED TABLE TOOL: CARDS 16:9 WITH LATERAL TEXT BOX & STACKING */}
            <button
              type="button"
              onClick={() => {
                handleSaveTextareaSelection();
                setShowTableCardModal(true);
              }}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer border border-blue-500/30 bg-blue-500/10"
              title="Inserir Card de Tabela Estruturada 16:9 com Texto Lateral e Empilhamento"
            >
              <span className="material-symbols-outlined text-sm">view_agenda</span>
              <span>Tabela / Cards 16:9</span>
            </button>
          </div>

          {/* Group 5: Insert Links, Multiple Images & Multiple Files */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => {
                handleSaveTextareaSelection();
                setShowLinkModal(true);
              }}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-xs font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Inserir Hiperlink no Documento"
            >
              <span className="material-symbols-outlined text-base text-blue-400">link</span>
              <span className="hidden sm:inline">Link</span>
            </button>

            <input
              ref={multipleImageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  processFilesBatch(e.target.files);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                handleSaveTextareaSelection();
                multipleImageInputRef.current?.click();
              }}
              className="px-2.5 h-7 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 flex items-center gap-1 text-xs font-bold text-emerald-400 cursor-pointer transition-colors"
              title="Upload de Imagem — Exibe diretamente a imagem carregada desde o início no editor"
            >
              <span className="material-symbols-outlined text-base text-emerald-400">add_photo_alternate</span>
              <span>+ Imagens</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".doc,.docx,.xls,.xlsx,.csv,.pdf,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files) {
                  processFilesBatch(e.target.files);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                handleSaveTextareaSelection();
                fileInputRef.current?.click();
              }}
              className="px-2.5 h-7 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex items-center gap-1 text-xs font-bold text-blue-400 cursor-pointer transition-colors"
              title="Upload de Múltiplos Arquivos para Download (Word, Excel, PDF)"
            >
              <span className="material-symbols-outlined text-base">attach_file</span>
              <span className="hidden sm:inline">Anexar Arquivos</span>
            </button>
          </div>

          {/* Group 6: Button to Open Custom Notice & Pop-up Modal */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-amber-500/30">
            <button
              type="button"
              onClick={() => {
                handleSaveTextareaSelection();
                setShowNoticeModal(true);
              }}
              className="px-2.5 h-7 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 flex items-center gap-1 text-xs font-bold cursor-pointer transition-all shadow-xs"
              title="Adicionar Pop-up com Temporizador e Caixas de Cores Customizadas"
            >
              <span className="material-symbols-outlined text-base">notification_important</span>
              <span>+ Criar Aviso / Pop-up</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Ribbon: Click to Insert at Cursor */}
        <div className="flex items-center gap-2 pt-1 border-t border-border-subtle/50 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">flash_on</span>
            <span>Avisos Rápidos:</span>
          </span>

          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {NOTICE_PRESETS.map((preset) => {
              const snippet = generateNoticeHtml(preset);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => insertSnippetAtCursor(snippet)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xs shrink-0 border"
                  style={{
                    backgroundColor: `${preset.bgColor}EE`,
                    color: preset.textColor,
                    borderColor: `${preset.borderColor}80`,
                  }}
                  title={`Inserir no cursor (${preset.hasTimer ? `Temporizador ${preset.timerSeconds}s` : 'Aviso fixo'})`}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.label}</span>
                  {preset.hasTimer && (
                    <span className="px-1 py-0.2 rounded bg-black/40 text-[9px] font-mono border border-white/20">
                      {preset.timerSeconds}s
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Document Canvas with Drag & Drop Zone */}
      <div
        ref={documentContainerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 bg-surface-subtle min-h-[400px] flex flex-col items-center transition-colors relative ${
          isDraggingFiles ? 'bg-primary/10 ring-2 ring-primary ring-dashed' : ''
        }`}
      >
        {/* Visible Drag & Drop Orientation Notice Banner */}
        <div className="w-full max-w-4xl mb-3 p-2.5 rounded-xl bg-surface-raised border border-dashed border-primary/40 flex items-center justify-between text-xs text-text-secondary shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">cloud_upload</span>
            <span>
              <strong>Upload Múltiplo &amp; Arraste e Solte:</strong> Arraste imagens ou arquivos diretamente para inclusão imediata no ponto de inserção.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              handleSaveTextareaSelection();
              multipleImageInputRef.current?.click();
            }}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer shrink-0"
          >
            Selecionar Imagens do PC
          </button>
        </div>

        {/* Document "Sheet" Frame */}
        <div className="w-full max-w-4xl bg-[#0E131F] border border-[#222E46] rounded-xl shadow-xl p-6 sm:p-10 relative min-h-[350px]">
          <div className="border-b border-[#222E46] pb-2.5 mb-6 flex items-center justify-between text-[10px] text-text-tertiary">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider">DOCUMENTO DA AULA • FORMATO PADRÃO A4</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold uppercase text-[9px]">
                {editorMode === 'visual'
                  ? 'Modo Visual Contínuo'
                  : editorMode === 'code'
                  ? 'Modo Texto / Markdown'
                  : 'Folha Oficial do Aluno'}
              </span>
            </div>
            <span>MARGENS ABNT (2.5 cm)</span>
          </div>

          {/* MODE 1: CONTINUOUS VISUAL EDITOR WITH DIRECT IMAGE & BLOCK DISPLAY */}
          {editorMode === 'visual' && (
            <div className="space-y-6">
              {/* Live Rendered Continuous Document View */}
              <div
                className={`text-sm text-text-primary leading-relaxed space-y-4 min-h-[220px] ${
                  textAlign === 'center'
                    ? 'text-center'
                    : textAlign === 'right'
                    ? 'text-right'
                    : textAlign === 'justify'
                    ? 'text-justify'
                    : 'text-left'
                }`}
              >
                <DocumentSheetRenderer content={value} />
              </div>

              {/* Seamless Inline Quick-Editor at the insertion point */}
              <div className="pt-4 border-t border-[#222E46]">
                <div className="flex items-center justify-between mb-1.5 text-xs text-text-secondary">
                  <span className="font-bold flex items-center gap-1.5 text-blue-400">
                    <span className="material-symbols-outlined text-sm">edit_note</span>
                    Área de Digitação &amp; Inserção Contínua:
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    Qualquer imagem, aviso ou tabela inserida aparecerá renderizada acima imediatamente
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={8}
                  value={value}
                  onSelect={handleSaveTextareaSelection}
                  onClick={handleSaveTextareaSelection}
                  onKeyUp={handleSaveTextareaSelection}
                  onChange={(e) => {
                    onChange(e.target.value);
                    handleSaveTextareaSelection();
                  }}
                  placeholder="Digite aqui o conteúdo da aula. Use a barra de ferramentas para inserir cards de tabela 16:9, títulos, negritos, avisos e imagens com visualização contínua..."
                  className={`w-full p-4 bg-[#141B2D] border border-[#222E46] rounded-xl text-sm text-text-primary leading-relaxed outline-none focus:border-blue-500 transition-colors resize-y font-sans min-h-[140px] ${
                    textAlign === 'center'
                      ? 'text-center'
                      : textAlign === 'right'
                      ? 'text-right'
                      : textAlign === 'justify'
                      ? 'text-justify'
                      : 'text-left'
                  }`}
                />
              </div>
            </div>
          )}

          {/* MODE 2: CODE / RAW TEXT */}
          {editorMode === 'code' && (
            <textarea
              ref={textareaRef}
              rows={16}
              value={value}
              onSelect={handleSaveTextareaSelection}
              onClick={handleSaveTextareaSelection}
              onKeyUp={handleSaveTextareaSelection}
              onChange={(e) => {
                onChange(e.target.value);
                handleSaveTextareaSelection();
              }}
              placeholder="Digite a descrição detalhada em Markdown ou HTML..."
              className={`w-full bg-transparent border-none outline-none resize-y text-sm text-text-primary leading-relaxed font-mono min-h-[280px] ${
                textAlign === 'center'
                  ? 'text-center'
                  : textAlign === 'right'
                  ? 'text-right'
                  : textAlign === 'justify'
                  ? 'text-justify'
                  : 'text-left'
              }`}
            />
          )}

          {/* MODE 3: PREVIEW ("VISUALIZAR FOLHA") EXACT STUDENT PARITY */}
          {editorMode === 'preview' && (
            <div
              className={`text-sm text-text-primary leading-relaxed space-y-4 min-h-[280px] ${
                textAlign === 'center'
                  ? 'text-center'
                  : textAlign === 'right'
                  ? 'text-right'
                  : textAlign === 'justify'
                  ? 'text-justify'
                  : 'text-left'
              }`}
            >
              <DocumentSheetRenderer content={value} isSheetPreview={true} />
            </div>
          )}

          {/* Attachments Section */}
          {attachments.length > 0 && (
            <div className="mt-8 pt-5 border-t border-[#222E46]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">download</span>
                  Arquivos Anexos para Download ({attachments.length})
                </span>
                <span className="text-[10px] text-text-tertiary">
                  Disponíveis para download e estudo pelos alunos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-overlay border border-border-subtle hover:border-primary/40 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          att.type === 'word'
                            ? 'bg-blue-500/15 text-blue-400'
                            : att.type === 'excel'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : att.type === 'pdf'
                            ? 'bg-red-500/15 text-red-400'
                            : 'bg-purple-500/15 text-purple-400'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {att.type === 'word'
                            ? 'description'
                            : att.type === 'excel'
                            ? 'table_chart'
                            : att.type === 'pdf'
                            ? 'picture_as_pdf'
                            : 'attach_file'}
                        </span>
                      </span>

                      <div className="min-w-0">
                        <p className="font-bold text-text-primary truncate">{att.fileName}</p>
                        <p className="text-[10px] text-text-tertiary">
                          {att.type.toUpperCase()} • {att.fileSize || 'Anexo'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {att.fileUrl && (
                        <a
                          href={att.fileUrl}
                          download={att.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-surface-raised hover:bg-surface-container text-text-secondary hover:text-primary transition-colors cursor-pointer"
                          title="Baixar arquivo"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveAttachment(att.id)}
                        className="p-1.5 rounded-lg hover:bg-status-danger/10 text-text-tertiary hover:text-status-danger transition-colors cursor-pointer"
                        title="Remover anexo"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Word-like Bottom Status Bar */}
      <div className="bg-surface-overlay border-t border-border-subtle px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-text-tertiary select-none">
        <div className="flex items-center gap-3">
          <span>Página 1 de 1</span>
          <span>•</span>
          <span>{wordsCount} palavras</span>
          <span>•</span>
          <span>{charsCount} caracteres</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-accent-emerald-bright font-medium">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            Folha A4 / Avisos &amp; Visualização Ativa
          </span>
          <span>100% Zoom</span>
        </div>
      </div>

      {/* MODAL: INSERIR LINK */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-raised border border-border-subtle rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">link</span>
                Inserir Hiperlink no Documento
              </h4>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Texto de Exibição
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Ex: Clique aqui para acessar a documentação"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Endereço Web / URL <span className="text-status-danger">*</span>
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                Inserir Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSERIR IMAGEM VIA URL */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-raised border border-border-subtle rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">image</span>
                Inserir Imagem no Documento
              </h4>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  URL da Imagem <span className="text-status-danger">*</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Legenda / Descrição da Imagem
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Ex: Diagrama da arquitetura de microsserviços"
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 rounded-xl bg-surface-overlay text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertImageUrl}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Inserir Imagem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFORMULATED MODAL: CARDS DE TABELA 16:9 COM TEXTO LATERAL & EMPILHAMENTO */}
      {showTableCardModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-raised border border-border-subtle rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">view_agenda</span>
                  Card Estruturado de Tabela (Proporção 16:9 com Texto Lateral)
                </h4>
                <p className="text-xs text-text-tertiary">
                  Insira blocos visuais de conteúdo com imagem quadrada/16:9, título, descrição e link, empilhando múltiplos blocos verticais.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTableCardModal(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Hidden file input for card image upload */}
            <input
              ref={cardImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCardBlockImageUpload}
            />

            {/* List of Card Blocks */}
            <div className="space-y-4">
              {cardBlocks.map((block, bIdx) => (
                <div
                  key={block.id}
                  className="p-4 rounded-xl bg-surface-overlay border border-border-subtle space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <span className="material-symbols-outlined text-sm">dashboard</span>
                      Bloco Vertical {bIdx + 1}
                    </span>
                    {cardBlocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCardBlock(block.id)}
                        className="text-xs text-status-danger hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Remover Bloco</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                    {/* Left: 16:9 Image Uploader & Preview */}
                    <div className="sm:col-span-5 space-y-2">
                      <label className="block text-[11px] font-bold text-text-secondary">
                        Imagem do Bloco (Proporção 16:9 / Quadrada)
                      </label>
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-border-subtle flex flex-col items-center justify-center relative group/img">
                        {block.imageUrl ? (
                          <>
                            <img
                              src={block.imageUrl}
                              alt={block.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  activeCardIndexForUploadRef.current = bIdx;
                                  cardImageInputRef.current?.click();
                                }}
                                className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Alterar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateCardBlock(block.id, 'imageUrl', '')}
                                className="px-2 py-1 rounded-md bg-status-danger text-white text-[10px] font-bold cursor-pointer"
                              >
                                Limpar
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                            <span className="material-symbols-outlined text-2xl text-text-tertiary">
                              add_photo_alternate
                            </span>
                            <span className="text-[11px] text-text-tertiary">
                              Nenhuma imagem selecionada
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                activeCardIndexForUploadRef.current = bIdx;
                                cardImageInputRef.current?.click();
                              }}
                              className="mt-1 px-3 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold cursor-pointer transition-all"
                            >
                              Upload do PC
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Optional URL input for image */}
                      <input
                        type="url"
                        value={block.imageUrl}
                        onChange={(e) => handleUpdateCardBlock(block.id, 'imageUrl', e.target.value)}
                        placeholder="Ou cole a URL da imagem (https://...)"
                        className="w-full px-2.5 py-1.5 bg-surface-raised border border-border-subtle rounded-lg text-[11px] text-text-primary outline-none focus:border-primary font-mono"
                      />
                    </div>

                    {/* Right: Lateral Text Box (Title, Description, Link) */}
                    <div className="sm:col-span-7 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Título do Bloco <span className="text-status-danger">*</span>
                        </label>
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => handleUpdateCardBlock(block.id, 'title', e.target.value)}
                          placeholder="Ex: Introdução à Metodologia Ágil"
                          className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-lg text-xs font-bold text-text-primary outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-text-secondary mb-1">
                          Descrição / Conteúdo Lateral
                        </label>
                        <textarea
                          rows={3}
                          value={block.description}
                          onChange={(e) => handleUpdateCardBlock(block.id, 'description', e.target.value)}
                          placeholder="Escreva a explicação técnica, diretrizes ou notas deste card..."
                          className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary leading-relaxed"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary mb-1">
                            Texto do Link (Opcional)
                          </label>
                          <input
                            type="text"
                            value={block.linkText}
                            onChange={(e) => handleUpdateCardBlock(block.id, 'linkText', e.target.value)}
                            placeholder="Ex: Acessar Material"
                            className="w-full px-2.5 py-1 bg-surface-raised border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary mb-1">
                            URL do Link (Opcional)
                          </label>
                          <input
                            type="url"
                            value={block.linkUrl}
                            onChange={(e) => handleUpdateCardBlock(block.id, 'linkUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-2.5 py-1 bg-surface-raised border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Button to stack another vertical block */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAddCardBlock}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>+ Adicionar Outro Bloco Vertical (Empilhar)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const classicTable = `\n| Tópico / Conceito | Descrição Prática | Aplicação no Mercado |\n| :--- | :--- | :--- |\n| Conceito 1 | Fundamentação metodológica | Projeto prático |\n| Conceito 2 | Execução passo a passo | Implementação |\n`;
                  insertSnippetAtCursor(classicTable);
                  setShowTableCardModal(false);
                }}
                className="text-xs text-text-tertiary hover:text-text-primary underline cursor-pointer"
              >
                Inserir Tabela Clássica Markdown
              </button>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowTableCardModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-overlay text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertTableCards}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                <span>Inserir Blocos no Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR AVISO / POP-UP COM TEMPORIZADOR & CORES CUSTOMIZADAS */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-raised border border-border-subtle rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400">notification_important</span>
                  Configurar Aviso &amp; Pop-up com Temporizador
                </h4>
                <p className="text-[11px] text-text-tertiary">
                  Personalize a cor da caixa, cor do texto, ícone e temporizador regressivo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="text-text-tertiary hover:text-text-primary cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* LIVE PREVIEW OF CUSTOMIZED ALERT BOX */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                Pré-visualização em Tempo Real:
              </span>
              <InteractiveNoticeBox
                title={customNoticeTitle || 'TÍTULO DO AVISO'}
                message={customNoticeMessage || 'Mensagem do aviso...'}
                bgColor={customNoticeBgColor}
                textColor={customNoticeTextColor}
                borderColor={customNoticeBorderColor}
                timerSeconds={customNoticeHasTimer ? customNoticeTimerSeconds : 0}
                icon={customNoticeIcon}
              />
            </div>

            <div className="space-y-3.5 pt-1 border-t border-border-subtle">
              {/* Row 1: Title and Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Ícone
                  </label>
                  <select
                    value={customNoticeIcon}
                    onChange={(e) => setCustomNoticeIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary"
                  >
                    <option value="⚠️">⚠️ Aviso</option>
                    <option value="⏱️">⏱️ Relógio</option>
                    <option value="💡">💡 Dica</option>
                    <option value="🚨">🚨 Alerta</option>
                    <option value="ℹ️">ℹ️ Info</option>
                    <option value="⭐">⭐ Estrela</option>
                    <option value="📌">📌 Fixado</option>
                    <option value="🔥">🔥 Fogo</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-text-secondary mb-1">
                    Título do Aviso / Pop-up <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={customNoticeTitle}
                    onChange={(e) => setCustomNoticeTitle(e.target.value)}
                    placeholder="Ex: ATENÇÃO ALUNOS: LEITURA RECOMENDADA"
                    className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>

              {/* Row 2: Message Content */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  Mensagem / Texto do Aviso <span className="text-status-danger">*</span>
                </label>
                <textarea
                  rows={3}
                  value={customNoticeMessage}
                  onChange={(e) => setCustomNoticeMessage(e.target.value)}
                  placeholder="Escreva a descrição detalhada do aviso ou instrução para a aula..."
                  className="w-full px-3 py-2 bg-surface-overlay border border-border-subtle rounded-xl text-xs text-text-primary outline-none focus:border-primary leading-relaxed"
                />
              </div>

              {/* Row 3: Timer Controls */}
              <div className="p-3 rounded-xl bg-surface-overlay border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-primary">
                    <input
                      type="checkbox"
                      checked={customNoticeHasTimer}
                      onChange={(e) => setCustomNoticeHasTimer(e.target.checked)}
                      className="accent-primary w-4 h-4 rounded cursor-pointer"
                    />
                    <span>Ativar Temporizador Regressivo na Caixa de Aviso</span>
                  </label>
                  {customNoticeHasTimer && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold">
                      {customNoticeTimerSeconds} segundos
                    </span>
                  )}
                </div>

                {customNoticeHasTimer && (
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-[11px] text-text-tertiary">Duração:</span>
                    {[5, 10, 15, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setCustomNoticeTimerSeconds(sec)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                          customNoticeTimerSeconds === sec
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-surface-raised text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 4: Colors (Background, Text & Border) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Background Color */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
                    Cor do Fundo da Caixa
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customNoticeBgColor}
                      onChange={(e) => setCustomNoticeBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customNoticeBgColor}
                      onChange={(e) => setCustomNoticeBgColor(e.target.value)}
                      className="w-full px-2 py-1 bg-surface-overlay border border-border-subtle rounded-lg text-xs font-mono text-text-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {['#1E293B', '#18181B', '#064E3B', '#450A0A', '#082F49', '#3B0764'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCustomNoticeBgColor(color)}
                        className="w-5 h-5 rounded-md border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
                    Cor do Texto
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customNoticeTextColor}
                      onChange={(e) => setCustomNoticeTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customNoticeTextColor}
                      onChange={(e) => setCustomNoticeTextColor(e.target.value)}
                      className="w-full px-2 py-1 bg-surface-overlay border border-border-subtle rounded-lg text-xs font-mono text-text-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {['#FFFFFF', '#FEF3C7', '#D1FAE5', '#FEE2E2', '#E0F2FE', '#F3E8FF'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCustomNoticeTextColor(color)}
                        className="w-5 h-5 rounded-md border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Border / Accent Color */}
                <div>
                  <label className="block text-[11px] font-bold text-text-secondary mb-1">
                    Cor da Borda de Destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customNoticeBorderColor}
                      onChange={(e) => setCustomNoticeBorderColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={customNoticeBorderColor}
                      onChange={(e) => setCustomNoticeBorderColor(e.target.value)}
                      className="w-full px-2 py-1 bg-surface-overlay border border-border-subtle rounded-lg text-xs font-mono text-text-primary"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    {['#F59E0B', '#F97316', '#10B981', '#EF4444', '#0284C7', '#A855F7'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCustomNoticeBorderColor(color)}
                        className="w-5 h-5 rounded-md border border-white/20 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="px-3.5 py-2 rounded-xl bg-surface-overlay text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const html = generateNoticeHtml({
                    title: customNoticeTitle.trim() || 'AVISO',
                    message: customNoticeMessage.trim(),
                    bgColor: customNoticeBgColor,
                    textColor: customNoticeTextColor,
                    borderColor: customNoticeBorderColor,
                    hasTimer: customNoticeHasTimer,
                    timerSeconds: customNoticeTimerSeconds,
                    icon: customNoticeIcon,
                  });
                  insertSnippetAtCursor(html);
                  setShowNoticeModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Inserir Aviso no Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
