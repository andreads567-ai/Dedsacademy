import React, { useRef, useState, useEffect } from 'react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSignature: string;
  currentSignatureType: 'upload' | 'draw' | 'automatic';
  currentFontStyle: string;
  studentName: string;
  onSave: (signature: string, type: 'upload' | 'draw' | 'automatic', fontStyle: string) => void;
}

const FONT_OPTIONS = [
  { id: 'font-script', name: 'Cursiva Elegante', fontClass: 'font-serif italic font-medium', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic' } },
  { id: 'font-handwriting', name: 'Manuscrito Fluido', fontClass: 'italic font-light tracking-wider', style: { fontFamily: 'Brush Script MT, cursive, sans-serif' } },
  { id: 'font-formal', name: 'Caligrafia Formal', fontClass: 'font-serif tracking-wide', style: { fontFamily: 'Palatino, "Palatino Linotype", serif', fontStyle: 'italic' } },
  { id: 'font-modern', name: 'Minimalista Moderna', fontClass: 'tracking-widest font-mono uppercase', style: { fontFamily: 'Courier New, monospace' } },
];

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  currentSignature,
  currentSignatureType,
  currentFontStyle,
  studentName,
  onSave,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'draw' | 'automatic'>(currentSignatureType || 'automatic');
  const [selectedFont, setSelectedFont] = useState<string>(currentFontStyle || FONT_OPTIONS[0].id);
  const [uploadedImage, setUploadedImage] = useState<string>(currentSignatureType === 'upload' ? currentSignature : '');
  const [drawnSignatureData, setDrawnSignatureData] = useState<string>(currentSignatureType === 'draw' ? currentSignature : '');

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState('#00b074'); // Emerald signature color
  const [penSize, setPenSize] = useState(2.5);

  useEffect(() => {
    if (isOpen) {
      setActiveSubTab(currentSignatureType || 'automatic');
      setSelectedFont(currentFontStyle || FONT_OPTIONS[0].id);
      if (currentSignatureType === 'upload') setUploadedImage(currentSignature);
      if (currentSignatureType === 'draw') setDrawnSignatureData(currentSignature);
    }
  }, [isOpen, currentSignature, currentSignatureType, currentFontStyle]);

  // Setup canvas when draw tab is open
  useEffect(() => {
    if (isOpen && activeSubTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // If we already have a drawn signature, draw it back
        if (drawnSignatureData) {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHasDrawn(true);
          };
          img.src = drawnSignatureData;
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasDrawn(false);
        }
      }
    }
  }, [isOpen, activeSubTab]);

  if (!isOpen) return null;

  // Drawing handlers (mouse & touch)
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setDrawnSignatureData(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawnSignatureData('');
    setHasDrawn(false);
  };

  // Helper to generate svg/image data for automatic signature
  const generateAutomaticSignatureData = (name: string, fontId: string) => {
    const fontObj = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 500, 140);
      ctx.fillStyle = '#00b074';
      ctx.font = fontId === 'font-handwriting' ? 'italic 38px "Brush Script MT", cursive' : fontId === 'font-formal' ? 'italic 34px "Georgia", serif' : fontId === 'font-modern' ? 'bold 24px "Courier New", monospace' : 'italic 36px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name || 'Aluno Deds Academy', 250, 70);
      return canvas.toDataURL('image/png');
    }
    return '';
  };

  const handleConfirm = () => {
    if (activeSubTab === 'upload') {
      if (!uploadedImage) {
        alert('Por favor, carregue uma imagem de assinatura do seu dispositivo.');
        return;
      }
      onSave(uploadedImage, 'upload', '');
    } else if (activeSubTab === 'draw') {
      if (!hasDrawn && !drawnSignatureData) {
        alert('Por favor, faça sua assinatura na tela ou use outra opção.');
        return;
      }
      onSave(drawnSignatureData, 'draw', '');
    } else {
      // Automatic
      const autoData = generateAutomaticSignatureData(studentName, selectedFont);
      onSave(autoData, 'automatic', selectedFont);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl max-h-[90vh] bg-surface-raised border border-border-subtle rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface-overlay shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-2xl">draw</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Definir Assinatura do Certificado</h3>
              <p className="text-xs text-text-tertiary">
                Escolha como deseja registrar sua assinatura oficial no documento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tabs Selector: 1. Automático | 2. Assinar na Tela | 3. Exportar Imagem */}
        <div className="px-6 pt-4 pb-2 border-b border-border-subtle bg-surface-container-low shrink-0">
          <div className="grid grid-cols-3 gap-2 p-1 bg-surface-overlay rounded-xl border border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveSubTab('automatic')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'automatic'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
              <span>Automático</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('draw')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'draw'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">gesture</span>
              <span>Assinar na Tela</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('upload')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === 'upload'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-sm">upload_file</span>
              <span>Exportar Foto</span>
            </button>
          </div>
        </div>

        {/* Body Content with Scroll */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* TAB 1: AUTOMÁTICO (Estilos de Letra Pré-definidos) */}
          {activeSubTab === 'automatic' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center gap-2.5 text-xs text-primary">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>
                  O sistema gera sua assinatura automaticamente com tipografia caligráfica baseada no nome informado.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-2">
                  Selecione o estilo de letra caligráfica para a sua assinatura:
                </label>
                <div className="space-y-2.5">
                  {FONT_OPTIONS.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedFont(opt.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        selectedFont === opt.id
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-border-subtle bg-surface-overlay hover:border-border-subtle/80'
                      }`}
                    >
                      <div className="flex-1">
                        <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                          {opt.name}
                        </span>
                        <div
                          className="text-2xl text-primary py-1 tracking-wide"
                          style={opt.style}
                        >
                          {studentName || 'Aluno Deds Academy'}
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedFont === opt.id
                            ? 'border-primary bg-primary text-on-primary'
                            : 'border-text-tertiary'
                        }`}
                      >
                        {selectedFont === opt.id && (
                          <span className="material-symbols-outlined text-xs">check</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSINAR NA TELA (Caneta / Mouse) */}
          {activeSubTab === 'draw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-text-secondary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">edit</span>
                  <span>Use o dedo, caneta stylus ou o mouse para assinar no quadro abaixo:</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Cor da caneta */}
                  <div className="flex items-center gap-1 bg-surface-overlay p-1 rounded-lg border border-border-subtle">
                    {['#00b074', '#38bdf8', '#f8fafc'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setPenColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-4 h-4 rounded-full border ${penColor === color ? 'ring-2 ring-white scale-110' : 'opacity-70'}`}
                        title={`Cor: ${color}`}
                      />
                    ))}
                  </div>

                  {/* Limpar Canvas */}
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2.5 py-1 text-xs bg-surface-overlay hover:bg-status-danger/20 text-text-tertiary hover:text-status-danger rounded-lg border border-border-subtle flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    <span>Limpar</span>
                  </button>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="relative border-2 border-dashed border-primary/40 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center p-2">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full max-w-[520px] h-[180px] cursor-crosshair bg-surface-container-lowest touch-none"
                />

                {!hasDrawn && !drawnSignatureData && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center p-4">
                    <span className="material-symbols-outlined text-primary/40 text-3xl mb-1">
                      draw
                    </span>
                    <span className="text-xs text-text-tertiary font-medium">
                      Assine com o mouse ou caneta aqui
                    </span>
                    <span className="text-[10px] text-text-tertiary/70 mt-0.5">
                      Linha de base da assinatura digital
                    </span>
                  </div>
                )}

                {/* Decorative baseline */}
                <div className="w-4/5 h-[1px] bg-border-subtle mt-1 mb-2"></div>
              </div>

              <p className="text-[11px] text-text-tertiary">
                Dica: Você pode limpar e refazer sua assinatura quantas vezes desejar antes de salvar.
              </p>
            </div>
          )}

          {/* TAB 3: EXPORTAR IMAGEM PRONTA */}
          {activeSubTab === 'upload' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-overlay border border-border-subtle text-xs text-text-secondary">
                Carregue uma imagem ou foto com fundo transparente ou branco da sua assinatura oficial (.PNG, .JPG).
              </div>

              <div className="border-2 border-dashed border-border-subtle hover:border-primary rounded-2xl p-6 text-center bg-surface-container-low transition-colors">
                {uploadedImage ? (
                  <div className="space-y-3">
                    <div className="bg-white/5 p-4 rounded-xl border border-border-subtle inline-block max-w-xs">
                      <img
                        src={uploadedImage}
                        alt="Assinatura Carregada"
                        className="max-h-24 max-w-full object-contain mx-auto"
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <label className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg cursor-pointer hover:bg-accent-emerald-bright transition-colors">
                        Substituir Arquivo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setUploadedImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setUploadedImage('')}
                        className="px-3 py-1.5 bg-surface-overlay text-status-danger text-xs font-bold rounded-lg border border-border-subtle hover:bg-status-danger/20 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-2xl">upload_file</span>
                    </div>
                    <span className="text-xs font-bold text-text-primary mb-1">
                      Clique para exportar arquivo de assinatura
                    </span>
                    <span className="text-[11px] text-text-tertiary mb-3">
                      Suporta PNG com transparência, JPEG ou SVG até 5MB
                    </span>
                    <span className="px-4 py-2 bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">folder_open</span>
                      Escolher do Dispositivo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setUploadedImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-overlay shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border-subtle bg-surface-raised hover:bg-surface-container text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-accent-emerald-bright text-on-primary text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">check</span>
            <span>Aplicar Assinatura</span>
          </button>
        </div>
      </div>
    </div>
  );
};
