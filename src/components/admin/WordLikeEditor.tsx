import React, { useState, useRef, DragEvent } from 'react';
import { LessonAttachment } from '../../types';

interface WordLikeEditorProps {
  value: string;
  onChange: (value: string) => void;
  attachments: LessonAttachment[];
  onAddAttachment: (att: LessonAttachment) => void;
  onRemoveAttachment: (attId: string) => void;
}

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
        // Keep the formatted text selected
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        // Select the placeholder so user can immediately type over it
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
    // Inline markdown or html tag strictly wrapping the selected text
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
      // Find previous numbering sequence in the preceding text to keep sequential logic
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
    let imageCount = 0;
    let docCount = 0;

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
          imageCount++;
          // Embed image preview directly in text
          appendedText += `\n\n![${file.name}](${dataUrl})\n*Legenda: ${file.name}*\n`;
        } else {
          docCount++;
          // Insert downloadable attachment tag
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

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

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

      // Inline formatting parser: bold (**), italic (*), underline (<u>), strikethrough (~~), link ([text](url))
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
            {/* Insert Link */}
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-xs font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Inserir Hiperlink no Documento"
            >
              <span className="material-symbols-outlined text-base text-blue-400">link</span>
              <span className="hidden sm:inline">Link</span>
            </button>

            {/* Multiple Images Selector */}
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

            {/* Multiple Documents / Attachments Selector */}
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
              <strong>Upload Múltiplo &amp; Arraste e Solte:</strong> Arraste e solte múltiplas imagens ou arquivos aqui (PDF, Word, Excel, JPG, PNG) para inclusão simultânea.
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
          {/* Subtle document header bar mimicking a Word Page */}
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
              placeholder="Digite a descrição detalhada da aula com formatação estilo Word. Utilize títulos (H1, H2, H3), negrito, itálico, sublinhado, listas de passos, destaques, hiperlinks e tabelas..."
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
            /* VISUALIZAR FOLHA: Authentic Formatted Document Sheet */
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

          {/* Attached Files for Download section inside the Document Footer */}
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
            Folha A4 / Visualização Ativa
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
    </div>
  );
};
