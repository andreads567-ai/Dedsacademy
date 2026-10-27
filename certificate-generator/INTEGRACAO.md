# 🎓 Deds Academy — Guia Completo do Sistema de Certificado Frente e Verso (A4)

Este documento detalha o funcionamento, estrutura, coordenadas pixel-perfect e os métodos de integração do sistema de certificados com o seu **ERP ou Plataforma de Cursos Deds Academy**.

---

## 📁 Passo 1: Organização dos Arquivos no Projeto

A estrutura de arquivos foi organizada com nomes curtos, diretos e sem espaços:

```text
calm-borg/
├── index.html               # Estrutura HTML do certificado frente e verso
├── style.css                # CSS de layout, posicionamento absoluto e @media print
├── script.js                # Lógica dinâmica, QR Code, assinatura digital e geração de PDF
├── frente.png               # Imagem de fundo da Frente (1024x724 - A4 Paisagem limpa)
├── verso.png                # Imagem de fundo do Verso (1024x724 - A4 Paisagem limpa)
├── frente_modelo.png        # Arte original com dados de exemplo (backup)
├── verso_modelo.png         # Arte original do verso com dados de exemplo (backup)
├── qrcode.min.js            # Biblioteca local para geração de QR Code dinâmico offline
└── html2pdf.bundle.min.js   # Biblioteca local para download de PDF 300DPI frente e verso
```

---

## 📐 Passo 2 e 3: Dimensões e Estilo da Frente

- **Proporção A4 Paisagem**: 297mm × 210mm (proporção $\sqrt{2} \approx 1.4142$).
- **Resolução Base Digital**: `1024px` de largura × `724px` de altura.
- **Propriedades CSS de Fundo**:
  ```css
  .certificado-pagina.frente {
    position: relative;
    width: 1024px;
    height: 724px;
    background-image: url('frente.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    overflow: hidden;
  }
  ```

---

## 🎯 Passo 4: Estrutura do Verso

O verso utiliza a mesma proporção e dimensões exatas em um bloco separado:

```css
.certificado-pagina.verso {
  position: relative;
  width: 1024px;
  height: 724px;
  background-image: url('verso.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}
```

Campos dinâmicos do verso:
1. **QR Code Dinâmico**: gerado em tempo real com o link de validação e o código do aluno.
2. **Link de Validação**: texto clicável (`www.dedsacademy.com/validar-certificado`).
3. **Pill de Código em Destaque**: caixa branca no rodapé com o código alfanumérico.
4. **Registro de Autenticidade Digital**: carimbo e hash com base na Lei Federal 14.063/2020.

---

## 📍 Passo 6: Tabela de Coordenadas Pixel-Perfect (Top / Left)

Todos os textos estão posicionados milimetricamente sobre os espaços em branco da arte:

### 🔹 Frente (`#certificado-frente`)
| Campo | Seletor | Top | Left | Largura | Altura | Tipografia | Cor |
|---|---|---|---|---|---|---|---|
| **Nome do Aluno** | `.campo-aluno` | `300px` | `175px` | `674px` | `84px` | Great Vibes (48px) | `#091e2b` |
| **CPF do Aluno** | `.campo-cpf-aluno` | `388px` | `175px` | `674px` | `16px` | Montserrat 600 (10.5px) | `#4b5563` |
| **Nome do Curso** | `.campo-curso` | `521px` | `82px` | `198px` | `38px` | Montserrat 700 (13px) | `#1a2941` |
| **Carga Horária** | `.campo-horas` | `521px` | `295px` | `162px` | `38px` | Montserrat 700 (13.5px) | `#1a2941` |
| **Data de Conclusão** | `.campo-data` | `521px` | `478px` | `192px` | `38px` | Montserrat 700 (13px) | `#1a2941` |
| **Código do Certificado** | `.campo-codigo-frente` | `521px` | `677px` | `190px` | `38px` | Montserrat 700 (13px) | `#1a2941` |
| **Assinatura do Aluno** | `.campo-assinatura-aluno` | `566px` | `140px` | `215px` | `66px` | Alex Brush (34px) / Imagem | `#0b2230` |
| **CPF na Assinatura** | `.campo-cpf-assinatura` | `672px` | `140px` | `215px` | `18px` | Montserrat 600 (9.5px) | `#475569` |
| **CNPJ Deds Academy** | `.campo-cnpj-instituicao` | `672px` | `600px` | `280px` | `18px` | Montserrat 600 (9.5px) | `#475569` |

### 🔹 Verso (`#certificado-verso`)
| Campo | Seletor | Top | Left | Largura | Altura | Tipografia | Cor |
|---|---|---|---|---|---|---|---|
| **QR Code Dinâmico** | `.campo-qrcode` | `346px` | `646px` | `140px` | `140px` | Canvas/SVG dinâmico | `#0b2230` |
| **Link de Validação** | `.campo-link-validar` | `494px` | `624px` | `184px` | — | Montserrat 600 (8px) | `#006756` |
| **Código em Destaque** | `.campo-codigo-verso` | `556px` | `360px` | `405px` | `44px` | Montserrat 800 (26px) | `#082132` |
| **CNPJ no Verso** | `.campo-cnpj-verso` | `486px` | `106px` | `220px` | — | Montserrat 600 (8.5px) | `#006756` |
| **Carimbo Digital Completo** | `.campo-autenticidade-digital` | `Bottom: 24px` | `Center` | Auto | — | Montserrat 500 (8.5px) | `#64748b` |

> 💡 **Dica de Ajuste Fino**: Clique no botão **`📐 Ajuste Fino (Dev)`** no painel superior. Ele ativará um contorno pontilhado vermelho com a indicação exata de X e Y sobre cada campo.

---

## 🔗 Passo 5 e 8: Integração com o ERP / Banco de Dados

Você pode integrar este certificado com o seu sistema de 3 formas simples:

### Método A: Parâmetros na URL (Recomendado para visualização do aluno)
O sistema lê os parâmetros via `URLSearchParams` automaticamente. O seu ERP só precisa gerar um link:

```text
index.html?nome=André+de+Souza&cpf=123.456.789-00&cnpj=45.678.901/0001-23&curso=Desenvolvimento+Web+Full+Stack&horas=120+horas&data=27+de+Maio+de+2025&codigo=DA2025-0527-001
```

### Método B: Substituição de Placeholders no Backend (PHP / Laravel / WordPress)
No seu arquivo `.php` ou template engine:

```php
<?php
// Exemplo de integração PHP com banco de dados do curso
$aluno = [
    'nome'   => 'André de Souza',
    'cpf'    => '123.456.789-00',
    'cnpj'   => '45.678.901/0001-23',
    'curso'  => 'Desenvolvimento Web Full Stack & IA',
    'horas'  => '120 horas',
    'data'   => '27 de Outubro de 2026',
    'codigo' => 'DA2026-A48-921',
    'url'    => 'https://www.dedsacademy.com/validar-certificado'
];

$html = file_get_contents('index.html');
$html = str_replace('André de Souza', htmlspecialchars($aluno['nome']), $html);
$html = str_replace('123.456.789-00', htmlspecialchars($aluno['cpf']), $html);
$html = str_replace('45.678.901/0001-23', htmlspecialchars($aluno['cnpj']), $html);
$html = str_replace('Desenvolvimento Web Full Stack & IA', htmlspecialchars($aluno['curso']), $html);
$html = str_replace('120 horas', htmlspecialchars($aluno['horas']), $html);
$html = str_replace('27 de Maio de 2025', htmlspecialchars($aluno['data']), $html);
$html = str_replace('DA2025-0527-001', htmlspecialchars($aluno['codigo']), $html);

echo $html;
?>
```

### Método C: Chamada JavaScript / API (Node.js / React / Vue)
Você pode chamar diretamente a função `atualizarCertificado()` passando o objeto:

```javascript
certificadoState.nome = "André de Souza";
certificadoState.curso = "Inteligência Artificial Aplicada";
certificadoState.horas = "160 horas";
certificadoState.data = "26/10/2026";
certificadoState.codigo = "DA2026-X99-777";
atualizarCertificado();
```

---

## 🖨️ Passo 9: Geração do PDF Final Frente e Verso

### 1. Botão "Baixar PDF Frente e Verso"
- Utiliza a biblioteca `html2pdf.js` incluída localmente.
- Gera automaticamente um PDF vetorial com 2 páginas, nomeado como `Certificado_DedsAcademy_[Nome_do_Aluno].pdf`.
- Escala de renderização: **2x (300 DPI)** para impressão nítida sem perda de resolução.

### 2. Botão "Imprimir A4" / `window.print()`
Configurado via CSS `@media print` para:
- Tamanho exato: `@page { size: A4 landscape; margin: 0; }`
- Cada lado ocupa exatamente uma página de `297mm × 210mm`.
- Quebra de página automática com `page-break-after: always`.
- Ocultação completa do painel superior, botões e barras.

#### ⚙️ Dica para salvar pelo navegador (Chrome / Microsoft Edge):
1. Clique em **Imprimir A4** (ou `Ctrl + P`).
2. Em **Destino**, escolha **Salvar como PDF**.
3. Em **Layout**, confirme **Paisagem**.
4. Em **Mais definições**:
   - **Tamanho do papel**: A4
   - **Margens**: Nenhuma
   - **Gráficos de segundo plano**: **Marcado (Ativado)** ✅
   - **Cabeçalhos e rodapés**: **Desmarcado (Desativado)** ❌

---

## ✍️ Assinatura do Aluno na Plataforma

O sistema já inclui 3 modos de assinatura integrados:
1. **Fonte Caligráfica Automática**: Converte o nome digitado em uma caligrafia cursiva elegante.
2. **Desenho na Tela (Mouse / Touch)**: Clique em `✍️ Assinar na Tela` para abrir o pad onde o aluno assina com o dedo no celular ou mouse no PC.
3. **Upload de Imagem**: Envie uma foto ou scan transparente da assinatura física do aluno.
