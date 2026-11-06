/**
 * DEDS ACADEMY - SISTEMA DINÂMICO DE CERTIFICADO FRENTE E VERSO
 * Gerenciamento de Dados, QR Code Dinâmico, Assinatura Digital e Exportação PDF
 */

function obterCnpjAtivo() {
  try {
    const s = localStorage.getItem("deds_institution_cnpj");
    if (s && s.trim()) return s.trim();
  } catch (e) {}
  return "45.678.901/0001-23";
}

// Estado global dos dados do certificado
const certificadoState = {
  nome: "",
  cpf: "",
  cnpj: obterCnpjAtivo(),
  curso: "",
  horas: "",
  data: "",
  codigo: "",
  urlValidacao: "https://www.dedsacademy.com.br/validar-certificado",
  assinaturaNome: "",
  assinaturaImg: null,
  devMode: false
};

// Instância do QRCode
let qrcodeInstance = null;

function inicializarApp() {
  carregarDadosDaURL();
  vincularEventosFormulario();
  inicializarCanvasAssinatura();
  atualizarCertificado();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      atualizarAssinaturaAluno();
    });
  }

  // Notifica o sistema pai que o gerador está pronto para receber dados
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "DEDS_CERTIFICATE_READY" }, "*");
    }
  } catch (e) {}
}

// Inicialização segura compatível com execução em iframe e carregamento assíncrono
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarApp);
} else {
  inicializarApp();
}

// Função global para sincronização direta instantânea (sem depender de eventos assíncronos)
window.sincronizarCertificado = function(data) {
  if (!data) return;
  if (data.nome !== undefined) certificadoState.nome = data.nome;
  if (data.cpf !== undefined) certificadoState.cpf = data.cpf;
  if (data.cnpj !== undefined && data.cnpj.trim()) {
    const sCnpj = data.cnpj.trim();
    certificadoState.cnpj = (sCnpj !== "45.678.901/0001-23") ? sCnpj : (obterCnpjAtivo() || sCnpj);
  } else {
    certificadoState.cnpj = obterCnpjAtivo();
  }
  if (data.curso !== undefined) certificadoState.curso = data.curso;
  if (data.horas !== undefined) certificadoState.horas = data.horas;
  if (data.data !== undefined) certificadoState.data = data.data;
  if (data.codigo !== undefined) certificadoState.codigo = data.codigo;
  if (data.url !== undefined) certificadoState.urlValidacao = data.url;
  if (data.assinaturaImg !== undefined) certificadoState.assinaturaImg = data.assinaturaImg;

  const elNome = document.getElementById("input-nome");
  const elCpf = document.getElementById("input-cpf");
  const elCnpj = document.getElementById("input-cnpj");
  const elCurso = document.getElementById("input-curso");
  const elHoras = document.getElementById("input-horas");
  const elData = document.getElementById("input-data");
  const elCodigo = document.getElementById("input-codigo");
  const elUrl = document.getElementById("input-url");

  if (elNome && data.nome !== undefined) elNome.value = data.nome;
  if (elCpf && data.cpf !== undefined) elCpf.value = data.cpf;
  if (elCnpj && data.cnpj !== undefined) elCnpj.value = data.cnpj;
  if (elCurso && data.curso !== undefined) elCurso.value = data.curso;
  if (elHoras && data.horas !== undefined) elHoras.value = data.horas;
  if (elData && data.data !== undefined) elData.value = data.data;
  if (elCodigo && data.codigo !== undefined) elCodigo.value = data.codigo;
  if (elUrl && data.url !== undefined) elUrl.value = data.url;

  if (data.lado) {
    alternarVisualizacao(data.lado);
  }

  atualizarCertificado();
};

// Listener para sincronização direta com o sistema Deds Academy (via iframe ou postMessage)
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "DEDS_UPDATE_CERTIFICATE") {
    window.sincronizarCertificado(event.data.payload);
  }
});

/**
 * Lê parâmetros da URL para integração direta com ERP/LMS
 * Exemplo: index.html?nome=André+de+Souza&curso=Node.js&horas=60+horas&data=26/10/2026&codigo=DA2026-001
 */
function carregarDadosDaURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("nome")) certificadoState.nome = params.get("nome");
  if (params.has("cpf")) certificadoState.cpf = params.get("cpf");
  if (params.has("cnpj") && params.get("cnpj").trim()) {
    const pCnpj = params.get("cnpj").trim();
    certificadoState.cnpj = (pCnpj !== "45.678.901/0001-23") ? pCnpj : (obterCnpjAtivo() || pCnpj);
  } else {
    certificadoState.cnpj = obterCnpjAtivo();
  }
  if (params.has("curso")) certificadoState.curso = params.get("curso");
  if (params.has("horas")) certificadoState.horas = params.get("horas");
  if (params.has("data")) certificadoState.data = params.get("data");
  if (params.has("codigo")) certificadoState.codigo = params.get("codigo");
  if (params.has("url")) certificadoState.urlValidacao = params.get("url");
  if (params.has("assinaturaImg")) certificadoState.assinaturaImg = params.get("assinaturaImg");

  // Apenas no modo avulso fora de iframe e sem parâmetros de busca pré-definidos
  if (!certificadoState.nome && window.self === window.top && !window.location.search) {
    certificadoState.nome = "André de Souza";
    certificadoState.cpf = "123.456.789-00";
    certificadoState.curso = "Desenvolvimento Web Full Stack & IA";
    certificadoState.horas = "120 horas";
    certificadoState.data = "27 de Maio de 2025";
    certificadoState.codigo = "DA2025-0527-001";
  }

  if (!certificadoState.codigo) {
    certificadoState.codigo = "DA" + new Date().getFullYear() + "-0001";
  }

  // Modo preview (oculta o painel de controle para exibição em modais ou visualização pública)
  const isPreview =
    params.get("preview") === "1" ||
    params.get("preview") === "true" ||
    params.get("readonly") === "1" ||
    params.get("readonly") === "true" ||
    window.self !== window.top;

  if (isPreview) {
    document.documentElement.classList.add("modo-preview");
    document.body.classList.add("modo-preview");
    const painel = document.querySelector(".painel-controle");
    if (painel) painel.style.display = "none";
  }

  if (params.has("lado")) {
    const lado = params.get("lado");
    setTimeout(() => alternarVisualizacao(lado), 50);
  }

  // Preenche os campos do formulário com os valores iniciais
  const elNome = document.getElementById("input-nome");
  const elCpf = document.getElementById("input-cpf");
  const elCnpj = document.getElementById("input-cnpj");
  const elCurso = document.getElementById("input-curso");
  const elHoras = document.getElementById("input-horas");
  const elData = document.getElementById("input-data");
  const elCodigo = document.getElementById("input-codigo");
  const elUrl = document.getElementById("input-url");

  if (elNome) elNome.value = certificadoState.nome;
  if (elCpf) elCpf.value = certificadoState.cpf;
  if (elCnpj) elCnpj.value = certificadoState.cnpj;
  if (elCurso) elCurso.value = certificadoState.curso;
  if (elHoras) elHoras.value = certificadoState.horas;
  if (elData) elData.value = certificadoState.data;
  if (elCodigo) elCodigo.value = certificadoState.codigo;
  if (elUrl) elUrl.value = certificadoState.urlValidacao;
}

/**
 * Vincula listeners aos inputs do formulário para atualização em tempo real
 */
function vincularEventosFormulario() {
  const ligarInput = (id, prop) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", (e) => {
        certificadoState[prop] = e.target.value;
        if (prop === "cnpj" && e.target.value.trim()) {
          try {
            localStorage.setItem("deds_institution_cnpj", e.target.value.trim());
          } catch (err) {}
        }
        atualizarCertificado();
      });
    }
  };

  ligarInput("input-nome", "nome");
  ligarInput("input-cpf", "cpf");
  ligarInput("input-cnpj", "cnpj");
  ligarInput("input-curso", "curso");
  ligarInput("input-horas", "horas");
  ligarInput("input-data", "data");
  ligarInput("input-codigo", "codigo");
  ligarInput("input-url", "urlValidacao");

  // Upload de imagem da assinatura do aluno
  const inputAssinatura = document.getElementById("input-assinatura-arquivo");
  if (inputAssinatura) {
    inputAssinatura.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          certificadoState.assinaturaImg = event.target.result;
          atualizarCertificado();
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Atualiza todos os elementos visuais do certificado frente e verso
 */
function atualizarCertificado() {
  const cnpjEfetivo = certificadoState.cnpj || obterCnpjAtivo();

  // Frente
  const spanAluno = document.getElementById("campo-aluno");
  const spanCpfAluno = document.getElementById("campo-cpf-aluno");
  const spanCurso = document.getElementById("campo-curso");
  const spanHoras = document.getElementById("campo-horas");
  const spanData = document.getElementById("campo-data");
  const spanCodigoFrente = document.getElementById("campo-codigo-frente");
  const containerAssinatura = document.getElementById("campo-assinatura-aluno");
  const spanCpfAssinatura = document.getElementById("campo-cpf-assinatura");
  const spanCnpjInstituicao = document.getElementById("campo-cnpj-instituicao");

  if (spanAluno) spanAluno.textContent = certificadoState.nome;
  if (spanCpfAluno) {
    spanCpfAluno.textContent = certificadoState.cpf ? `CPF: ${certificadoState.cpf}` : "";
  }
  if (spanCurso) spanCurso.textContent = certificadoState.curso;
  if (spanHoras) spanHoras.textContent = certificadoState.horas;
  if (spanData) spanData.textContent = certificadoState.data;
  if (spanCodigoFrente) spanCodigoFrente.textContent = certificadoState.codigo;

  // Renderiza assinatura (imagem carregada ou texto manuscrito auto-ajustado)
  atualizarAssinaturaAluno();

  if (spanCpfAssinatura) {
    spanCpfAssinatura.textContent = certificadoState.cpf ? `CPF: ${certificadoState.cpf}` : "";
  }
  if (spanCnpjInstituicao) {
    spanCnpjInstituicao.textContent = cnpjEfetivo ? `CNPJ: ${cnpjEfetivo}` : "";
  }

  // Verso
  const spanCodigoVerso = document.getElementById("campo-codigo-verso");
  const linkValidar = document.getElementById("campo-link-validar");
  const spanCnpjVerso = document.getElementById("campo-cnpj-verso");
  const tagCpfVerso = document.getElementById("tag-cpf-verso");
  const tagCnpjVerso = document.getElementById("tag-cnpj-verso");
  const tagAlunoVerso = document.getElementById("tag-aluno-verso");

  if (spanCodigoVerso) spanCodigoVerso.textContent = certificadoState.codigo;
  if (linkValidar) {
    linkValidar.textContent = certificadoState.urlValidacao.replace(/^https?:\/\//, "");
    linkValidar.href = `${certificadoState.urlValidacao}?codigo=${encodeURIComponent(certificadoState.codigo)}`;
  }
  if (spanCnpjVerso) {
    spanCnpjVerso.textContent = cnpjEfetivo ? `CNPJ: ${cnpjEfetivo}` : "";
  }
  if (tagCpfVerso) tagCpfVerso.textContent = certificadoState.cpf || "000.000.000-00";
  if (tagCnpjVerso) tagCnpjVerso.textContent = cnpjEfetivo || "00.000.000/0001-00";
  if (tagAlunoVerso) tagAlunoVerso.textContent = certificadoState.nome || "Aluno";

  // Atualiza QR Code dinâmico
  renderizarQRCode();
}

/**
 * Renderiza e ajusta automaticamente o tamanho e a proporção da assinatura do aluno.
 * Se o nome for longo, reduz a fonte proporcionalmente e faz a quebra de texto,
 * aproximando as linhas com espaçamento reduzido e harmonioso (line-height otimizado),
 * garantindo que não sobreponha a coluna de curso e mantenha a proporção ideal.
 */
function atualizarAssinaturaAluno() {
  const container = document.getElementById("campo-assinatura-aluno");
  if (!container) return;

  // Se o aluno desenhou na tela ou carregou uma imagem de assinatura
  if (certificadoState.assinaturaImg) {
    const badge = container.querySelector(".dev-coords-badge");
    const badgeHTML = badge ? badge.outerHTML : '<span class="dev-coords-badge">Top: 78.8% Left: 14.5%</span>';
    container.innerHTML = `<img src="${certificadoState.assinaturaImg}" alt="Assinatura" class="assinatura-img" />${badgeHTML}`;
    return;
  }

  const nomeLimpo = (certificadoState.nome || "").trim().replace(/\s+/g, " ");
  const textoExibicao = nomeLimpo || "Assinatura do Aluno";

  // Preserva badge do modo dev se existir
  const badge = container.querySelector(".dev-coords-badge");
  const badgeHTML = badge ? badge.outerHTML : '<span class="dev-coords-badge">Top: 78.8% Left: 14.5%</span>';

  container.innerHTML = `<span class="assinatura-texto">${textoExibicao}</span>${badgeHTML}`;
  const span = container.querySelector(".assinatura-texto");
  if (!span) return;

  // Escala inicial de tamanho de fonte baseado na extensão do nome
  const len = textoExibicao.length;
  let fontSize;

  if (len <= 15) {
    fontSize = 32; // Ex: "André de Souza"
  } else if (len <= 22) {
    fontSize = 26; // Ex: "Carlos Eduardo Lima"
  } else if (len <= 36) {
    fontSize = 21; // Ex: "João Carlos da Silva Souza Conceição"
  } else if (len <= 46) {
    fontSize = 18; // Ex: "André de Souza antonio abreu junior santos"
  } else {
    fontSize = 15; // Nomes excepcionalmente longos
  }

  span.style.fontSize = `${fontSize}px`;

  // Limite máximo de altura disponível para a assinatura (62px)
  // para evitar qualquer colisão com o campo de curso acima (bottom do curso em y:559px, assinatura em y:566px)
  const maxHeight = 62;

  // Redução dinâmica progressiva caso a quebra resulte em altura superior ao espaço seguro
  while (span.offsetHeight > maxHeight && fontSize > 11) {
    fontSize -= 0.5;
    span.style.fontSize = `${fontSize}px`;
  }
}

/**
 * Gera e atualiza o QR Code dinâmico do verso apontando para o link de validação
 */
function renderizarQRCode() {
  const qrContainer = document.getElementById("campo-qrcode");
  if (!qrContainer) return;

  qrContainer.innerHTML = "";
  const codigoAtivo = certificadoState.codigo || "DA" + new Date().getFullYear() + "-0001";
  const urlBase = certificadoState.urlValidacao || "https://www.dedsacademy.com.br/validar-certificado";
  const destinoQR = `${urlBase}?codigo=${encodeURIComponent(codigoAtivo)}`;

  if (typeof QRCode !== "undefined") {
    try {
      qrcodeInstance = new QRCode(qrContainer, {
        text: destinoQR,
        width: 136,
        height: 136,
        colorDark: "#0b2230",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
      return;
    } catch (e) {
      console.warn("QRCode.js falhou, utilizando gerador nativo:", e);
    }
  }

  // Fallback seguro com imagem QR Code de alta resolução
  const encodedDestino = encodeURIComponent(destinoQR);
  qrContainer.innerHTML = `
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=136x136&data=${encodedDestino}&color=0b2230&bgcolor=ffffff" 
         alt="QR Code de Validação" 
         style="width:136px;height:136px;display:block;margin:0 auto;object-fit:contain;" />
  `;
}

/**
 * Gera código variado aleatório (com letras e números, padrão solicitado)
 * Ex: DA2026-X84-001
 */
function gerarCodigoAleatorio() {
  const ano = new Date().getFullYear();
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letra = caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  const numMeio = String(Math.floor(Math.random() * 90 + 10)); // 2 digitos
  const numFinal = String(Math.floor(Math.random() * 900 + 100)); // 3 digitos

  const novoCodigo = `DA${ano}-${letra}${numMeio}-${numFinal}`;
  certificadoState.codigo = novoCodigo;

  const elCodigo = document.getElementById("input-codigo");
  if (elCodigo) elCodigo.value = novoCodigo;

  atualizarCertificado();
}

/**
 * Carrega dados de exemplo para demonstração
 */
function carregarExemploAndre() {
  certificadoState.nome = "André de Souza";
  certificadoState.cpf = "123.456.789-00";
  certificadoState.cnpj = obterCnpjAtivo() || "45.678.901/0001-23";
  certificadoState.curso = "Desenvolvimento Web Full Stack & IA";
  certificadoState.horas = "120 horas";
  certificadoState.data = "27 de Maio de 2025";
  certificadoState.codigo = "DA2025-0527-001";
  certificadoState.assinaturaImg = null;

  carregarDadosDaURL();
  atualizarCertificado();
}

/**
 * Alterna visualização entre Ambos, Apenas Frente e Apenas Verso
 */
function alternarVisualizacao(modo, btnElement) {
  const frente = document.getElementById("certificado-frente");
  const verso = document.getElementById("certificado-verso");
  const tabs = document.querySelectorAll(".tab-btn");

  tabs.forEach((tab) => tab.classList.remove("active"));
  if (btnElement) {
    btnElement.classList.add("active");
  }

  if (modo === "frente") {
    frente.style.display = "block";
    verso.style.display = "none";
  } else if (modo === "verso") {
    frente.style.display = "none";
    verso.style.display = "block";
    renderizarQRCode();
  } else {
    frente.style.display = "block";
    verso.style.display = "block";
    renderizarQRCode();
  }

  if (modo !== "verso") {
    atualizarAssinaturaAluno();
  }
}

/**
 * Alterna o Modo Desenvolvedor com exibição de coordenadas e outlines
 */
function alternarModoDev() {
  certificadoState.devMode = !certificadoState.devMode;
  document.body.classList.toggle("dev-mode-active", certificadoState.devMode);

  const btn = document.getElementById("btn-dev-mode");
  if (btn) {
    btn.textContent = certificadoState.devMode ? "Modo Dev: ATIVO" : "Ajuste Fino (Dev)";
    btn.style.background = certificadoState.devMode ? "#dc2626" : "";
    btn.style.color = certificadoState.devMode ? "#ffffff" : "";
  }
}

/**
 * Dispara o diálogo nativo do navegador para imprimir ou salvar como PDF
 * Utiliza as regras de @media print (A4 paisagem, margem zero, sem cabeçalhos)
 */
function imprimirCertificado() {
  // Garante que ambos os lados estejam visíveis para a impressão
  const frente = document.getElementById("certificado-frente");
  const verso = document.getElementById("certificado-verso");
  frente.style.display = "block";
  verso.style.display = "block";
  atualizarAssinaturaAluno();

  window.print();
}

/**
 * Gera e faz download direto do arquivo PDF de alta resolução com as duas páginas
 * Utiliza html2pdf.js com renderização canvas 300DPI
 */
async function baixarPDF() {
  const container = document.getElementById("palco-certificados");
  const frente = document.getElementById("certificado-frente");
  const verso = document.getElementById("certificado-verso");

  // Garante visibilidade de ambas as páginas e aplica estilo de exportação
  frente.style.display = "block";
  verso.style.display = "block";
  atualizarAssinaturaAluno();
  document.body.classList.add("exportando-pdf");

  const nomeSanitizado = (certificadoState.nome || "Aluno")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  // Garante que todas as fontes estejam prontas antes de rasterizar o canvas
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {}
  }

  const options = {
    margin: 0,
    filename: `Certificado_DedsAcademy_${nomeSanitizado}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 1024
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "landscape"
    },
    pagebreak: { mode: ["css", "legacy"] }
  };

  // Feedback visual de download
  const btnPDF = document.getElementById("btn-baixar-pdf");
  const textoOriginal = btnPDF ? btnPDF.innerHTML : "";
  if (btnPDF) {
    btnPDF.disabled = true;
    btnPDF.innerHTML = "<span>Gerando PDF...</span>";
  }

  const restaurarUI = () => {
    document.body.classList.remove("exportando-pdf");
    if (btnPDF) {
      btnPDF.disabled = false;
      btnPDF.innerHTML = textoOriginal;
    }
  };

  if (typeof html2pdf !== "undefined") {
    html2pdf()
      .set(options)
      .from(container)
      .save()
      .then(restaurarUI)
      .catch((err) => {
        console.error("Falha ao exportar com html2pdf, abrindo janela de impressão:", err);
        restaurarUI();
        imprimirCertificado();
      });
  } else {
    // Fallback: comando de impressão nativo com salvar em PDF
    restaurarUI();
    imprimirCertificado();
  }
}

/**
 * Modal e Pad de Assinatura Digital do Aluno
 */
let signatureCanvas, signatureCtx, isDrawing = false;

function inicializarCanvasAssinatura() {
  signatureCanvas = document.getElementById("signature-pad");
  if (!signatureCanvas) return;
  signatureCtx = signatureCanvas.getContext("2d");
  signatureCtx.strokeStyle = "#0b2230";
  signatureCtx.lineWidth = 2.5;
  signatureCtx.lineCap = "round";
  signatureCtx.lineJoin = "round";

  const getPos = (e) => {
    const rect = signatureCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDraw = (e) => {
    isDrawing = true;
    const pos = getPos(e);
    signatureCtx.beginPath();
    signatureCtx.moveTo(pos.x, pos.y);
    e.preventDefault();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    signatureCtx.lineTo(pos.x, pos.y);
    signatureCtx.stroke();
    e.preventDefault();
  };

  const stopDraw = () => {
    isDrawing = false;
  };

  signatureCanvas.addEventListener("mousedown", startDraw);
  signatureCanvas.addEventListener("mousemove", draw);
  signatureCanvas.addEventListener("mouseup", stopDraw);
  signatureCanvas.addEventListener("mouseleave", stopDraw);

  signatureCanvas.addEventListener("touchstart", startDraw, { passive: false });
  signatureCanvas.addEventListener("touchmove", draw, { passive: false });
  signatureCanvas.addEventListener("touchend", stopDraw);
}

function abrirModalAssinatura() {
  const modal = document.getElementById("modal-assinatura");
  if (modal) modal.style.display = "flex";
  limparAssinaturaPad();
}

function fecharModalAssinatura() {
  const modal = document.getElementById("modal-assinatura");
  if (modal) modal.style.display = "none";
}

function limparAssinaturaPad() {
  if (signatureCanvas && signatureCtx) {
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  }
}

function salvarAssinaturaPad() {
  if (signatureCanvas) {
    certificadoState.assinaturaImg = signatureCanvas.toDataURL("image/png");
    atualizarCertificado();
    fecharModalAssinatura();
  }
}

function resetarAssinaturaFonte() {
  certificadoState.assinaturaImg = null;
  atualizarCertificado();
  fecharModalAssinatura();
}
