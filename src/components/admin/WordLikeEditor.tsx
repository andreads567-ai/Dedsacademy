import React, { useState, useRef } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply formatting to selected text in textarea
  const applyFormat = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = 'texto') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  // Insert block formatting (headings, lists, quotes)
  const insertBlock = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    let replacement = '';
    if (selectedText.includes('\n')) {
      // Multi-line prefixing
      replacement = selectedText
        .split('\n')
        .map((line) => (line.trim() ? `${prefix} ${line}` : line))
        .join('\n');
    } else {
      replacement = `\n${prefix} ${selectedText || 'Título ou Parágrafo'}\n`;
    }

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);
    setTimeout(() => textarea.focus(), 0);
  };

  // Insert link
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

  // Insert Image into text
  const handleInsertImage = () => {
    if (!imageUrl.trim()) return;
    const caption = imageCaption.trim() || 'Imagem do conteúdo';
    const imageMarkdown = `\n![${caption}](${imageUrl.trim()})\n`;
    onChange(value + imageMarkdown);

    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
  };

  // Handle local file attachment (Word, Excel, PDF, etc.)
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let type: LessonAttachment['type'] = 'outro';
    if (['doc', 'docx'].includes(ext)) type = 'word';
    else if (['xls', 'xlsx', 'csv'].includes(ext)) type = 'excel';
    else if (['pdf'].includes(ext)) type = 'pdf';
    else if (['ppt', 'pptx'].includes(ext)) type = 'powerpoint';

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = typeof event.target?.result === 'string' ? event.target.result : '';
      const newAttachment: LessonAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        fileName: file.name,
        type: type,
        fileSize: sizeFormatted,
        fileUrl: dataUrl || URL.createObjectURL(file),
      };
      onAddAttachment(newAttachment);

      // Also append a note in the Word document for student awareness
      const downloadTag = `\n\n> 📥 **Material para Download anexado:** [${file.name}] (${sizeFormatted})\n`;
      onChange(value + downloadTag);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // Word count stats
  const wordsCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charsCount = value.length;

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col">
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
              Formatação Rica Word
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
          {/* Group 1: Typography Formatting */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => applyFormat('**', '**', 'negrito')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center font-bold text-xs text-text-primary hover:text-blue-400 cursor-pointer"
              title="Negrito (Ctrl+B)"
            >
              <span className="font-black">B</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('*', '*', 'itálico')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center italic text-xs text-text-primary hover:text-blue-400 cursor-pointer"
              title="Itálico (Ctrl+I)"
            >
              <span className="font-serif italic font-bold">I</span>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('<u>', '</u>', 'texto sublinhado')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-xs text-text-primary hover:text-blue-400 cursor-pointer underline underline-offset-2"
              title="Sublinhado"
            >
              <u>S</u>
            </button>
            <button
              type="button"
              onClick={() => applyFormat('~~', '~~', 'texto tachado')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-xs text-text-primary hover:text-blue-400 cursor-pointer line-through"
              title="Tachado"
            >
              <span className="line-through">abc</span>
            </button>
          </div>

          {/* Group 2: Headings & Styles */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => insertBlock('#')}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-[11px] font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Título 1 (H1)"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertBlock('##')}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-[11px] font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Título 2 (H2)"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertBlock('###')}
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

            {/* Group 4: Lists, Quotes & Callouts */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => insertBlock('•')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Lista com Marcadores"
            >
              <span className="material-symbols-outlined text-base">format_list_bulleted</span>
            </button>
            <button
              type="button"
              onClick={() => insertBlock('1.')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Lista Numerada"
            >
              <span className="material-symbols-outlined text-base">format_list_numbered</span>
            </button>
            <button
              type="button"
              onClick={() => insertBlock('>')}
              className="w-7 h-7 rounded hover:bg-surface-overlay flex items-center justify-center text-text-primary hover:text-blue-400 cursor-pointer"
              title="Citação / Destaque"
            >
              <span className="material-symbols-outlined text-base">format_quote</span>
            </button>
            <button
              type="button"
              onClick={() => insertBlock('> 💡 **Dica do Instrutor:**')}
              className="px-1.5 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-[11px] font-bold text-amber-400 cursor-pointer"
              title="Caixa de Destaque / Dica"
            >
              <span className="material-symbols-outlined text-sm">lightbulb</span>
              <span className="hidden xl:inline">Dica</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const tableTemplate = `\n| Tópico / Conceito | Descrição Prática | Aplicação |\n| :--- | :--- | :--- |\n| Conceito A | Explicação detalhada da regra | Projeto Real |\n| Conceito B | Prática recomendada | Produção |\n`;
                onChange(value + tableTemplate);
              }}
              className="px-1.5 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-[11px] font-bold text-text-secondary hover:text-blue-400 cursor-pointer"
              title="Inserir Tabela Estruturada"
            >
              <span className="material-symbols-outlined text-sm">table_chart</span>
              <span className="hidden xl:inline">Tabela</span>
            </button>
          </div>

          {/* Group 5: Insert Link, Image, Downloadable File */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-border-subtle">
            {/* Insert Link */}
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-xs font-bold text-text-primary hover:text-blue-400 cursor-pointer"
              title="Inserir Hiperlink"
            >
              <span className="material-symbols-outlined text-base text-blue-400">link</span>
              <span className="hidden sm:inline">Link</span>
            </button>

            {/* Insert Image */}
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="px-2 h-7 rounded hover:bg-surface-overlay flex items-center gap-1 text-xs font-bold text-text-primary hover:text-emerald-400 cursor-pointer"
              title="Inserir Imagem Ilustrativa"
            >
              <span className="material-symbols-outlined text-base text-emerald-400">image</span>
              <span className="hidden sm:inline">Imagem</span>
            </button>

            {/* Attach File for Download */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileAttach}
              className="hidden"
              accept=".doc,.docx,.xls,.xlsx,.csv,.pdf,.ppt,.pptx,.zip"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 h-7 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex items-center gap-1 text-xs font-bold text-blue-400 cursor-pointer transition-colors"
              title="Anexar Arquivo para Download (Word, Excel, PDF)"
            >
              <span className="material-symbols-outlined text-base">attach_file</span>
              <span>Anexar Arquivo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Canvas */}
      <div className="p-4 bg-surface-subtle min-h-[320px] flex flex-col items-center">
        {/* Document "Sheet" Frame */}
        <div className="w-full max-w-4xl bg-surface-raised border border-border-subtle rounded-xl shadow-md p-6 sm:p-8 relative min-h-[300px]">
          {/* Subtle document header bar mimicking a Word Page */}
          <div className="border-b border-border-subtle/50 pb-2 mb-4 flex items-center justify-between text-[10px] text-text-tertiary">
            <span>DOCUMENTO DA AULA • FORMATO A4</span>
            <span>MARGENS PADRÃO (2.5 cm)</span>
          </div>

          {viewMode === 'edit' ? (
            <textarea
              ref={textareaRef}
              rows={12}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Digite a descrição detalhada da aula com formatação estilo Word. Utilize títulos, listas de passos, destaques, hiperlinks e referências..."
              className={`w-full bg-transparent border-none outline-none resize-y text-sm text-text-primary leading-relaxed font-sans min-h-[220px] ${
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
            <div className={`text-sm text-text-primary leading-relaxed space-y-3 whitespace-pre-wrap min-h-[220px] ${
              textAlign === 'center'
                ? 'text-center'
                : textAlign === 'right'
                ? 'text-right'
                : textAlign === 'justify'
                ? 'text-justify'
                : 'text-left'
            }`}>
              {value || (
                <span className="text-text-tertiary italic">
                  Nenhum texto informado na descrição detalhada. Clique em "Edição" para redigir o conteúdo.
                </span>
              )}
            </div>
          )}

          {/* Attached Files for Download section inside the Document Footer */}
          {attachments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-base">download</span>
                  Arquivos Anexos para Download ({attachments.length})
                </span>
                <span className="text-[10px] text-text-tertiary">
                  Disponíveis para download pelos alunos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-overlay border border-border-subtle hover:border-primary/40 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        att.type === 'word'
                          ? 'bg-blue-500/15 text-blue-400'
                          : att.type === 'excel'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : att.type === 'pdf'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-purple-500/15 text-purple-400'
                      }`}>
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
            Layout ABNT / Documento Rico
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

      {/* Modal Inserir Imagem */}
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
                  placeholder="Ex: Esquema da arquitetura de microsserviços"
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
                onClick={handleInsertImage}
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
