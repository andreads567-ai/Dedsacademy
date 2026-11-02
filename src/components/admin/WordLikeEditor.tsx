import React, { useState, useRef, useEffect, DragEvent } from 'react';
import { LessonAttachment } from '../../types';

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

/**
 * INTERACTIVE NOTICE BOX COMPONENT WITH LIVE COUNTDOWN TIMER
 */
export const InteractiveNoticeBox: React.FC<{
  title: string;
  message: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  timerSeconds?: number;
  icon?: string;
}> = ({ title, message, bgColor, textColor, borderColor, timerSeconds, icon }) => {
  const [timeLeft, setTimeLeft] = useState<number>(timerSeconds || 0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!timerSeconds || timerSeconds <= 0) return;
    setTimeLeft(timerSeconds);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  if (isDismissed) return null;

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderLeft: `5px solid ${borderColor}`,
      }}
      className="p-4 my-4 rounded-xl shadow-lg relative border border-white/10 transition-all animate-in fade-in"
    >
      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="text-base">{icon || '⚠️'}</span>
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {timerSeconds && timerSeconds > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full bg-black/40 font-mono font-bold flex items-center gap-1 border border-white/15">
              <span>⏱️</span>
              <span>{timeLeft > 0 ? `${timeLeft}s` : 'Temporizador concluído'}</span>
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="opacity-70 hover:opacity-100 p-1 text-xs hover:bg-white/10 rounded transition-all cursor-pointer"
            title="Fechar aviso"
          >
            ✕
          </button>
        </div>
      </div>

      {timerSeconds && timerSeconds > 0 && (
        <div className="w-full bg-black/30 h-1.5 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full transition-all duration-1000"
            style={{
              backgroundColor: borderColor,
              width: `${Math.max(0, (timeLeft / timerSeconds) * 100)}%`,
            }}
          />
        </div>
      )}

      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
        {message}
      </div>
    </div>
  );
};

export const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  value,
  onChange,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Notice & Pop-up with Timer Modal State
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

  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleImageInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setUploadFeedback(msg);
    setTimeout(() => setUploadFeedback(null), 3500);
  };

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
    return `\n<div class="deds-alert-box" data-title="${notice.title}" data-timer="${timerAttr}" data-bg="${notice.bgColor}" data-color="${notice.textColor}" data-border="${notice.borderColor}" data-icon="${notice.icon}" style="background-color: ${notice.bgColor}; color: ${notice.textColor}; border-left: 5px solid ${notice.borderColor}; padding: 14px 18px; border-radius: 12px; margin: 16px 0;">\n<strong>${notice.icon} ${notice.title}${notice.hasTimer ? ` (⏱️ Temporizador: ${notice.timerSeconds}s)` : ''}</strong>\n<p>${notice.message}</p>\n</div>\n`;
  };

  /**
   * INSERT TEXT / SNIPPET AT CURRENT CURSOR OR DRAG POSITION
   */
  const insertSnippetAtCursor = (snippet: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + snippet + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + snippet.length, start + snippet.length);
      }, 0);
    } else {
      onChange(value + (value.endsWith('\n') ? '' : '\n') + snippet);
    }
    showNotification('Aviso adicionado ao documento com sucesso!');
  };

  /**
   * FORMAT TEXT STRICTLY APPLIED TO SELECTED TEXT ONLY
   */
  const applyInlineFormat = (prefix: string, suffix: string = prefix, placeholder: string = 'texto') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const isSelected = start !== end;
    const selectedText = isSelected ? value.substring(start, end) : placeholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      if (isSelected) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }
    }, 0);
  };

  /**
   * HEADINGS: Strictly applied to selected text range without affecting whole block
   */
  const applyHeading = (level: 1 | 2 | 3) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const isSelected = start !== end;
    const selectedText = isSelected ? value.substring(start, end) : `Título H${level}`;

    const hashes = '#'.repeat(level);
    const replacement = `${hashes} ${selectedText} ${hashes}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  };

  /**
   * NUMBERED LIST: Logical sequential order (1., 2., 3...) without skipping or resetting
   */
  const applyNumberedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
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
        textarea.focus();
        textarea.setSelectionRange(start, start + formatted.length);
      }, 0);
    } else {
      const textBefore = value.substring(0, start);
      const linesBefore = textBefore.split('\n');
      const lastLine = linesBefore[linesBefore.length - 1] || '';
      const match = lastLine.match(/^(\d+)\.\s/);
      const nextNum = match ? parseInt(match[1], 10) + 1 : 1;

      const prefix = textBefore.endsWith('\n') || start === 0 ? '' : '\n';
      const insertText = `${prefix}${nextNum}. Item ${nextNum}\n`;
      const newValue = value.substring(0, start) + insertText + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertText.length, start + insertText.length);
      }, 0);
    }
  };

  /**
   * BULLETED LIST: Sequence of bullet points (• )
   */
  const applyBulletList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
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
        textarea.focus();
        textarea.setSelectionRange(start, start + formatted.length);
      }, 0);
    } else {
      const textBefore = value.substring(0, start);
      const prefix = textBefore.endsWith('\n') || start === 0 ? '' : '\n';
      const insertText = `${prefix}• Novo tópico com marcador\n`;
      const newValue = value.substring(0, start) + insertText + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + insertText.length, start + insertText.length);
      }, 0);
    }
  };

  /**
   * QUOTE / CALLOUT
   */
  const insertQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'Destaque importante para a aula';
    const replacement = `\n> 💡 **Destaque:** ${selectedText}\n`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);
    setTimeout(() => textarea.focus(), 0);
  };

  /**
   * TABLE TEMPLATE
   */
  const insertTable = () => {
    const tableTemplate = `\n| Tópico / Conceito | Descrição Prática | Aplicação no Mercado |\n| :--- | :--- | :--- |\n| Conceito 1 | Fundamentação metodológica | Projeto prático |\n| Conceito 2 | Execução passo a passo | Implementação |\n`;
    onChange(value + tableTemplate);
  };

  /**
   * PROCESS MULTIPLE FILES (DRAG & DROP OR FILE SELECTOR)
   */
  const processFilesBatch = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    let appendedText = '';

    fileArray.forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImg = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

      let type: LessonAttachment['type'] = 'outro';
      if (['doc', 'docx'].includes(ext)) type = 'word';
      else if (['xls', 'xlsx', 'csv'].includes(ext)) type = 'excel';
      else if (['pdf'].includes(ext)) type = 'pdf';
      else if (['ppt', 'pptx'].includes(ext)) type = 'powerpoint';

      const sizeFormatted = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = typeof event.target?.result === 'string' ? event.target.result : URL.createObjectURL(file);

        const newAttachment: LessonAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          fileName: file.name,
          type: type,
          fileSize: sizeFormatted,
          fileUrl: dataUrl,
        };
        onAddAttachment(newAttachment);

        if (isImg) {
          appendedText += `\n\n![${file.name}](${dataUrl})\n*Legenda: ${file.name}*\n`;
        } else {
          appendedText += `\n\n> 📥 **Material para Download anexado:** [${file.name}] (${sizeFormatted})\n`;
        }

        onChange(value + appendedText);
      };
      reader.readAsDataURL(file);
    });

    showNotification(
      `Upload processado com sucesso: ${fileArray.length} ${
        fileArray.length === 1 ? 'arquivo recebido' : 'arquivos recebidos'
      }.`
    );
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

    // If text was dragged (e.g. from notice badges)
    const draggedText = e.dataTransfer.getData('text/plain');
    if (draggedText && draggedText.includes('deds-alert-box')) {
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
    const textarea = textareaRef.current;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + linkMarkdown + value.substring(end);
      onChange(newValue);
    } else {
      onChange(value + ' ' + linkMarkdown);
    }

    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Image insertion via URL
  const handleInsertImageUrl = () => {
    if (!imageUrl.trim()) return;
    const caption = imageCaption.trim() || 'Imagem Ilustrativa';
    const imageMarkdown = `\n\n![${caption}](${imageUrl.trim()})\n*Legenda: ${caption}*\n`;
    onChange(value + imageMarkdown);

    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
  };

  // Render "Visualizar Folha" / Sheet view parser
  const renderDocumentSheetView = (content: string) => {
    if (!content.trim()) {
      return (
        <div className="py-12 text-center text-text-tertiary italic">
          Nenhum conteúdo digitado para visualização da folha. Volte para o modo &quot;Edição&quot; e redija o material da aula.
        </div>
      );
    }

    // Split paragraphs and process blocks
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listType: 'ul' | 'ol' = 'ul';
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        if (listType === 'ol') {
          elements.push(
            <ol key={`list-${elements.length}`} className="list-decimal pl-6 space-y-1.5 my-3 text-sm text-text-primary">
              {listItems}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc pl-6 space-y-1.5 my-3 text-sm text-text-primary">
              {listItems}
            </ul>
          );
        }
        listItems = [];
        inList = false;
      }
    };

    let inAlertBlock = false;
    let currentAlertProps: {
      title: string;
      timer: number;
      bg: string;
      color: string;
      border: string;
      icon: string;
      lines: string[];
    } | null = null;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check if line starts an alert box
      if (trimmed.includes('class="deds-alert-box"') || trimmed.includes("class='deds-alert-box'")) {
        flushList();
        const titleMatch = trimmed.match(/data-title="([^"]*)"/);
        const timerMatch = trimmed.match(/data-timer="([^"]*)"/);
        const bgMatch = trimmed.match(/data-bg="([^"]*)"/);
        const colorMatch = trimmed.match(/data-color="([^"]*)"/);
        const borderMatch = trimmed.match(/data-border="([^"]*)"/);
        const iconMatch = trimmed.match(/data-icon="([^"]*)"/);

        currentAlertProps = {
          title: titleMatch ? titleMatch[1] : 'AVISO',
          timer: timerMatch ? parseInt(timerMatch[1], 10) || 0 : 0,
          bg: bgMatch ? bgMatch[1] : '#1E293B',
          color: colorMatch ? colorMatch[1] : '#FEF3C7',
          border: borderMatch ? borderMatch[1] : '#F59E0B',
          icon: iconMatch ? iconMatch[1] : '⚠️',
          lines: [],
        };

        if (trimmed.endsWith('</div>')) {
          // Single line alert box
          const innerClean = trimmed
            .replace(/^<div[^>]*>/, '')
            .replace(/<\/div>$/, '')
            .replace(/<strong>.*?<\/strong>/, '')
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '\n')
            .trim();
          elements.push(
            <InteractiveNoticeBox
              key={`alert-${idx}`}
              title={currentAlertProps.title}
              message={innerClean || 'Orientação acadêmica para a aula.'}
              bgColor={currentAlertProps.bg}
              textColor={currentAlertProps.color}
              borderColor={currentAlertProps.border}
              timerSeconds={currentAlertProps.timer}
              icon={currentAlertProps.icon}
            />
          );
          currentAlertProps = null;
        } else {
          inAlertBlock = true;
        }
        return;
      }

      if (inAlertBlock && currentAlertProps) {
        if (trimmed.includes('</div>')) {
          const cleanMessage = currentAlertProps.lines
            .join('\n')
            .replace(/<strong>.*?<\/strong>/g, '')
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '\n')
            .trim();
          elements.push(
            <InteractiveNoticeBox
              key={`alert-${idx}`}
              title={currentAlertProps.title}
              message={cleanMessage || 'Orientação acadêmica para a aula.'}
              bgColor={currentAlertProps.bg}
              textColor={currentAlertProps.color}
              borderColor={currentAlertProps.border}
              timerSeconds={currentAlertProps.timer}
              icon={currentAlertProps.icon}
            />
          );
          inAlertBlock = false;
          currentAlertProps = null;
        } else {
          currentAlertProps.lines.push(line);
        }
        return;
      }

      // Empty line
      if (!trimmed) {
        flushList();
        return;
      }

      // H1 Header (# text or # text #)
      if (trimmed.startsWith('# ') || trimmed.startsWith('#')) {
        flushList();
        const clean = trimmed.replace(/^#+\s*/, '').replace(/#+$/, '').trim();
        const level = (trimmed.match(/^#+/) || ['#'])[0].length;
        if (level === 1) {
          elements.push(
            <h1
              key={idx}
              className="text-2xl font-extrabold text-text-primary border-b border-border-subtle pb-2 mt-6 mb-3 tracking-tight"
            >
              {clean}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2
              key={idx}
              className="text-xl font-bold text-text-primary border-b border-border-subtle/50 pb-1.5 mt-5 mb-2.5"
            >
              {clean}
            </h2>
          );
        } else {
          elements.push(
            <h3 key={idx} className="text-base font-bold text-text-primary mt-4 mb-2">
              {clean}
            </h3>
          );
        }
        return;
      }

      // Blockquote (> text)
      if (trimmed.startsWith('>')) {
        flushList();
        const quoteContent = trimmed.replace(/^>\s*/, '');
        elements.push(
          <div
            key={idx}
            className="p-3.5 my-3 rounded-xl bg-blue-500/10 border-l-4 border-blue-500 text-xs sm:text-sm text-text-primary shadow-xs"
          >
            {quoteContent.includes('**') ? (
              <span dangerouslySetInnerHTML={{ __html: quoteContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
            ) : (
              quoteContent
            )}
          </div>
        );
        return;
      }

      // Numbered list item (1. item)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(<li key={idx}>{numMatch[2]}</li>);
        return;
      }

      // Bulleted list item (• item or - item or * item)
      if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        const bulletContent = trimmed.replace(/^(•|-|\*)\s*/, '');
        listItems.push(<li key={idx}>{bulletContent}</li>);
        return;
      }

      // Embedded Image (![caption](url))
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        flushList();
        elements.push(
          <div key={idx} className="my-4 text-center">
            <img
              src={imgMatch[2]}
              alt={imgMatch[1] || 'Imagem do documento'}
              className="max-h-80 mx-auto rounded-xl shadow-md border border-border-subtle object-contain bg-black/40"
            />
            {imgMatch[1] && (
              <p className="text-[11px] text-text-tertiary italic mt-1.5">{imgMatch[1]}</p>
            )}
          </div>
        );
        return;
      }

      // Standard Paragraph
      flushList();

      let formattedHtml = trimmed
        .replace(/<u>(.*?)<\/u>/g, '<span class="underline underline-offset-2">$1</span>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-text-primary">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/~~(.*?)~~/g, '<del class="line-through text-text-tertiary">$1</del>')
        .replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 font-semibold underline hover:text-blue-300">$1</a>'
        );

      elements.push(
        <p
          key={idx}
          className="text-sm text-text-primary leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: formattedHtml }}
        />
      );
    });

    flushList();
    return elements;
  };

  const wordsCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charsCount = value.length;

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Toast Notification */}
      {uploadFeedback && (
        <div className="bg-primary text-on-primary px-4 py-2 text-xs font-bold flex items-center justify-between">
          <span>{uploadFeedback}</span>
          <button type="button" onClick={() => setUploadFeedback(null)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Ribbon Header bar - Word-Like Toolbar */}
      <div className="bg-surface-overlay border-b border-border-subtle p-2 space-y-2">
        {/* Top bar: Document Title and View Switcher */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              W
            </span>
            <span className="text-xs font-bold text-text-primary">
              Editor de Conteúdo &amp; Descrição Detalhada
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium hidden sm:inline">
              Formatação Rica Word • Inline &amp; Mídia
            </span>
          </div>

          <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'edit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">edit_document</span>
              <span>Edição</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
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
              title="Negrito (B) — Aplica apenas ao texto selecionado"
            >
              <span className="font-black">B</span>
            </button>
            <button
              type="button"
              onClick={() => applyInlineFormat('*', '*', 'texto em itálico')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center italic text-xs text-text-primary hover:text-blue-400 cursor-pointer"
              title="Itálico (I) — Aplica apenas ao texto selecionado"
            >
              <span className="font-serif italic font-bold">I</span>
            </button>
            <button
              type="button"
              onClick={() => applyInlineFormat('<u>', '</u>', 'texto sublinhado')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-xs text-text-primary hover:text-blue-400 cursor-pointer underline underline-offset-2"
              title="Sublinhado (S) — Aplica apenas ao texto selecionado"
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
              title="Título 1 (H1) — Aplica apenas ao texto selecionado"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => applyHeading(2)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-[11px] font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Título 2 (H2) — Aplica apenas ao texto selecionado"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => applyHeading(3)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-[11px] font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Título 3 (H3) — Aplica apenas ao texto selecionado"
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
                textAlign === 'left' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Alinhar à Esquerda"
            >
              <span className="material-symbols-outlined text-base">format_align_left</span>
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('center')}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                textAlign === 'center' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Centralizar"
            >
              <span className="material-symbols-outlined text-base">format_align_center</span>
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('right')}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                textAlign === 'right' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Alinhar à Direita"
            >
              <span className="material-symbols-outlined text-base">format_align_right</span>
            </button>
            <button
              type="button"
              onClick={() => setTextAlign('justify')}
              className={`w-7 h-7 rounded flex items-center justify-center cursor-pointer transition-colors ${
                textAlign === 'justify' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'hover:bg-surface-overlay text-text-tertiary hover:text-text-primary'
              }`}
              title="Justificar"
            >
              <span className="material-symbols-outlined text-base">format_align_justify</span>
            </button>
          </div>

          {/* Group 4: Sequential Lists & Formatting */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={applyBulletList}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Lista com Marcadores Sequenciais"
            >
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            </button>
            <button
              type="button"
              onClick={applyNumberedList}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Lista Numerada Sequencial (1., 2., 3...)"
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
            <button
              type="button"
              onClick={insertTable}
              className="px-1.5 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-[11px] font-bold text-text-secondary hover:text-blue-400 cursor-pointer"
              title="Inserir Tabela Estruturada"
            >
              <span className="material-symbols-outlined text-sm">table_chart</span>
              <span className="hidden xl:inline">Tabela</span>
            </button>
          </div>

          {/* Group 5: Insert Links, Multiple Images & Multiple Files */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
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
              onClick={() => multipleImageInputRef.current?.click()}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-xs font-bold text-text-primary hover:text-emerald-400 cursor-pointer"
              title="Upload de Múltiplas Imagens Simultâneas"
            >
              <span className="material-symbols-outlined text-base text-emerald-400">add_photo_alternate</span>
              <span className="hidden sm:inline">+ Imagens</span>
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
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 h-7 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex items-center gap-1 text-xs font-bold text-blue-400 cursor-pointer transition-colors"
              title="Upload de Múltiplos Arquivos para Download (Word, Excel, PDF)"
            >
              <span className="material-symbols-outlined text-base">attach_file</span>
              <span>Anexar Arquivos</span>
            </button>
          </div>

          {/* Group 6: Button to Open Custom Notice & Pop-up Modal */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-amber-500/30">
            <button
              type="button"
              onClick={() => setShowNoticeModal(true)}
              className="px-2.5 h-7 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 flex items-center gap-1 text-xs font-bold cursor-pointer transition-all shadow-xs"
              title="Adicionar Pop-up com Temporizador e Caixas de Cores Customizadas"
            >
              <span className="material-symbols-outlined text-base">notification_important</span>
              <span>+ Criar Aviso / Pop-up</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Ribbon: Click or Drag Notices into Document */}
        <div className="flex items-center gap-2 pt-1 border-t border-border-subtle/50 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">drag_indicator</span>
            <span>Avisos Rápidos (Clique ou Arraste):</span>
          </span>

          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {NOTICE_PRESETS.map((preset) => {
              const snippet = generateNoticeHtml(preset);
              return (
                <button
                  key={preset.id}
                  type="button"
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', snippet);
                  }}
                  onClick={() => insertSnippetAtCursor(snippet)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:scale-105 transition-all shadow-xs shrink-0 border"
                  style={{
                    backgroundColor: `${preset.bgColor}EE`,
                    color: preset.textColor,
                    borderColor: `${preset.borderColor}80`,
                  }}
                  title={`Clique para inserir ou arraste para dentro da aula (${preset.hasTimer ? `Temporizador ${preset.timerSeconds}s` : 'Aviso fixo'})`}
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
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-4 bg-surface-subtle min-h-[350px] flex flex-col items-center transition-colors relative ${
          isDraggingFiles ? 'bg-primary/10 ring-2 ring-primary ring-dashed' : ''
        }`}
      >
        {/* Visible Drag & Drop Orientation Notice Banner */}
        <div className="w-full max-w-4xl mb-3 p-2.5 rounded-xl bg-surface-raised border border-dashed border-primary/40 flex items-center justify-between text-xs text-text-secondary shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">cloud_upload</span>
            <span>
              <strong>Upload Múltiplo &amp; Arraste e Solte:</strong> Arraste e solte avisos, imagens ou arquivos (PDF, Word, Excel, JPG, PNG) diretamente aqui para inclusão instantânea.
            </span>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer shrink-0"
          >
            Selecionar do PC
          </button>
        </div>

        {/* Document "Sheet" Frame */}
        <div className="w-full max-w-4xl bg-[#0E131F] border border-[#222E46] rounded-xl shadow-xl p-6 sm:p-10 relative min-h-[320px]">
          <div className="border-b border-[#222E46] pb-2.5 mb-6 flex items-center justify-between text-[10px] text-text-tertiary">
            <span className="font-semibold uppercase tracking-wider">DOCUMENTO DA AULA • FORMATO PADRÃO A4</span>
            <span>MARGENS ABNT (2.5 cm)</span>
          </div>

          {viewMode === 'edit' ? (
            <textarea
              ref={textareaRef}
              rows={14}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Digite a descrição detalhada da aula com formatação estilo Word. Utilize títulos (H1, H2, H3), negrito, itálico, sublinhado, listas de passos, destaques, hiperlinks, tabelas e avisos com temporizador..."
              className={`w-full bg-transparent border-none outline-none resize-y text-sm text-text-primary leading-relaxed font-sans min-h-[240px] ${
                textAlign === 'center'
                  ? 'text-center'
                  : textAlign === 'right'
                  ? 'text-right'
                  : textAlign === 'justify'
                  ? 'text-justify'
                  : 'text-left'
              }`}
            />
          ) : (
            <div
              className={`text-sm text-text-primary leading-relaxed space-y-3 min-h-[240px] ${
                textAlign === 'center'
                  ? 'text-center'
                  : textAlign === 'right'
                  ? 'text-right'
                  : textAlign === 'justify'
                  ? 'text-justify'
                  : 'text-left'
              }`}
            >
              {renderDocumentSheetView(value)}
            </div>
          )}

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

      {/* Modal Inserir Link */}
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
                  placeholder="Ex: Clique aqui para acessar a documentação oficial"
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

      {/* Modal Inserir Imagem via URL */}
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
