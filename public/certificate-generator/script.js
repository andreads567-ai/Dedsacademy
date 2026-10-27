/**
 * DEDS ACADEMY - SISTEMA DINÂMICO DE CERTIFICADO FRENTE E VERSO
 * Gerenciamento de Dados, QR Code Dinâmico, Assinatura Digital e Exportação PDF
 */

// Estado global dos dados do certificado
const certificadoState = {
  nome: "André de Souza",
  cpf: "123.456.789-00",
  cnpj: "45.678.901/0001-23",
  curso: "Desenvolvimento Web Full Stack & IA",
  horas: "120 horas",
  data: "27 de Maio de 2025",
  codigo: "DA2025-0527-001",
  urlValidacao: "https://www.dedsacademy.com/validar-certificado",
  assinaturaNome: "André de Souza",
  assinaturaImg: null,
  devMode: false
};

// Instância do QRCode
let qrcodeInstance = null;

// Inicialização após carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  carregarDadosDaURL();
  vincularEventosFormulario();
  inicializarCanvasAssinatura();
  atualizarCertificado();
});

/**
 * Lê parâmetros da URL para integração direta com ERP/LMS
 * Exemplo: index.html?nome=André+de+Souza&curso=Node.js&horas=60+horas&data=26/10/2026&codigo=DA2026-001
 */
function carregarDadosDaURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("nome")) certificadoState.nome = params.get("nome");
  if (params.has("cpf")) certificadoState.cpf = params.get("cpf");
  if (params.has("cnpj")) certificadoState.cnpj = params.get("cnpj");
  if (params.has("curso")) certificadoState.curso = params.get("curso");
  if (params.has("horas")) certificadoState.horas = params.get("horas");
  if (params.has("data")) certificadoState.data = params.get("data");
  if (params.has("codigo")) certificadoState.codigo = params.get("codigo");
  if (params.has("url")) certificadoState.urlValidacao = params.get("url");

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

  // Renderiza assinatura (imagem carregada ou texto manuscrito)
  if (containerAssinatura) {
    if (certificadoState.assinaturaImg) {
      containerAssinatura.innerHTML = `<img src="${certificadoState.assinaturaImg}" alt="Assinatura" class="assinatura-img" />`;
    } else {
      containerAssinatura.innerHTML = `<span class="assinatura-texto">${certificadoState.nome || "Assinatura do Aluno"}</span>`;
    }
  }

  if (spanCpfAssinatura) {
    spanCpfAssinatura.textContent = certificadoState.cpf ? `CPF: ${certificadoState.cpf}` : "";
  }
  if (spanCnpjInstituicao) {
    spanCnpjInstituicao.textContent = certificadoState.cnpj ? `CNPJ: ${certificadoState.cnpj}` : "";
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
    spanCnpjVerso.textContent = certificadoState.cnpj ? `CNPJ: ${certificadoState.cnpj}` : "";
  }
  if (tagCpfVerso) tagCpfVerso.textContent = certificadoState.cpf || "000.000.000-00";
  if (tagCnpjVerso) tagCnpjVerso.textContent = certificadoState.cnpj || "00.000.000/0001-00";
  if (tagAlunoVerso) tagAlunoVerso.textContent = certificadoState.nome || "Aluno";

  // Atualiza QR Code dinâmico
  renderizarQRCode();
}

/**
 * Gera e atualiza o QR Code dinâmico do verso apontando para o link de validação
 */
function renderizarQRCode() {
  const qrContainer = document.getElementById("campo-qrcode");
  if (!qrContainer) return;

  qrContainer.innerHTML = "";
  const destinoQR = `${certificadoState.urlValidacao}?codigo=${encodeURIComponent(certificadoState.codigo)}`;

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
      console.warn("Erro ao gerar QRCode com QRCode.js, utilizando fallback", e);
    }
  }

  // Fallback seguro em SVG vetorial caso QRCode.js falhe
  qrContainer.innerHTML = `
    <div style="text-align:center; padding: 6px;">
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#0b2230" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
        <rect x="14" y="14" width="3" height="3"></rect>
        <rect x="18" y="18" width="3" height="3"></rect>
      </svg>
      <div style="font-size: 8px; color: #0b2230; font-weight: 700;">QR CODE ATIVO</div>
    </div>
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
  certificadoState.cnpj = "45.678.901/0001-23";
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
  } else {
    frente.style.display = "block";
    verso.style.display = "block";
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

  window.print();
}

/**
 * Gera e faz download direto do arquivo PDF de alta resolução com as duas páginas
 * Utiliza html2pdf.js com renderização canvas 300DPI
 */
function baixarPDF() {
  const container = document.getElementById("palco-certificados");
  const frente = document.getElementById("certificado-frente");
  const verso = document.getElementById("certificado-verso");

  // Garante visibilidade de ambas as páginas e aplica estilo de exportação
  frente.style.display = "block";
  verso.style.display = "block";
  document.body.classList.add("exportando-pdf");

  const nomeSanitizado = (certificadoState.nome || "Aluno")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const options = {
    margin: 0,
    filename: `Certificado_DedsAcademy_${nomeSanitizado}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0
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
