import React, { useState, useEffect } from 'react';

/**
 * INTERACTIVE NOTICE BOX WITH LIVE COUNTDOWN TIMER & PROGRESS BAR
 */
export interface InteractiveNoticeBoxProps {
  title: string;
  message: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  timerSeconds?: number;
  icon?: string;
}

export const InteractiveNoticeBox: React.FC<InteractiveNoticeBoxProps> = ({
  title,
  message,
  bgColor,
  textColor,
  borderColor,
  timerSeconds,
  icon,
}) => {
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
        backgroundColor: bgColor || '#1E293B',
        color: textColor || '#FEF3C7',
        borderLeft: `5px solid ${borderColor || '#F59E0B'}`,
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
              <span>{timeLeft > 0 ? `${timeLeft}s` : 'Tempo concluído'}</span>
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
              backgroundColor: borderColor || '#F59E0B',
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

export interface TableCardBlock {
  title: string;
  description: string;
  imageUrl?: string;
  linkText?: string;
  linkUrl?: string;
}

/**
 * 16:9 STRUCTURED TABLE CARD COMPONENT (SIDE-BY-SIDE MEDIA & LATERAL TEXT)
 */
export const TableCardItem: React.FC<TableCardBlock> = ({
  title,
  description,
  imageUrl,
  linkText,
  linkUrl,
}) => {
  return (
    <div className="my-4 rounded-2xl bg-white/5 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 shadow-md p-4 sm:p-5 transition-all hover:border-primary/40">
      <div className="flex flex-col sm:flex-row gap-5 items-stretch">
        {/* Media 16:9 / Proportional Area */}
        <div className="w-full sm:w-5/12 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-center relative shadow-inner">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || 'Ilustração do bloco'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <span className="material-symbols-outlined text-3xl mb-1 opacity-60">image</span>
              <span className="text-[11px] font-medium">Proporção 16:9</span>
            </div>
          )}
        </div>

        {/* Lateral Content Box */}
        <div className="w-full sm:w-7/12 flex flex-col justify-between py-1 space-y-3">
          <div className="space-y-2">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {title || 'Título do Bloco'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {description || 'Descrição detalhada e contextualização do conteúdo.'}
            </p>
          </div>

          {linkUrl && (
            <div className="pt-2">
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-all group"
              >
                <span>{linkText || 'Acessar Hiperlink'}</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
                  open_in_new
                </span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface DocumentSheetRendererProps {
  content: string;
  className?: string;
  isSheetPreview?: boolean;
}

/**
 * UNIFIED DOCUMENT & MARKDOWN RENDERER
 * Shared by WordLikeEditor ("Visualizar Folha"), StudentCourseStudyPage and StudentCoursePlayerModal.
 * Converts markdown headings (#, ##, ###), bold (**text**), italics (*text*), underlines (<u>),
 * tables, 16:9 cards, alert boxes, lists and images with complete parity.
 */
export const DocumentSheetRenderer: React.FC<DocumentSheetRendererProps> = ({
  content,
  className = '',
  isSheetPreview = false,
}) => {
  if (!content || !content.trim()) {
    return (
      <div className="py-12 text-center text-slate-400 italic text-sm">
        Nenhum conteúdo digitado para exibição.
      </div>
    );
  }

  // Pre-process inline formatting helper
  const formatInlineText = (text: string): string => {
    return text
      .replace(/<u>(.*?)<\/u>/gi, '<span class="underline underline-offset-2">$1</span>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/~~(.*?)~~/g, '<del class="line-through opacity-70">$1</del>')
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-400 font-semibold underline underline-offset-2">$1</a>'
      );
  };

  // If content contains full raw HTML elements like <div class="deds-card-stack"> or <div class="deds-alert-box">
  // we split by blocks and process line-by-line / block-by-block.
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol
            key={`list-${elements.length}`}
            className="list-decimal pl-6 space-y-2 my-3 text-sm sm:text-base text-slate-800 dark:text-slate-200"
          >
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="list-disc pl-6 space-y-2 my-3 text-sm sm:text-base text-slate-800 dark:text-slate-200"
          >
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

  let inTableCardBlock = false;
  let currentTableCardProps: {
    title: string;
    description: string;
    imageUrl?: string;
    linkText?: string;
    linkUrl?: string;
    rawLines: string[];
  } | null = null;

  let inMarkdownTable = false;
  let markdownTableRows: string[][] = [];

  const flushMarkdownTable = () => {
    if (inMarkdownTable && markdownTableRows.length > 0) {
      const headerRow = markdownTableRows[0];
      const bodyRows = markdownTableRows.slice(1).filter((r) => !r.every((c) => /^:?-+:?$/.test(c.trim())));

      elements.push(
        <div key={`table-${elements.length}`} className="my-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm text-slate-800 dark:text-slate-200 border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-white/10">
              <tr>
                {headerRow.map((col, cIdx) => (
                  <th key={cIdx} className="p-3 sm:p-3.5 border-r last:border-r-0 border-slate-200 dark:border-white/10">
                    <span dangerouslySetInnerHTML={{ __html: formatInlineText(col.trim()) }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {row.map((col, cIdx) => (
                    <td key={cIdx} className="p-3 border-r last:border-r-0 border-slate-200 dark:border-white/10">
                      <span dangerouslySetInnerHTML={{ __html: formatInlineText(col.trim()) }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      markdownTableRows = [];
      inMarkdownTable = false;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // 1. Alert Box Detection (<div class="deds-alert-box" ...>)
    if (trimmed.includes('class="deds-alert-box"') || trimmed.includes("class='deds-alert-box'")) {
      flushList();
      flushMarkdownTable();

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
      continue;
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
      continue;
    }

    // 2. Structured Card Block Detection (<div class="deds-table-card" ...>)
    if (trimmed.includes('class="deds-table-card"') || trimmed.includes("class='deds-table-card'")) {
      flushList();
      flushMarkdownTable();

      const titleMatch = trimmed.match(/data-title="([^"]*)"/);
      const descMatch = trimmed.match(/data-desc="([^"]*)"/);
      const imgMatch = trimmed.match(/data-img="([^"]*)"/);
      const linkTextMatch = trimmed.match(/data-link-text="([^"]*)"/);
      const linkUrlMatch = trimmed.match(/data-link-url="([^"]*)"/);

      if (titleMatch || descMatch || imgMatch) {
        elements.push(
          <TableCardItem
            key={`card-${idx}`}
            title={titleMatch ? titleMatch[1] : 'Tópico de Estudo'}
            description={descMatch ? descMatch[1] : ''}
            imageUrl={imgMatch ? imgMatch[1] : undefined}
            linkText={linkTextMatch ? linkTextMatch[1] : 'Acessar Link'}
            linkUrl={linkUrlMatch ? linkUrlMatch[1] : undefined}
          />
        );
        continue;
      } else {
        inTableCardBlock = true;
        currentTableCardProps = {
          title: '',
          description: '',
          rawLines: [line],
        };
        continue;
      }
    }

    if (inTableCardBlock && currentTableCardProps) {
      currentTableCardProps.rawLines.push(line);
      if (trimmed.includes('</div>')) {
        const blockHtml = currentTableCardProps.rawLines.join('\n');
        const imgMatch = blockHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        const titleMatch = blockHtml.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
        const descMatch = blockHtml.match(/<p[^>]*>(.*?)<\/p>/i);
        const linkMatch = blockHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);

        elements.push(
          <TableCardItem
            key={`card-${idx}`}
            title={titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Tópico de Estudo'}
            description={descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : ''}
            imageUrl={imgMatch ? imgMatch[1] : undefined}
            linkUrl={linkMatch ? linkMatch[1] : undefined}
            linkText={linkMatch ? linkMatch[2].replace(/<[^>]*>/g, '').trim() : undefined}
          />
        );

        inTableCardBlock = false;
        currentTableCardProps = null;
      }
      continue;
    }

    // Skip empty lines & flush lists/tables
    if (!trimmed) {
      flushList();
      flushMarkdownTable();
      continue;
    }

    // 3. Markdown Table rows (| col1 | col2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cols = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      if (!inMarkdownTable) {
        inMarkdownTable = true;
        markdownTableRows = [cols];
      } else {
        markdownTableRows.push(cols);
      }
      continue;
    } else {
      flushMarkdownTable();
    }

    // 4. Markdown Headings (#, ##, ###, and variants like ## Title ## or ##Title##)
    // Matches: # Title, ## Title, ## Title ##, ##Title##
    const headingMatch = trimmed.match(/^(#{1,6})\s*(.*?)\s*#*$/);
    if (headingMatch && headingMatch[2].trim()) {
      flushList();
      const level = headingMatch[1].length;
      const cleanTitle = headingMatch[2].replace(/^#+\s*/, '').replace(/#+$/, '').trim();

      if (level === 1) {
        elements.push(
          <h1
            key={idx}
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/10 pb-3 mt-7 mb-4 tracking-tight"
          >
            {cleanTitle}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2
            key={idx}
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-white/5 pb-2 mt-6 mb-3 tracking-tight"
          >
            {cleanTitle}
          </h2>
        );
      } else {
        elements.push(
          <h3
            key={idx}
            className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2.5"
          >
            {cleanTitle}
          </h3>
        );
      }
      continue;
    }

    // 5. Blockquotes (> Text)
    if (trimmed.startsWith('>')) {
      flushList();
      const quoteContent = trimmed.replace(/^>\s*/, '');
      elements.push(
        <div
          key={idx}
          className="p-4 my-4 rounded-xl bg-blue-500/10 border-l-4 border-blue-500 text-xs sm:text-sm text-slate-800 dark:text-slate-200 shadow-xs"
        >
          <span dangerouslySetInnerHTML={{ __html: formatInlineText(quoteContent) }} />
        </div>
      );
      continue;
    }

    // 6. Numbered Lists (1. Item)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      if (!inList || listType !== 'ol') {
        flushList();
        inList = true;
        listType = 'ol';
      }
      listItems.push(
        <li key={idx}>
          <span dangerouslySetInnerHTML={{ __html: formatInlineText(numMatch[2]) }} />
        </li>
      );
      continue;
    }

    // 7. Bulleted Lists (• Item, - Item, * Item)
    if (trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        flushList();
        inList = true;
        listType = 'ul';
      }
      const bulletContent = trimmed.replace(/^(•|-|\*)\s*/, '');
      listItems.push(
        <li key={idx}>
          <span dangerouslySetInnerHTML={{ __html: formatInlineText(bulletContent) }} />
        </li>
      );
      continue;
    }

    // 8. Embedded Markdown Image (![caption](url))
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      flushList();
      const caption = imgMatch[1];
      const src = imgMatch[2];
      elements.push(
        <div key={idx} className="my-5 text-center">
          <img
            src={src}
            alt={caption || 'Imagem da aula'}
            className="max-h-96 mx-auto rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 object-contain bg-black/40"
            loading="lazy"
          />
          {caption && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2">
              {caption}
            </p>
          )}
        </div>
      );
      continue;
    }

    // 9. Standard HTML <img> tag on its own line
    if (trimmed.startsWith('<img') || trimmed.includes('<img')) {
      const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
      const altMatch = trimmed.match(/alt=["']([^"']+)["']/i);
      if (srcMatch) {
        flushList();
        elements.push(
          <div key={idx} className="my-5 text-center">
            <img
              src={srcMatch[1]}
              alt={altMatch ? altMatch[1] : 'Imagem da aula'}
              className="max-h-96 mx-auto rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 object-contain bg-black/40"
              loading="lazy"
            />
            {altMatch && altMatch[1] && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-2">
                {altMatch[1]}
              </p>
            )}
          </div>
        );
        continue;
      }
    }

    // 10. Standard Paragraph
    flushList();
    elements.push(
      <p
        key={idx}
        className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed my-2.5 font-normal"
        dangerouslySetInnerHTML={{ __html: formatInlineText(trimmed) }}
      />
    );
  }

  flushList();
  flushMarkdownTable();

  return (
    <div className={`space-y-1 ${className}`}>
      {elements}
    </div>
  );
};
