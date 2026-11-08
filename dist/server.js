var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/lib/supabaseClient.ts
var supabaseClient_exports = {};
__export(supabaseClient_exports, {
  supabase: () => supabase,
  supabaseAnonKey: () => supabaseAnonKey,
  supabaseUrl: () => supabaseUrl
});
import { createClient } from "@supabase/supabase-js";
var metaEnv, procEnv, supabaseUrl, supabaseAnonKey, supabase;
var init_supabaseClient = __esm({
  "src/lib/supabaseClient.ts"() {
    metaEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : null;
    procEnv = typeof process !== "undefined" && process.env ? process.env : null;
    supabaseUrl = metaEnv?.VITE_SUPABASE_URL || procEnv?.VITE_SUPABASE_URL || procEnv?.SUPABASE_URL || "https://berjxxsglkwtciiltvri.supabase.co";
    supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY || procEnv?.VITE_SUPABASE_ANON_KEY || procEnv?.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcmp4eHNnbGt3dGNpaWx0dnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2ODEwOTQsImV4cCI6MjEwOTI1NzA5NH0.L3DF85lkE3ec-A3D1fPt4QsFXj6r3Xxmrw1awUq2xeE";
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
});

// server.ts
import express from "express";
import dotenv from "dotenv";
import path2 from "path";
import fs2 from "fs";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/api/stripeHandler.ts
function buildFormData(data, form = new URLSearchParams(), parentKey = "") {
  if (data === null || data === void 0) return form;
  if (typeof data === "object" && !(data instanceof Date)) {
    if (Array.isArray(data)) {
      data.forEach((val, idx) => {
        buildFormData(val, form, `${parentKey}[${idx}]`);
      });
    } else {
      Object.keys(data).forEach((key) => {
        const fullKey = parentKey ? `${parentKey}[${key}]` : key;
        buildFormData(data[key], form, fullKey);
      });
    }
  } else {
    form.append(parentKey, String(data));
  }
  return form;
}
async function createStripeCheckoutSession(payload, origin) {
  let secretKey = payload.secretKey?.trim() || typeof process !== "undefined" && process.env?.STRIPE_SECRET_KEY || "";
  if (!secretKey) {
    try {
      const { supabase: supabase2 } = await Promise.resolve().then(() => (init_supabaseClient(), supabaseClient_exports));
      const { data: data2 } = await supabase2.from("platform_settings").select("api_settings").eq("id", "general").maybeSingle();
      if (data2?.api_settings?.payment?.secretKey?.trim()) {
        secretKey = data2.api_settings.payment.secretKey.trim();
      }
    } catch (sbErr) {
      console.warn("[Stripe Handler] Falha ao consultar Supabase:", sbErr);
    }
  }
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY n\xE3o est\xE1 configurada no Supabase, no painel ou nas vari\xE1veis de ambiente.");
  }
  const successUrl = payload.successUrl || `${origin}/?payment_status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = payload.cancelUrl || `${origin}/?payment_status=cancel`;
  const lineItems = [];
  const totalDiscount = Number(payload.discountAmount) || 0;
  const rawSubtotal = (payload.items || []).reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 1),
    0
  );
  const discountRatio = rawSubtotal > 0 && totalDiscount > 0 ? Math.max(0, (rawSubtotal - totalDiscount) / rawSubtotal) : 1;
  for (const item of payload.items || []) {
    if (item.priceId && item.priceId.startsWith("price_")) {
      lineItems.push({
        price: item.priceId,
        quantity: item.quantity || 1
      });
    } else {
      const calculatedUnit = (Number(item.price) || 0) * discountRatio;
      const finalUnitCents = Math.max(100, Math.round(calculatedUnit * 100));
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: item.title,
            description: item.instructor ? `Instrutor: ${item.instructor}` : "Deds Academy - Curso com Certificado Oficial",
            images: item.image && item.image.startsWith("https://") ? [item.image] : void 0
          },
          unit_amount: finalUnitCents
        },
        quantity: item.quantity || 1
      });
    }
  }
  if (lineItems.length === 0) {
    lineItems.push({
      price_data: {
        currency: "brl",
        product_data: {
          name: "Curso Deds Academy"
        },
        unit_amount: 1e3
      },
      quantity: 1
    });
  }
  const sessionPayload = {
    mode: "payment",
    ui_mode: "hosted_page",
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: lineItems,
    billing_address_collection: "auto",
    name_collection: {
      individual: {
        enabled: true,
        optional: true
      },
      business: {
        enabled: true,
        optional: true
      }
    },
    allow_promotion_codes: true,
    submit_type: "auto",
    integration_identifier: "hosted_web_0003",
    customer_creation: "always",
    origin_context: "web",
    metadata: {
      student_email: payload.studentEmail || "",
      student_name: payload.studentName || "",
      student_cpf: payload.studentCpf || "",
      course_ids: (payload.items || []).map((i) => i.id).join(",")
    }
  };
  if (payload.studentEmail && payload.studentEmail.includes("@")) {
    sessionPayload.customer_email = payload.studentEmail.trim();
  }
  const formData = buildFormData(sessionPayload);
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData.toString()
  });
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.error?.message || "Falha ao criar sess\xE3o de checkout na Stripe";
    console.error("[Stripe Error]", data);
    throw new Error(errorMsg);
  }
  return data;
}

// src/api/platformSyncHandler.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/data/coursesData.ts
var COURSES = [
  {
    id: "python-zero-avancado",
    title: "Python do Zero ao Avan\xE7ado",
    instructor: "Jo\xE3o Paulo Silveira",
    instructorRole: "Especialista em Engenharia de Dados & Machine Learning",
    rating: 4.9,
    reviewsCount: 1250,
    studentsCount: 3840,
    status: "publicado",
    hours: 60,
    lessonsCount: 148,
    originalPrice: 299,
    currentPrice: 189.9,
    image: "/images/courses/python.jpg",
    badge: {
      text: "Mais vendido",
      variant: "emerald"
    },
    category: "Tecnologia & IA",
    filterTags: ["Em alta", "Mais vendidos", "Com Certifica\xE7\xE3o"],
    description: "Aprenda l\xF3gica de programa\xE7\xE3o, orienta\xE7\xE3o a objetos, automa\xE7\xF5es de scripts, an\xE1lise de dados com Pandas e introdu\xE7\xE3o a IA com projetos pr\xE1ticos do mercado.",
    syllabus: [
      "Fundamentos da Linguagem & Estruturas de Dados",
      "Programa\xE7\xE3o Orientada a Objetos (POO) Moderna",
      "Automa\xE7\xE3o de Tarefas & Web Scraping",
      "An\xE1lise de Dados com Pandas & NumPy",
      "Constru\xE7\xE3o de APIs com FastAPI",
      "Deploy e Projeto Final com Certifica\xE7\xE3o"
    ]
  },
  {
    id: "excel-basico-avancado",
    title: "Excel do B\xE1sico ao Avan\xE7ado",
    instructor: "Carla Mendes",
    instructorRole: "Consultora de BI e Intelig\xEAncia Financeira",
    rating: 4.8,
    reviewsCount: 980,
    studentsCount: 2950,
    status: "publicado",
    hours: 40,
    lessonsCount: 92,
    originalPrice: 199,
    currentPrice: 129.9,
    image: "/images/courses/excel.jpg",
    badge: {
      text: "Em alta",
      variant: "secondary"
    },
    category: "Finan\xE7as",
    filterTags: ["Em alta", "Com Certifica\xE7\xE3o"],
    description: "Domine f\xF3rmulas complexas, PROCV/PROCX, Tabelas Din\xE2micas, Dashboards Executivos de alto impacto e introdu\xE7\xE3o a Power Query para automa\xE7\xE3o corporativa.",
    syllabus: [
      "Nivelamento Essencial & Formata\xE7\xE3o Condicional",
      "F\xF3rmulas Matem\xE1ticas, L\xF3gicas e de Texto",
      "Fun\xE7\xF5es de Pesquisa (PROCV, PROCX, \xCDNDICE+CORRESP)",
      "Tabelas Din\xE2micas & Segmenta\xE7\xE3o de Dados",
      "Cria\xE7\xE3o de Dashboards Interativos Profissionais",
      "Power Query para Limpeza e Modelagem de Dados"
    ]
  },
  {
    id: "marketing-digital-pratica",
    title: "Marketing Digital na Pr\xE1tica",
    instructor: "Lucas Cruz",
    instructorRole: "Growth Leader & Estrategista de Performance",
    rating: 4.9,
    reviewsCount: 760,
    studentsCount: 1980,
    status: "publicado",
    hours: 30,
    lessonsCount: 74,
    originalPrice: 219,
    currentPrice: 149.9,
    image: "/images/courses/marketing.jpg",
    badge: {
      text: "Novo",
      variant: "dark"
    },
    category: "Marketing",
    filterTags: ["Lan\xE7amentos", "Em alta"],
    description: "Campanhas de tr\xE1fego pago no Meta Ads e Google Ads, estrat\xE9gias de funil de vendas, copywriting persuasivo e mensura\xE7\xE3o de ROAS e CAC.",
    syllabus: [
      "Vis\xE3o Estrat\xE9gica & Mapeamento de Personas",
      "Copywriting & Gatilhos Mentais de Alta Convers\xE3o",
      "Meta Ads: Do Pixel \xE0 Escala de Campanhas",
      "Google Ads & Estrat\xE9gias de Pesquisa",
      "M\xE9tricas Chave: CAC, LTV, ROAS e ROI",
      "Estudos de Caso Reais de E-commerce e Infoprodutos"
    ]
  },
  {
    id: "ui-ux-design",
    title: "UI/UX Design do B\xE1sico ao Avan\xE7ado",
    instructor: "Juliana Nobre",
    instructorRole: "Senior Product Designer com atua\xE7\xE3o internacional",
    rating: 4.7,
    reviewsCount: 620,
    studentsCount: 1650,
    status: "publicado",
    hours: 50,
    lessonsCount: 110,
    originalPrice: 289,
    currentPrice: 199.9,
    image: "/images/courses/ui-ux.jpg",
    badge: {
      text: "Mais vendido",
      variant: "emerald"
    },
    category: "Tecnologia & IA",
    filterTags: ["Mais vendidos", "Com Certifica\xE7\xE3o"],
    description: "Aprenda pesquisa com usu\xE1rios, arquitetura de informa\xE7\xE3o, wireframing, prototipagem avan\xE7ada no Figma e constru\xE7\xE3o de Design Systems escal\xE1veis.",
    syllabus: [
      "Fundamentos de UX & Metodologia Design Thinking",
      "Pesquisa com Usu\xE1rios, Entrevistas e Jornadas",
      "Wireframing & Arquitetura de Informa\xE7\xE3o",
      "Figma do Zero ao Avan\xE7ado (Auto Layout & Variantes)",
      "Constru\xE7\xE3o de Design System Escal\xE1vel",
      "Prototipagem Interativa & Apresenta\xE7\xE3o para Stakeholders"
    ]
  },
  {
    id: "desenvolvimento-web-completo",
    title: "Desenvolvimento Web Completo",
    instructor: "Rafael Martins",
    instructorRole: "Engenheiro de Software Full Stack",
    rating: 4.9,
    reviewsCount: 1100,
    studentsCount: 840,
    status: "rascunho",
    hours: 80,
    lessonsCount: 195,
    originalPrice: 349,
    currentPrice: 229.9,
    image: "/images/courses/web-dev.jpg",
    badge: {
      text: "Em alta",
      variant: "secondary"
    },
    category: "Tecnologia & IA",
    filterTags: ["Em alta", "Mais vendidos", "Com Certifica\xE7\xE3o"],
    description: "Do HTML/CSS/JavaScript moderno at\xE9 React, TypeScript, Node.js, bancos de dados relacionais e deploy em nuvem com CI/CD.",
    syllabus: [
      "HTML5 Sem\xE2ntico, CSS3 Moderno & Flexbox/Grid",
      "JavaScript ES6+ Moderno & Programa\xE7\xE3o Ass\xEDncrona",
      "React & Gerenciamento de Estado",
      "Node.js, Express & Cria\xE7\xE3o de REST APIs Seguras",
      "Bancos de Dados SQL e NoSQL",
      "Deploy Cont\xEDnuo, Docker e Melhores Pr\xE1ticas DevOps"
    ]
  },
  {
    id: "gestao-projetos-scrum",
    title: "Gest\xE3o \xC1gil de Projetos & Scrum",
    instructor: "Marcelo Ramos",
    instructorRole: "Enterprise Agile Coach & PMP",
    rating: 4.9,
    reviewsCount: 840,
    studentsCount: 2120,
    status: "publicado",
    hours: 45,
    lessonsCount: 88,
    originalPrice: 249,
    currentPrice: 159.9,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Mais vendido",
      variant: "emerald"
    },
    category: "Administra\xE7\xE3o",
    filterTags: ["Mais vendidos", "Com Certifica\xE7\xE3o"],
    description: "Domine metodologias \xE1geis, frameworks Scrum e Kanban, gest\xE3o de backlog, m\xE9tricas \xE1geis e prepara\xE7\xE3o para certifica\xE7\xF5es internacionais.",
    syllabus: [
      "Fundamentos do Manifesto \xC1gil e Mindset Lean",
      "Pap\xE9is Scrum: Product Owner, Scrum Master e Dev Team",
      "Cerim\xF4nias e Artefatos do Scrum na Pr\xE1tica",
      "Kanban Visual & Otimiza\xE7\xE3o de Fluxo",
      "M\xE9tricas \xC1geis: Burndown, Velocity e Lead Time",
      "Estudos de Caso de Transforma\xE7\xE3o \xC1gil"
    ]
  },
  {
    id: "lideranca-gestao-equipes",
    title: "Lideran\xE7a Estrat\xE9gica & Equipes",
    instructor: "Dra. Camila Duarte",
    instructorRole: "Consultora de Desenvolvimento Organizacional",
    rating: 4.8,
    reviewsCount: 650,
    studentsCount: 430,
    status: "previsto",
    hours: 35,
    lessonsCount: 64,
    originalPrice: 219,
    currentPrice: 139.9,
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Novo",
      variant: "dark"
    },
    category: "Administra\xE7\xE3o",
    filterTags: ["Lan\xE7amentos", "Com Certifica\xE7\xE3o"],
    description: "Desenvolva lideran\xE7a humanizada, comunica\xE7\xE3o n\xE3o-violenta, feedbacks de alto impacto e alinhamento de metas com OKRs.",
    syllabus: [
      "Estilos de Lideran\xE7a Situacional",
      "Comunica\xE7\xE3o Assertiva e Feedbacks Estruturados",
      "Delega\xE7\xE3o Eficaz e Empoderamento de Times",
      "Gest\xE3o de Conflitos e Resolu\xE7\xE3o de Problemas",
      "Framework de OKRs para Alinhamento de Metas",
      "Cultura de Alta Performance e Seguran\xE7a Psicol\xF3gica"
    ]
  },
  {
    id: "power-bi-mercado-financeiro",
    title: "Power BI para An\xE1lise Financeira",
    instructor: "Thiago Sampaio",
    instructorRole: "CFO & Especialista em BI Financeiro",
    rating: 4.9,
    reviewsCount: 920,
    studentsCount: 2450,
    status: "publicado",
    hours: 50,
    lessonsCount: 104,
    originalPrice: 279,
    currentPrice: 179.9,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Em alta",
      variant: "secondary"
    },
    category: "Finan\xE7as",
    filterTags: ["Em alta", "Mais vendidos", "Com Certifica\xE7\xE3o"],
    description: "Construa relat\xF3rios din\xE2micos de DRE, fluxo de caixa, EBITDA e dashboards executivos conectados a bases de dados reais com DAX avan\xE7ado.",
    syllabus: [
      "Modelagem de Dados Financeiros e Star Schema",
      "DAX Essencial e Avan\xE7ado para C\xE1lculos Financeiros",
      "An\xE1lise de DRE, Balan\xE7o e Fluxo de Caixa Din\xE2mico",
      "Visuais Financeiros de Alta Precis\xE3o",
      "Publica\xE7\xE3o no Power BI Service e RLS de Seguran\xE7a",
      "Projeto Final: Dashboard Executivo para C-Level"
    ]
  },
  {
    id: "trafego-pago-avancado",
    title: "Tr\xE1fego Pago Avan\xE7ado: Meta & Google Ads",
    instructor: "Camila Rocha",
    instructorRole: "Head de M\xEDdia Paga & Performance",
    rating: 4.9,
    reviewsCount: 880,
    studentsCount: 1220,
    status: "inativo",
    hours: 40,
    lessonsCount: 82,
    originalPrice: 259,
    currentPrice: 159.9,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Mais vendido",
      variant: "emerald"
    },
    category: "Marketing",
    filterTags: ["Mais vendidos", "Em alta"],
    description: "Estrat\xE9gias de escala de tr\xE1fego, pixel API de convers\xE3o, otimiza\xE7\xE3o por intelig\xEAncia artificial e cria\xE7\xE3o de funis perp\xE9tuos.",
    syllabus: [
      "Estrutura de Contas e API de Convers\xF5es do Meta",
      "Google Search, Performance Max e YouTube Ads",
      "Remarketing Avan\xE7ado e Segmenta\xE7\xE3o Lookalike",
      "Copywriting e Criativos que Vendem no Feed e Reels",
      "An\xE1lise de Atribui\xE7\xE3o e Tracking com UTMs",
      "Otimiza\xE7\xE3o de Custos e Escala Segura de Investimento"
    ]
  },
  {
    id: "people-analytics-rh",
    title: "People Analytics & Gest\xE3o por Compet\xEAncias",
    instructor: "Renata Silveira",
    instructorRole: "Diretora de RH Estrat\xE9gico & Docente",
    rating: 4.9,
    reviewsCount: 710,
    studentsCount: 1430,
    status: "publicado",
    hours: 40,
    lessonsCount: 76,
    originalPrice: 249,
    currentPrice: 169.9,
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Em alta",
      variant: "secondary"
    },
    category: "Recursos Humanos",
    filterTags: ["Em alta", "Com Certifica\xE7\xE3o"],
    description: "Transforme dados de recursos humanos em decis\xF5es de neg\xF3cios: m\xE9tricas de turnover, absente\xEDsmo, eNPS e mapeamento de talentos.",
    syllabus: [
      "Fundamentos de Dados aplicados a Gest\xE3o de Pessoas",
      "M\xE9tricas Cr\xEDticas: Turnover, Reten\xE7\xE3o e eNPS",
      "Mapeamento de Compet\xEAncias e Matriz Nine Box",
      "Dashboards de RH em Excel e Power BI",
      "Planos de Desenvolvimento Individual (PDI)",
      "\xC9tica e LGPD no Tratamento de Dados de Colaboradores"
    ]
  },
  {
    id: "recrutamento-tech-selecao",
    title: "Tech Recruiter: Atra\xE7\xE3o e Sele\xE7\xE3o Tech",
    instructor: "Felipe Barreto",
    instructorRole: "Tech Talent Acquisition Specialist",
    rating: 4.8,
    reviewsCount: 530,
    studentsCount: 510,
    status: "previsto",
    hours: 30,
    lessonsCount: 58,
    originalPrice: 199,
    currentPrice: 129.9,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Novo",
      variant: "dark"
    },
    category: "Recursos Humanos",
    filterTags: ["Lan\xE7amentos", "Com Certifica\xE7\xE3o"],
    description: "Aprenda a mapear stacks t\xE9cnicas, conduzir entrevistas comportamentais com devs e negociar propostas competitivas no mercado de TI.",
    syllabus: [
      "Mapeamento do Ecossistema de Tecnologia & Stacks",
      "Hunting Ativo no LinkedIn e GitHub",
      "Alinhamento de Job Description com Engineering Managers",
      "Entrevista por Compet\xEAncias e Fit Cultural",
      "Comunica\xE7\xE3o Transparente e Feedback a Candidatos",
      "Fechamento de Proposta e Onboarding Integrado"
    ]
  },
  {
    id: "autocad-2d-3d-projetos",
    title: "AutoCAD 2D e 3D para Projetos T\xE9cnicos",
    instructor: "Eng. Roberto Faria",
    instructorRole: "Engenheiro Civil & Projetista Especialista",
    rating: 4.9,
    reviewsCount: 890,
    studentsCount: 2340,
    status: "publicado",
    hours: 55,
    lessonsCount: 112,
    originalPrice: 289,
    currentPrice: 179.9,
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Mais vendido",
      variant: "emerald"
    },
    category: "Engenharia",
    filterTags: ["Mais vendidos", "Com Certifica\xE7\xE3o"],
    description: "Do desenho t\xE9cnico b\xE1sico \xE0 modelagem tridimensional, plantas baixas, cortes, eleva\xE7\xF5es, pranchas e plotagem em conformidade com a ABNT.",
    syllabus: [
      "Interface e Comandos de Precis\xE3o do AutoCAD",
      "Desenho de Plantas Baixas, Cortes e Fachadas",
      "Gerenciamento de Layers, Blocos Din\xE2micos e Hachuras",
      "Cotagem e Textos Normatizados (ABNT)",
      "Modelagem 3D B\xE1sica e Renderiza\xE7\xE3o",
      "Configura\xE7\xE3o de Layouts, Viewports e Plotagem em PDF"
    ]
  },
  {
    id: "bim-revit-arquitetura",
    title: "BIM com Revit: Modelagem & Projetos",
    instructor: "Eng\xAA. Patr\xEDcia Lima",
    instructorRole: "BIM Manager & Coordenadora de Projetos",
    rating: 4.9,
    reviewsCount: 760,
    studentsCount: 690,
    status: "rascunho",
    hours: 65,
    lessonsCount: 130,
    originalPrice: 329,
    currentPrice: 219.9,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Em alta",
      variant: "secondary"
    },
    category: "Engenharia",
    filterTags: ["Em alta", "Com Certifica\xE7\xE3o"],
    description: "Aprenda a metodologia BIM na pr\xE1tica: modelagem param\xE9trica de arquitetura e estruturas, tabelas quantitativas autom\xE1ticas e compatibiliza\xE7\xE3o.",
    syllabus: [
      "Conceitos Fundamentais da Metodologia BIM",
      "Modelagem de Paredes, Pisos, Coberturas e Esquadrias",
      "Cria\xE7\xE3o e Edi\xE7\xE3o de Fam\xEDlias Param\xE9tricas",
      "Extra\xE7\xE3o Autom\xE1tica de Quantitativos de Materiais",
      "Documenta\xE7\xE3o Completa de Pranchas Executivas",
      "Exporta\xE7\xE3o IFC e Compatibiliza\xE7\xE3o de Projetos"
    ]
  },
  {
    id: "inteligencia-artificial-prompts",
    title: "Intelig\xEAncia Artificial & Prompts",
    instructor: "Dr. Gabriel Vasconcelos",
    instructorRole: "Pesquisador em IA Generativa & LLMs",
    rating: 4.9,
    reviewsCount: 1350,
    studentsCount: 3100,
    status: "publicado",
    hours: 35,
    lessonsCount: 68,
    originalPrice: 269,
    currentPrice: 169.9,
    image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
    badge: {
      text: "Lan\xE7amento",
      variant: "emerald"
    },
    category: "Tecnologia & IA",
    filterTags: ["Em alta", "Lan\xE7amentos", "Com Certifica\xE7\xE3o"],
    description: "Aprenda Engenharia de Prompts para Gemini, ChatGPT e Claude, automa\xE7\xF5es com n8n/Make, agentes de IA e aplica\xE7\xE3o pr\xE1tica nos neg\xF3cios.",
    syllabus: [
      "Fundamentos de LLMs e Mecanismo de Aten\xE7\xE3o",
      "T\xE9cnicas Avan\xE7adas de Prompting (Few-Shot, CoT)",
      "Constru\xE7\xE3o de Agentes Aut\xF4nomos de Produtividade",
      "Integra\xE7\xE3o de Modelos de IA via API",
      "Automa\xE7\xE3o de Fluxos de Trabalho com IA",
      "Boas Pr\xE1ticas de Governan\xE7a e Seguran\xE7a em IA"
    ]
  }
];
var CATEGORIES = [
  {
    id: "administracao",
    name: "Administra\xE7\xE3o",
    courseCount: 17,
    icon: "business_center"
  },
  {
    id: "tecnologia-ia",
    name: "Tecnologia & IA",
    courseCount: 20,
    icon: "memory"
  },
  {
    id: "financas",
    name: "Finan\xE7as",
    courseCount: 13,
    icon: "payments"
  },
  {
    id: "marketing",
    name: "Marketing",
    courseCount: 16,
    icon: "trending_up"
  },
  {
    id: "recursos-humanos",
    name: "Recursos Humanos",
    courseCount: 14,
    icon: "groups"
  },
  {
    id: "engenharia",
    name: "Engenharia",
    courseCount: 14,
    icon: "precision_manufacturing"
  }
];

// src/data/promotionsData.ts
var INITIAL_COUPONS = [
  {
    id: "cupom-1",
    code: "BEMVINDO10",
    discountType: "percentage",
    discountValue: 10,
    startDateTime: "2026-09-01T00:00",
    endDateTime: "2026-12-31T23:59",
    usageLimitPerCpf: 1,
    usageLimitTotal: 500,
    currentUses: 142,
    status: "ativo",
    description: "Cupom de boas-vindas para novos alunos cadastrados",
    createdAt: "2026-09-01T00:00:00Z"
  },
  {
    id: "cupom-2",
    code: "DEDS20",
    discountType: "percentage",
    discountValue: 20,
    startDateTime: "2026-09-10T08:00",
    endDateTime: "2026-12-31T23:59",
    usageLimitPerCpf: 1,
    usageLimitTotal: 250,
    currentUses: 89,
    status: "ativo",
    description: "Desconto especial para aquisi\xE7\xE3o de forma\xE7\xF5es t\xE9cnicas",
    createdAt: "2026-09-10T08:00:00Z"
  },
  {
    id: "cupom-3",
    code: "TURBO50",
    discountType: "fixed",
    discountValue: 50,
    startDateTime: "2026-09-15T00:00",
    endDateTime: "2026-12-31T23:59",
    usageLimitPerCpf: 2,
    usageLimitTotal: 100,
    currentUses: 34,
    status: "ativo",
    description: "Abatimento fixo de R$ 50 para compras acima de R$ 150",
    createdAt: "2026-09-15T00:00:00Z"
  },
  {
    id: "cupom-4",
    code: "BLACKFRIDAY",
    discountType: "percentage",
    discountValue: 40,
    startDateTime: "2026-08-01T00:00",
    endDateTime: "2026-08-31T23:59",
    usageLimitPerCpf: 1,
    usageLimitTotal: 1e3,
    currentUses: 1e3,
    status: "expirado",
    description: "Campanha especial antecipada do m\xEAs anterior",
    createdAt: "2026-08-01T00:00:00Z"
  },
  {
    id: "cupom-5",
    code: "PARCEIRO15",
    discountType: "percentage",
    discountValue: 15,
    startDateTime: "2026-09-01T00:00",
    endDateTime: "2026-12-31T23:59",
    usageLimitPerCpf: 1,
    usageLimitTotal: 300,
    currentUses: 12,
    status: "inativo",
    description: "Cupom de conv\xEAnio e parcerias corporativas (pausado temporariamente)",
    createdAt: "2026-09-01T10:00:00Z"
  }
];
var INITIAL_CAMPAIGNS = [
  {
    id: "camp-1",
    title: "Semana do Desenvolvedor Web & Full Stack",
    description: "Desconto agressivo em todas as forma\xE7\xF5es da categoria Tecnologia & Programa\xE7\xE3o",
    targetCourseIds: ["course-1", "course-2"],
    discountType: "percentage",
    discountValue: 25,
    startDateTime: "2026-09-15T00:00",
    endDateTime: "2026-12-31T23:59",
    status: "ativa",
    createdAt: "2026-09-15T09:00:00Z"
  },
  {
    id: "camp-2",
    title: "Oferta Rel\xE2mpago de Design UI/UX & Figma",
    description: "Pre\xE7o promocional fixo para impulsionar novas matr\xEDculas",
    targetCourseIds: ["course-3"],
    discountType: "fixed_price",
    discountValue: 89.9,
    startDateTime: "2026-09-16T12:00",
    endDateTime: "2026-12-31T23:59",
    status: "ativa",
    createdAt: "2026-09-16T12:00:00Z"
  },
  {
    id: "camp-3",
    title: "Campanha F\xE9rias Aceleradas",
    description: "Desconto geral em todo o cat\xE1logo da plataforma",
    targetCourseIds: ["all"],
    discountType: "percentage",
    discountValue: 15,
    startDateTime: "2026-09-01T00:00",
    endDateTime: "2026-12-31T23:59",
    status: "pausada",
    createdAt: "2026-09-01T00:00:00Z"
  }
];

// src/data/usersData.ts
var INITIAL_USERS = [
  // ── Alunos Cadastrados (Módulo 7) ──────────────────────────────────────────
  {
    id: "user-aluno-1",
    name: "Lucas M. Silveira",
    email: "aluno@123.com.br",
    role: "aluno",
    studentCode: "ALU-8921",
    password: "10203040",
    cpf: "384.920.118-04",
    phone: "(11) 98765-4321",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    address: {
      cep: "01310-100",
      street: "Avenida Paulista",
      number: "1578",
      complement: "Apto 42",
      neighborhood: "Bela Vista",
      city: "S\xE3o Paulo",
      state: "SP"
    },
    certificateData: {
      customName: "Lucas M. Silveira",
      customCpf: "384.920.118-04",
      signatureType: "automatic",
      fontStyle: "font-script",
      signatureImage: ""
    },
    status: "ativo",
    registeredAt: "15/01/2025",
    lastAccess: "Hoje, 09:30",
    enrolledCourseIds: ["python-zero-avancado", "excel-basico-avancado"],
    completedCourseIds: ["excel-basico-avancado"]
  },
  // ── Colaboradores Internos & Equipe ADM (Módulo 8) ─────────────────────────
  {
    id: "user-admin-1",
    name: "ANDRE DE SOUZA",
    email: "andre.ads567@gmail.com",
    role: "admin",
    jobTitle: "Super Administrador & Diretor Geral",
    department: "Diretoria Executiva & Tecnologia",
    accessLevel: "Super Administrador",
    password: "$2a$12$PsBdErAfPDkwzjb6DtPAQuN8/ktDe5SrtGLlUgjb1TVHrbd3.FaSO",
    cpf: "110.220.330-44",
    phone: "(11) 99888-7766",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    address: {
      cep: "01310-100",
      street: "Avenida Paulista",
      number: "1578",
      complement: "Conjunto 1402",
      neighborhood: "Bela Vista",
      city: "S\xE3o Paulo",
      state: "SP"
    },
    status: "ativo",
    registeredAt: "01/01/2024",
    lastAccess: "Hoje, 09:30",
    enrolledCourseIds: [],
    completedCourseIds: []
  },
  {
    id: "user-admin-2",
    name: "Mariana Lima",
    email: "mariana.lima@dedsacademy.com.br",
    role: "admin",
    jobTitle: "Coordenadora Pedag\xF3gica & Cursos",
    department: "Coordena\xE7\xE3o Pedag\xF3gica",
    accessLevel: "Administrador",
    password: "MarianaStaff#2025",
    cpf: "234.567.890-12",
    phone: "(11) 98111-2233",
    address: {
      cep: "04538-133",
      street: "Rua Joaquim Floriano",
      number: "466",
      complement: "Sala 81",
      neighborhood: "Itaim Bibi",
      city: "S\xE3o Paulo",
      state: "SP"
    },
    status: "ativo",
    registeredAt: "10/02/2024",
    lastAccess: "Hoje, 08:45",
    enrolledCourseIds: [],
    completedCourseIds: []
  },
  {
    id: "user-admin-3",
    name: "Carlos Mendes",
    email: "carlos.mendes@dedsacademy.com.br",
    role: "admin",
    jobTitle: "Analista de Suporte T\xE9cnico & Opera\xE7\xF5es",
    department: "Suporte & Atendimento ao Aluno",
    accessLevel: "Suporte T\xE9cnico",
    password: "CarlosSuporte@2025",
    cpf: "345.678.901-23",
    phone: "(21) 97654-3210",
    address: {
      cep: "20040-020",
      street: "Rua da Assembleia",
      number: "10",
      complement: "Andar 12",
      neighborhood: "Centro",
      city: "Rio de Janeiro",
      state: "RJ"
    },
    status: "ativo",
    registeredAt: "05/04/2024",
    lastAccess: "Ontem, 17:15",
    enrolledCourseIds: [],
    completedCourseIds: []
  },
  {
    id: "user-admin-4",
    name: "Juliana Rocha",
    email: "juliana.rocha@dedsacademy.com.br",
    role: "admin",
    jobTitle: "Gestora Financeira & Contratos",
    department: "Financeiro & Compliance",
    accessLevel: "Gestor Operacional",
    password: "JulianaFin#2025",
    cpf: "456.789.012-34",
    phone: "(31) 99222-4455",
    address: {
      cep: "30140-071",
      street: "Avenida Get\xFAlio Vargas",
      number: "1420",
      complement: "Sala 504",
      neighborhood: "Savassi",
      city: "Belo Horizonte",
      state: "MG"
    },
    status: "pendente",
    registeredAt: "12/06/2024",
    lastAccess: "H\xE1 2 dias",
    enrolledCourseIds: [],
    completedCourseIds: []
  }
];
var INITIAL_CERTIFICATES = [];
var INITIAL_INSTRUCTORS = [
  {
    id: "inst-1",
    name: "Jo\xE3o Paulo Silveira",
    email: "joao.silveira@dedsacademy.com.br",
    role: "Especialista em Engenharia de Dados & Machine Learning com 10 anos no mercado",
    specialty: "Tecnologia & IA",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    coursesCount: 4,
    studentsCount: 3820,
    rating: 4.9,
    status: "ativo"
  },
  {
    id: "inst-2",
    name: "Carla Mendes",
    email: "carla.mendes@dedsacademy.com.br",
    role: "Consultora de BI e Intelig\xEAncia Financeira Corporativa",
    specialty: "Finan\xE7as & Neg\xF3cios",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    coursesCount: 3,
    studentsCount: 2450,
    rating: 4.8,
    status: "ativo"
  },
  {
    id: "inst-3",
    name: "Lucas Nogueira",
    email: "lucas.nogueira@dedsacademy.com.br",
    role: "Growth Hacker & Estrategista de Performance e M\xEDdia Paga",
    specialty: "Marketing Digital",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    coursesCount: 2,
    studentsCount: 1980,
    rating: 4.9,
    status: "ativo"
  },
  {
    id: "inst-4",
    name: "Marina Duarte",
    email: "marina.duarte@dedsacademy.com.br",
    role: "Senior Product Designer & Especialista em Design Systems",
    specialty: "Design & UI/UX",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    coursesCount: 3,
    studentsCount: 1650,
    rating: 4.9,
    status: "ativo"
  },
  {
    id: "inst-5",
    name: "Renata Silveira",
    email: "renata.silveira@dedsacademy.com.br",
    role: "Diretora de RH Estrat\xE9gico & Docente em People Analytics",
    specialty: "Recursos Humanos",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    coursesCount: 2,
    studentsCount: 1240,
    rating: 4.9,
    status: "ativo"
  }
];
var INITIAL_BLOG_POSTS = [
  {
    id: "post-1",
    title: "Horas Complementares (AACC): Tudo o que voc\xEA precisa saber para validar na faculdade",
    category: "Horas Complementares",
    author: "Coordena\xE7\xE3o Pedag\xF3gica Deds",
    date: "14/09/2026",
    readTime: "6 min",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
    summary: "Entenda os crit\xE9rios da Lei n\xBA 9.394/96 para aceita\xE7\xE3o de certificados de cursos livres e extracurriculares em atividades complementares universit\xE1rias.",
    status: "publicado",
    viewsCount: 3420
  },
  {
    id: "post-2",
    title: "Como a Intelig\xEAncia Artificial Generativa est\xE1 redefinindo o mercado de programa\xE7\xE3o",
    category: "Tecnologia & Carreira",
    author: "Prof. Jo\xE3o Paulo Silveira",
    date: "10/09/2026",
    readTime: "5 min",
    image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80",
    summary: "Descubra por que engenheiros de prompt e desenvolvedores que dominam automa\xE7\xE3o de LLMs est\xE3o recebendo propostas at\xE9 40% maiores.",
    status: "publicado",
    viewsCount: 2890
  },
  {
    id: "post-3",
    title: "Autentica\xE7\xE3o Criptogr\xE1fica com QR Code: A seguran\xE7a por tr\xE1s do diploma Deds Academy",
    category: "Certifica\xE7\xE3o",
    author: "Seguran\xE7a & Compliance",
    date: "05/09/2026",
    readTime: "4 min",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
    summary: "Cada certificado gerado na Deds possui hash verificador imut\xE1vel que permite consulta instant\xE2nea por qualquer comiss\xE3o avaliadora.",
    status: "publicado",
    viewsCount: 1950
  }
];

// src/types.ts
var DEFAULT_HERO_BANNER = {
  imageUrl: "/images/hero-banner.jpg",
  badge1Number: "+10.000",
  badge1Text: "Alunos certificados",
  overlayTitle: "Carreiras Tech 2026",
  overlaySubtitle: "Certificados Verificados",
  ratingScore: "4.9 / 5.0",
  reviewsCountText: "Mais de 12.000 reviews verificadas"
};
var DEFAULT_MIDDLE_PROMO_BANNER = {
  enabled: true,
  imageUrl: "/images/estude-no-seu-ritmo.jpg",
  targetUrl: "#cursos-section",
  altText: "Forma\xE7\xF5es Profissionais e Tecnol\xF3gicas com Certificado V\xE1lido - Deds Academy"
};
var DEFAULT_CHECKOUT_PAYMENT_BANNER = {
  enabled: true,
  imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&auto=format&fit=crop&q=80",
  altText: "Banner Oficial de Pagamentos e Checkout - Deds Academy"
};
var DEFAULT_STUDENT_BANNERS_CONFIG = {
  enabled: true,
  intervalSeconds: 5,
  banners: [
    {
      id: "student-banner-1",
      position: 1,
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&auto=format&fit=crop&q=80",
      title: "Acelere sua Carreira com Forma\xE7\xF5es Pr\xE1ticas e Certificados Reconhecidos",
      linkUrl: "#cursos-section",
      enabled: true
    },
    {
      id: "student-banner-2",
      position: 2,
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&auto=format&fit=crop&q=80",
      title: "Certificados V\xE1lidos em Todo o Brasil com Amparo na Lei n\xBA 9.394/96",
      linkUrl: "#certificados",
      enabled: true
    },
    {
      id: "student-banner-3",
      position: 3,
      imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&auto=format&fit=crop&q=80",
      title: "Comprove Carga Hor\xE1ria e Horas Complementares na sua Faculdade",
      linkUrl: "#horas",
      enabled: true
    },
    {
      id: "student-banner-4",
      position: 4,
      imageUrl: "",
      title: "Espa\xE7o Dispon\xEDvel para Banner 4",
      linkUrl: "",
      enabled: false
    },
    {
      id: "student-banner-5",
      position: 5,
      imageUrl: "",
      title: "Espa\xE7o Dispon\xEDvel para Banner 5",
      linkUrl: "",
      enabled: false
    },
    {
      id: "student-banner-6",
      position: 6,
      imageUrl: "",
      title: "Espa\xE7o Dispon\xEDvel para Banner 6",
      linkUrl: "",
      enabled: false
    }
  ]
};

// src/api/platformSyncHandler.ts
init_supabaseClient();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isInsideDist = path.basename(__dirname) === "dist";
var projectRoot = isInsideDist ? path.resolve(__dirname, "..") : process.cwd() || __dirname;
var PRIMARY_DATA_DIR = path.join(projectRoot, "data");
var PRIMARY_STORE_FILE = path.join(PRIMARY_DATA_DIR, "platform-store.json");
var UPLOADS_DIR = path.join(projectRoot, "public", "uploads");
var DIST_UPLOADS_DIR = path.join(projectRoot, "dist", "uploads");
var inMemoryStore = null;
function getInitialStore() {
  return {
    version: Date.now(),
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
    courses: COURSES,
    categories: CATEGORIES,
    coupons: INITIAL_COUPONS,
    campaigns: INITIAL_CAMPAIGNS,
    heroBanner: DEFAULT_HERO_BANNER,
    middleBanner: DEFAULT_MIDDLE_PROMO_BANNER,
    checkoutBanner: DEFAULT_CHECKOUT_PAYMENT_BANNER,
    studentBanners: DEFAULT_STUDENT_BANNERS_CONFIG,
    instructors: INITIAL_INSTRUCTORS,
    blogPosts: INITIAL_BLOG_POSTS,
    announcements: [
      {
        id: "ann-1",
        title: "M\xF3dulo de Intelig\xEAncia Artificial Generativa liberado em Python com certificados da Lei 9.394/96",
        author: "Coordena\xE7\xE3o Pedag\xF3gica",
        date: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
        priority: "alta"
      }
    ],
    users: INITIAL_USERS,
    certificates: INITIAL_CERTIFICATES
  };
}
function ensureStoreFile() {
  if (inMemoryStore) {
    return inMemoryStore;
  }
  try {
    if (fs.existsSync(PRIMARY_STORE_FILE)) {
      try {
        const raw = fs.readFileSync(PRIMARY_STORE_FILE, "utf8");
        const parsed = JSON.parse(raw);
        let modified = false;
        if (!parsed.users || !Array.isArray(parsed.users)) {
          parsed.users = INITIAL_USERS;
          modified = true;
        }
        if (!parsed.certificates || !Array.isArray(parsed.certificates)) {
          parsed.certificates = INITIAL_CERTIFICATES;
          modified = true;
        }
        if (modified) {
          try {
            fs.writeFileSync(PRIMARY_STORE_FILE, JSON.stringify(parsed, null, 2), "utf8");
          } catch {
          }
        }
        inMemoryStore = parsed;
        return parsed;
      } catch (err) {
        console.error("[PlatformSyncHandler] Error parsing primary store, recreating:", err);
      }
    }
    const initial = getInitialStore();
    inMemoryStore = initial;
    try {
      if (!fs.existsSync(PRIMARY_DATA_DIR)) {
        fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRIMARY_STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
    } catch (writeErr) {
      console.warn("[PlatformSyncHandler] Primary data write warning:", writeErr);
    }
    return initial;
  } catch (err) {
    console.error("[PlatformSyncHandler] Error ensuring store file:", err);
    inMemoryStore = getInitialStore();
    return inMemoryStore;
  }
}
function courseToRowFormat(course) {
  return {
    id: course.id,
    title: course.title,
    instructor: course.instructor,
    instructor_role: course.instructorRole ?? null,
    instructor_avatar: course.instructorAvatar ?? null,
    category: course.category,
    level: course.level ?? "Todos os N\xEDveis",
    rating: Number(course.rating) || 5,
    reviews_count: Number(course.reviewsCount) || 0,
    students_count: Number(course.studentsCount) || 0,
    hours: Number(course.hours) || 40,
    lessons_count: Number(course.lessonsCount) || 0,
    original_price: Number(course.originalPrice) || 0,
    current_price: Number(course.currentPrice) || 0,
    image: course.image,
    image_file_name: course.imageFileName ?? null,
    banner_image: course.bannerImage ?? null,
    banner_file_name: course.bannerFileName ?? null,
    badge: course.badge ?? null,
    filter_tags: Array.isArray(course.filterTags) ? course.filterTags : [],
    description: course.description ?? "",
    syllabus: Array.isArray(course.syllabus) ? course.syllabus : [],
    modules: Array.isArray(course.modules) ? course.modules : [],
    status: course.status ?? "publicado",
    is_auto_launch_badge: Boolean(course.isAutoLaunchBadge),
    video_url: course.videoUrl ?? null,
    video_file_name: course.videoFileName ?? null,
    video_type: course.videoType ?? null,
    final_exam: course.finalExam ?? null,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function rowToCourseFormat(row) {
  return {
    id: row.id,
    title: row.title,
    instructor: row.instructor,
    instructorRole: row.instructor_role ?? void 0,
    instructorAvatar: row.instructor_avatar ?? void 0,
    category: row.category,
    level: row.level ?? "Todos os N\xEDveis",
    rating: Number(row.rating) || 5,
    reviewsCount: Number(row.reviews_count) || 0,
    studentsCount: Number(row.students_count) || 0,
    hours: Number(row.hours) || 40,
    lessonsCount: Number(row.lessons_count) || 0,
    originalPrice: Number(row.original_price) || 0,
    currentPrice: Number(row.current_price) || 0,
    image: row.image,
    imageFileName: row.image_file_name ?? void 0,
    bannerImage: row.banner_image ?? void 0,
    bannerFileName: row.banner_file_name ?? void 0,
    badge: row.badge ?? void 0,
    filterTags: Array.isArray(row.filter_tags) ? row.filter_tags : [],
    description: row.description ?? "",
    syllabus: Array.isArray(row.syllabus) ? row.syllabus : [],
    modules: Array.isArray(row.modules) ? row.modules : [],
    status: row.status ?? "publicado",
    isAutoLaunchBadge: Boolean(row.is_auto_launch_badge),
    videoUrl: row.video_url ?? void 0,
    videoFileName: row.video_file_name ?? void 0,
    videoType: row.video_type ?? void 0,
    finalExam: row.final_exam ?? void 0
  };
}
function userToRowFormat(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    password: user.password ?? null,
    student_code: user.studentCode ?? null,
    cpf: user.cpf ?? null,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
    address: user.address ?? null,
    certificate_data: user.certificateData ?? null,
    status: user.status ?? "ativo",
    registered_at: user.registeredAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    last_access: user.lastAccess ?? null,
    enrolled_course_ids: user.enrolledCourseIds ?? [],
    completed_course_ids: user.completedCourseIds ?? [],
    job_title: user.jobTitle ?? null,
    department: user.department ?? null,
    access_level: user.accessLevel ?? null,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function rowToUserFormat(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    password: row.password ?? void 0,
    studentCode: row.student_code ?? void 0,
    cpf: row.cpf ?? void 0,
    phone: row.phone ?? void 0,
    avatar: row.avatar ?? void 0,
    address: row.address ?? void 0,
    certificateData: row.certificate_data ?? void 0,
    status: row.status ?? "ativo",
    registeredAt: row.registered_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    lastAccess: row.last_access ?? void 0,
    enrolledCourseIds: row.enrolled_course_ids ?? [],
    completedCourseIds: row.completed_course_ids ?? [],
    jobTitle: row.job_title ?? void 0,
    department: row.department ?? void 0,
    accessLevel: row.access_level ?? void 0
  };
}
async function syncFromSupabase() {
  const store = ensureStoreFile();
  try {
    const [coursesRes, catsRes, usersRes, certsRes, settingsRes] = await Promise.all([
      supabase.from("courses").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("users").select("*"),
      supabase.from("certificates").select("*"),
      supabase.from("platform_settings").select("*").eq("id", "general").maybeSingle()
    ]);
    let modified = false;
    if (!coursesRes.error && Array.isArray(coursesRes.data) && coursesRes.data.length > 0) {
      store.courses = coursesRes.data.map(rowToCourseFormat);
      modified = true;
    }
    if (!catsRes.error && Array.isArray(catsRes.data) && catsRes.data.length > 0) {
      store.categories = catsRes.data.map((c) => ({
        id: c.id,
        name: c.name,
        courseCount: Number(c.course_count) || 0,
        icon: c.icon || "folder"
      }));
      modified = true;
    }
    if (!usersRes.error && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
      store.users = usersRes.data.map(rowToUserFormat);
      modified = true;
    }
    if (!certsRes.error && Array.isArray(certsRes.data) && certsRes.data.length > 0) {
      store.certificates = certsRes.data;
      modified = true;
    }
    if (!settingsRes.error && settingsRes.data) {
      if (settingsRes.data.api_settings && Object.keys(settingsRes.data.api_settings).length > 0) {
        store.apiSettings = settingsRes.data.api_settings;
        modified = true;
      }
      if (settingsRes.data.support_channels) {
        store.supportChannels = settingsRes.data.support_channels;
        modified = true;
      }
    }
    if (modified) {
      store.version = Date.now();
      store.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
      inMemoryStore = store;
      try {
        if (!fs.existsSync(PRIMARY_DATA_DIR)) {
          fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(PRIMARY_STORE_FILE, JSON.stringify(store, null, 2), "utf8");
      } catch {
      }
      console.log(`[PlatformSyncHandler] Sincronizado com sucesso com o Supabase: ${store.courses.length} cursos, ${store.users.length} usu\xE1rios`);
    }
  } catch (err) {
    console.warn("[PlatformSyncHandler] Aviso na sincroniza\xE7\xE3o com o Supabase:", err);
  }
  return store;
}
async function syncToSupabase(type, data) {
  try {
    if (type === "courses" && Array.isArray(data)) {
      const rows = data.map(courseToRowFormat);
      const { error } = await supabase.from("courses").upsert(rows);
      if (error) console.warn("[PlatformSyncHandler] Falha ao upsert cursos no Supabase:", error.message);
    } else if (type === "users" && Array.isArray(data)) {
      const rows = data.map(userToRowFormat);
      const { error } = await supabase.from("users").upsert(rows);
      if (error) console.warn("[PlatformSyncHandler] Falha ao upsert usu\xE1rios no Supabase:", error.message);
    } else if (type === "categories" && Array.isArray(data)) {
      const rows = data.map((c) => ({
        id: c.id,
        name: c.name,
        course_count: c.courseCount ?? c.course_count ?? 0,
        icon: c.icon || "folder"
      }));
      const { error } = await supabase.from("categories").upsert(rows);
      if (error) console.warn("[PlatformSyncHandler] Falha ao upsert categorias no Supabase:", error.message);
    } else if (type === "certificates" && Array.isArray(data)) {
      const { error } = await supabase.from("certificates").upsert(data);
      if (error) console.warn("[PlatformSyncHandler] Falha ao upsert certificados no Supabase:", error.message);
    } else if (type === "apiSettings" && data) {
      const { error } = await supabase.from("platform_settings").upsert({
        id: "general",
        api_settings: data,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, { onConflict: "id" });
      if (error) console.warn("[PlatformSyncHandler] Falha ao upsert api_settings no Supabase:", error.message);
    } else if (type === "supportChannels" && data) {
      const { error } = await supabase.from("platform_settings").upsert({
        id: "general",
        support_channels: data,
        support_whatsapp: data?.whatsappNumber,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }, { onConflict: "id" });
      if (error) console.warn("[PlatformSyncHandler] Falha ao upsert support_channels no Supabase:", error.message);
    }
  } catch (err) {
    console.warn("[PlatformSyncHandler] syncToSupabase erro:", err);
  }
}
function getPlatformData() {
  return ensureStoreFile();
}
function savePlatformData(payload) {
  try {
    const store = ensureStoreFile();
    const newVersion = Date.now();
    if (payload.type === "full") {
      Object.assign(store, payload.data);
    } else if (payload.type && payload.data !== void 0) {
      store[payload.type] = payload.data;
    }
    store.version = newVersion;
    store.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    inMemoryStore = store;
    const json = JSON.stringify(store, null, 2);
    try {
      if (!fs.existsSync(PRIMARY_DATA_DIR)) {
        fs.mkdirSync(PRIMARY_DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(PRIMARY_STORE_FILE, json, "utf8");
    } catch (fsErr) {
      console.error("[PlatformSyncHandler] Error writing to data file:", fsErr);
    }
    syncToSupabase(payload.type, payload.data).catch(() => {
    });
    return { success: true, version: newVersion };
  } catch (err) {
    console.error("[PlatformSyncHandler] Error saving store file:", err);
    return { success: false, version: 0 };
  }
}
function saveCertificate(cert) {
  const store = ensureStoreFile();
  const certs = store.certificates || [];
  const idx = certs.findIndex((c) => c.id === cert.id || c.code && c.code.toUpperCase() === cert.code.toUpperCase());
  if (idx >= 0) {
    certs[idx] = { ...certs[idx], ...cert };
  } else {
    certs.unshift(cert);
  }
  const result = savePlatformData({ type: "certificates", data: certs });
  return { success: result.success, certificate: cert, version: result.version };
}
function findCertificateByCode(rawCode) {
  if (!rawCode) return null;
  const store = ensureStoreFile();
  const certs = store.certificates || [];
  const cleanCode = rawCode.trim().toUpperCase().replace("#", "");
  const alphaCode = cleanCode.replace(/[^A-Z0-9]/g, "");
  return certs.find((c) => {
    if (!c || !c.code) return false;
    const cClean = c.code.trim().toUpperCase().replace("#", "");
    const cAlpha = cClean.replace(/[^A-Z0-9]/g, "");
    return cClean === cleanCode || alphaCode.length >= 4 && cAlpha === alphaCode;
  }) || null;
}
function getPlatformUsers() {
  const store = ensureStoreFile();
  return store.users || [];
}
function upsertPlatformUser(user) {
  const store = ensureStoreFile();
  const users = store.users || [];
  const idx = users.findIndex((u) => u.id === user.id || user.email && u.email?.toLowerCase() === user.email?.toLowerCase());
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  savePlatformData({ type: "users", data: users });
  return { success: true, user: idx >= 0 ? users[idx] : user };
}
function handleImageUpload(payload) {
  try {
    const { dataUrl, filename, prefix = "upload" } = payload;
    if (!dataUrl || !dataUrl.includes(",")) {
      return { success: false, error: "DataURL de imagem inv\xE1lido" };
    }
    const [header, base64Data] = dataUrl.split(",");
    let ext = "jpg";
    if (header.includes("image/png")) ext = "png";
    else if (header.includes("image/webp")) ext = "webp";
    else if (header.includes("image/svg")) ext = "svg";
    else if (header.includes("image/jpeg")) ext = "jpg";
    const safeName = filename ? path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, "_") : `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}.${ext}`;
    const buffer = Buffer.from(base64Data, "base64");
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const publicFilePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(publicFilePath, buffer);
      if (fs.existsSync(path.join(projectRoot, "dist"))) {
        if (!fs.existsSync(DIST_UPLOADS_DIR)) {
          fs.mkdirSync(DIST_UPLOADS_DIR, { recursive: true });
        }
        fs.writeFileSync(path.join(DIST_UPLOADS_DIR, safeName), buffer);
      }
      const publicUrl = `/uploads/${safeName}`;
      return { success: true, url: publicUrl };
    } catch (fsErr) {
      console.warn("[PlatformSyncHandler] Filesystem write failed, falling back to dataUrl:", fsErr);
      return { success: true, url: dataUrl };
    }
  } catch (err) {
    console.error("[PlatformSyncHandler] Error uploading image:", err);
    return { success: false, error: err.message || "Erro ao processar imagem" };
  }
}

// src/api/stripeWebhookHandler.ts
init_supabaseClient();

// src/api/zohoHandler.ts
var ZOHO_ACCOUNTS_DOMAINS = {
  "com": "https://accounts.zoho.com",
  "com.br": "https://accounts.zoho.com",
  "eu": "https://accounts.zoho.eu",
  "in": "https://accounts.zoho.in",
  "com.au": "https://accounts.zoho.com.au"
};
var ZOHO_MAIL_DOMAINS = {
  "com": "https://mail.zoho.com",
  "com.br": "https://mail.zoho.com",
  "eu": "https://mail.zoho.eu",
  "in": "https://mail.zoho.in",
  "com.au": "https://mail.zoho.com.au"
};
function getAccountsDomain(region = "com") {
  if (region === "com.br") return "https://accounts.zoho.com";
  return ZOHO_ACCOUNTS_DOMAINS[region] || "https://accounts.zoho.com";
}
function getMailDomain(region = "com") {
  if (region === "com.br") return "https://mail.zoho.com";
  return ZOHO_MAIL_DOMAINS[region] || "https://mail.zoho.com";
}
function translateZohoError(errorKey, desc) {
  switch (errorKey) {
    case "invalid_code":
      return "O c\xF3digo de concess\xE3o (Grant Token) expirou ou j\xE1 foi utilizado. No Zoho Self-Client, gere um novo c\xF3digo tempor\xE1rio de 10 minutos com o escopo correto.";
    case "invalid_client":
      return "Client ID ou Client Secret incorretos ou n\xE3o autorizados. Verifique suas credenciais no Zoho API Console.";
    case "invalid_client_secret":
      return "Client Secret inv\xE1lido para o Client ID informado.";
    case "invalid_redirect_uri":
      return "URL de Redirecionamento (Redirect URI) n\xE3o confere com o registrado no Zoho Self-Client.";
    case "access_denied":
      return "Permiss\xE3o negada pelo Zoho. Certifique-se de autorizar os escopos ZohoMail.messages.CREATE e ZohoMail.accounts.READ.";
    case "invalid_refresh_token":
      return "O Refresh Token informado \xE9 inv\xE1lido ou foi revogado no painel do Zoho.";
    default:
      return desc ? `${errorKey}: ${desc}` : `Erro Zoho OAuth: ${errorKey}`;
  }
}
async function exchangeZohoGrantToken(params) {
  const { grantToken, clientId, clientSecret, region = "com.br", redirectUri } = params;
  if (!grantToken?.trim()) {
    throw new Error("C\xF3digo de Concess\xE3o (Grant Token) \xE9 obrigat\xF3rio.");
  }
  if (!clientId?.trim() || !clientSecret?.trim()) {
    throw new Error("Client ID e Client Secret do Zoho s\xE3o obrigat\xF3rios.");
  }
  const accountsDomain = getAccountsDomain(region);
  const tokenUrl = `${accountsDomain}/oauth/v2/token`;
  const bodyData = new URLSearchParams({
    code: grantToken.trim(),
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    grant_type: "authorization_code"
  });
  if (redirectUri) {
    bodyData.append("redirect_uri", redirectUri);
  }
  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyData.toString()
    });
    const data = await response.json();
    if (data.error) {
      const errorMsg = translateZohoError(data.error, data.error_description);
      return {
        success: false,
        error: errorMsg,
        raw: data
      };
    }
    if (!data.refresh_token && !data.access_token) {
      return {
        success: false,
        error: "Zoho n\xE3o retornou tokens v\xE1lidos. Verifique os escopos atribu\xEDdos ao gerar o c\xF3digo no Self-Client.",
        raw: data
      };
    }
    return {
      success: true,
      refreshToken: data.refresh_token,
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
      apiDomain: data.api_domain,
      tokenType: data.token_type || "Bearer",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (err) {
    console.error("[Zoho Handler Exchange Error]", err);
    return {
      success: false,
      error: `Falha na requisi\xE7\xE3o para ${accountsDomain}: ${err.message || "Erro de rede"}`
    };
  }
}
async function refreshZohoAccessToken(params) {
  const { refreshToken, clientId, clientSecret, region = "com.br" } = params;
  if (!refreshToken?.trim()) {
    throw new Error("Refresh Token permanente n\xE3o configurado.");
  }
  if (!clientId?.trim() || !clientSecret?.trim()) {
    throw new Error("Client ID e Client Secret s\xE3o obrigat\xF3rios.");
  }
  const accountsDomain = getAccountsDomain(region);
  const tokenUrl = `${accountsDomain}/oauth/v2/token`;
  const bodyData = new URLSearchParams({
    refresh_token: refreshToken.trim(),
    client_id: clientId.trim(),
    client_secret: clientSecret.trim(),
    grant_type: "refresh_token"
  });
  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: bodyData.toString()
    });
    const data = await response.json();
    if (data.error) {
      return {
        success: false,
        error: translateZohoError(data.error, data.error_description),
        raw: data
      };
    }
    return {
      success: true,
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (err) {
    console.error("[Zoho Handler Refresh Error]", err);
    return {
      success: false,
      error: `Erro ao renovar token Zoho: ${err.message}`
    };
  }
}
async function sendZohoEmailMessage(params) {
  let {
    to,
    subject,
    html,
    fromEmail,
    fromName = "Deds Academy",
    replyTo,
    clientId,
    clientSecret,
    refreshToken,
    region = "com",
    accountId
  } = params;
  if (!clientId || !clientSecret || !refreshToken) {
    try {
      const { supabase: supabase2 } = await Promise.resolve().then(() => (init_supabaseClient(), supabaseClient_exports));
      const { data } = await supabase2.from("platform_settings").select("api_settings").eq("id", "general").maybeSingle();
      if (data?.api_settings?.email) {
        const em = data.api_settings.email;
        clientId = clientId || em.zohoClientId;
        clientSecret = clientSecret || em.zohoClientSecret;
        refreshToken = refreshToken || em.zohoRefreshToken;
        if (!params.accessToken && em.zohoAccessToken) params.accessToken = em.zohoAccessToken;
        region = region || em.zohoRegion || "com";
        accountId = accountId || em.zohoAccountId;
        fromEmail = fromEmail || em.fromEmail || em.zohoUser;
        fromName = fromName || em.fromName || "Deds Academy";
        replyTo = replyTo || em.replyToEmail || fromEmail;
      }
    } catch (err) {
      console.warn("[ZohoHandler] Falha ao consultar credenciais no Supabase:", err);
    }
  }
  let accessToken = params.accessToken?.trim();
  const renewAccessToken = async () => {
    if (refreshToken && clientId && clientSecret) {
      const refreshRes = await refreshZohoAccessToken({
        refreshToken: refreshToken.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        region
      });
      if (refreshRes.success && refreshRes.accessToken) {
        return refreshRes.accessToken;
      }
    }
    return null;
  };
  if (!accessToken && refreshToken && clientId && clientSecret) {
    const refreshed = await renewAccessToken();
    if (refreshed) {
      accessToken = refreshed;
    } else {
      return {
        success: false,
        error: "N\xE3o foi poss\xEDvel obter Access Token ativo do Zoho a partir do Refresh Token."
      };
    }
  }
  if (!accessToken) {
    return {
      success: false,
      error: "Token de autentica\xE7\xE3o do Zoho n\xE3o dispon\xEDvel. Conecte sua conta com o Grant Token ou Refresh Token."
    };
  }
  const mailDomain = getMailDomain(region);
  let targetAccountId = accountId?.trim();
  let mailboxAddress;
  let allowedSenders = [];
  try {
    let accRes = await fetch(`${mailDomain}/api/accounts`, {
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`
      }
    });
    if (accRes.status === 401 && refreshToken && clientId && clientSecret) {
      const refreshedToken = await renewAccessToken();
      if (refreshedToken) {
        accessToken = refreshedToken;
        accRes = await fetch(`${mailDomain}/api/accounts`, {
          headers: {
            "Authorization": `Zoho-oauthtoken ${accessToken}`
          }
        });
      }
    }
    if (accRes.ok) {
      const accData = await accRes.json();
      if (accData.data) {
        let accountObj = null;
        if (Array.isArray(accData.data) && accData.data.length > 0) {
          accountObj = accData.data[0];
        } else if (typeof accData.data === "object" && accData.data.accountId) {
          accountObj = accData.data;
        }
        if (accountObj) {
          if (!targetAccountId) {
            targetAccountId = String(accountObj.accountId);
          }
          mailboxAddress = accountObj.primaryEmailAddress || accountObj.mailboxAddress || accountObj.emailAddress?.find((e) => e?.isPrimary)?.mailId || accountObj.emailAddress?.[0]?.mailId;
          const collected = [];
          if (accountObj.primaryEmailAddress) collected.push(accountObj.primaryEmailAddress);
          if (accountObj.mailboxAddress) collected.push(accountObj.mailboxAddress);
          (accountObj.emailAddress || []).forEach((e) => e?.mailId && collected.push(e.mailId));
          (accountObj.sendMailDetails || []).forEach((s) => s?.fromAddress && collected.push(s.fromAddress));
          allowedSenders = Array.from(new Set(collected.map((a) => String(a).trim().toLowerCase())));
          console.log("[Zoho Mail] Remetentes autorizados:", allowedSenders.join(", "));
        }
      }
    } else {
      const accErr = await accRes.text();
      console.warn("[Zoho Mail /api/accounts HTTP " + accRes.status + "]:", accErr);
    }
  } catch (err) {
    console.warn("[Zoho Mail] Consulta /api/accounts falhou:", err?.message);
  }
  if (!targetAccountId) {
    return {
      success: false,
      error: "ID da conta (AccountId) n\xE3o identificado no Zoho Mail. Verifique se o escopo ZohoMail.accounts.READ est\xE1 ativo."
    };
  }
  const requestedFrom = fromEmail?.trim().toLowerCase();
  let finalFrom;
  if (requestedFrom && allowedSenders.includes(requestedFrom)) {
    finalFrom = requestedFrom;
  } else {
    finalFrom = mailboxAddress || allowedSenders[0] || fromEmail?.trim();
    if (requestedFrom && finalFrom && requestedFrom !== finalFrom.toLowerCase()) {
      console.warn(`[Zoho Mail] Remetente "${requestedFrom}" n\xE3o pertence \xE0 conta Zoho. Usando "${finalFrom}".`);
    }
  }
  if (!finalFrom) {
    return {
      success: false,
      error: "Nenhum endere\xE7o remetente v\xE1lido foi retornado pela conta Zoho Mail."
    };
  }
  const endpoint = `${mailDomain}/api/accounts/${targetAccountId}/messages`;
  const payload = {
    fromAddress: finalFrom,
    toAddress: to.trim(),
    subject: subject.trim(),
    content: html,
    mailFormat: "html"
  };
  try {
    console.log("[Zoho Mail Dispatching URL]:", endpoint);
    console.log("[Zoho Mail From Address]:", finalFrom, "To:", to.trim());
    let response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (response.status === 401 && refreshToken && clientId && clientSecret) {
      console.log("[Zoho Mail] 401 recebido. Renovando token...");
      const refreshedToken = await renewAccessToken();
      if (refreshedToken) {
        accessToken = refreshedToken;
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }
    }
    const responseText = await response.text();
    let result = null;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { rawText: responseText };
    }
    console.log("[Zoho Mail Response Status]:", response.status);
    console.log("[Zoho Mail Response Body]:", responseText);
    if (!response.ok || result?.status && result.status.code !== 200) {
      const apiErr = result?.data?.moreInfo || result?.data?.message || result?.status?.description || result?.error || result?.data?.description || responseText || "Erro na API Zoho Mail";
      return {
        success: false,
        error: `Zoho Mail API (${response.status}): ${apiErr}`,
        raw: result
      };
    }
    return {
      success: true,
      messageId: result.data?.messageId || `zoho_${Date.now()}`,
      status: "enviado",
      from: finalFrom,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (err) {
    console.error("[Zoho Send Error]", err);
    return {
      success: false,
      error: `Erro ao enviar e-mail via Zoho: ${err.message}`
    };
  }
}

// src/api/stripeWebhookHandler.ts
async function processStripeWebhook(eventPayload) {
  const eventType = eventPayload?.type;
  const eventData = eventPayload?.data?.object;
  if (!eventType || !eventData) {
    throw new Error("Formato de evento Stripe inv\xE1lido: type ou data.object ausente.");
  }
  console.log(`[Stripe Webhook] Recebido evento: ${eventType} (ID: ${eventPayload.id || "sem_id"})`);
  try {
    supabase.from("webhook_logs").insert({
      event_type: eventType,
      payload: eventPayload,
      status: "received"
    }).then(({ error }) => {
      if (error) console.warn("[Stripe Webhook] Falha ao registrar log no Supabase:", error.message);
    });
  } catch (logErr) {
    console.warn("[Stripe Webhook] Erro ao gravar log no Supabase:", logErr);
  }
  if (eventType === "checkout.session.completed") {
    const customerEmail = eventData.customer_details?.email || eventData.customer_email || eventData.metadata?.student_email || "";
    const customerName = eventData.customer_details?.name || eventData.metadata?.student_name || "Aluno Deds Academy";
    const studentCpf = eventData.metadata?.student_cpf || "";
    const rawCourseIds = eventData.metadata?.course_ids || "";
    const courseIds = rawCourseIds ? rawCourseIds.split(",").map((id) => id.trim()).filter(Boolean) : [];
    if (!customerEmail) {
      return {
        success: true,
        event: eventType,
        message: "checkout.session.completed recebido sem e-mail de cliente."
      };
    }
    const normalizedEmail = customerEmail.trim().toLowerCase();
    try {
      const users = getPlatformUsers();
      const existingUser = users.find((u) => u.email?.trim().toLowerCase() === normalizedEmail);
      if (existingUser) {
        const currentEnrolled = existingUser.enrolledCourseIds || existingUser.enrolled_course_ids || [];
        const updatedEnrolled = Array.from(/* @__PURE__ */ new Set([...currentEnrolled, ...courseIds]));
        existingUser.enrolledCourseIds = updatedEnrolled;
        existingUser.status = "ativo";
        if (!existingUser.name && customerName) existingUser.name = customerName;
        if (!existingUser.cpf && studentCpf) existingUser.cpf = studentCpf;
        upsertPlatformUser(existingUser);
        console.log(`[Stripe Webhook] Aluno existente ${normalizedEmail} matriculado nos cursos:`, courseIds);
      } else {
        const newUserId = `user-aluno-${Date.now()}`;
        const newUser = {
          id: newUserId,
          email: normalizedEmail,
          name: customerName,
          role: "aluno",
          status: "ativo",
          cpf: studentCpf || null,
          studentCode: `ALU-${Math.floor(1e3 + Math.random() * 9e3)}`,
          registeredAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          enrolledCourseIds: courseIds,
          completedCourseIds: []
        };
        upsertPlatformUser(newUser);
        console.log(`[Stripe Webhook] Novo aluno cadastrado e matriculado com sucesso no Hostinger: ${normalizedEmail}`);
      }
    } catch (storeErr) {
      console.warn("[Stripe Webhook] Erro ao sincronizar aluno no Hostinger store:", storeErr);
    }
    try {
      const { data: dbUser } = await supabase.from("users").select("*").eq("email", normalizedEmail).maybeSingle();
      if (dbUser) {
        const currentEnrolled = dbUser.enrolled_course_ids || [];
        const updatedEnrolled = Array.from(/* @__PURE__ */ new Set([...currentEnrolled, ...courseIds]));
        await supabase.from("users").update({
          enrolled_course_ids: updatedEnrolled,
          status: "ativo",
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", dbUser.id);
      } else {
        await supabase.from("users").insert({
          id: `user-aluno-${Date.now()}`,
          email: normalizedEmail,
          name: customerName,
          role: "aluno",
          status: "ativo",
          cpf: studentCpf || null,
          student_code: `ALU-${Math.floor(1e3 + Math.random() * 9e3)}`,
          registered_at: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
          enrolled_course_ids: courseIds,
          completed_course_ids: []
        });
      }
    } catch (sbUserErr) {
      console.warn("[Stripe Webhook] Erro ao sincronizar aluno no Supabase:", sbUserErr);
    }
    try {
      sendZohoEmailMessage({
        to: normalizedEmail,
        toName: customerName,
        subject: "\u{1F389} Matr\xEDcula Confirmada e Acesso Liberado - Deds Academy",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #1e293b; border-radius: 12px; background: #0f172a; color: #f8fafc;">
            <h1 style="color: #00c0a0; margin-bottom: 8px;">Pagamento Confirmado!</h1>
            <p style="font-size: 16px; color: #94a3b8;">Ol\xE1, <strong>${customerName}</strong>! Seu pagamento foi processado com sucesso pela Stripe.</p>
            <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #38bdf8;">Cursos Liberados:</p>
              <p style="margin: 4px 0 0; color: #cbd5e1;">${courseIds.join(", ")}</p>
            </div>
            <p style="font-size: 14px; color: #94a3b8;">Seu acesso imediato aos m\xF3dulos e certificados oficiais com validade jur\xEDdica j\xE1 est\xE1 dispon\xEDvel na plataforma.</p>
            <div style="text-align: center; margin-top: 28px;">
              <a href="https://dedsacademy.com.br" style="background: #00c0a0; color: #000; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Acessar \xC1rea do Aluno</a>
            </div>
          </div>
        `
      }).catch((mailErr) => console.warn("[Stripe Webhook] Falha no disparo de e-mail de pagamento:", mailErr));
    } catch (mailErr) {
      console.warn("[Stripe Webhook] Erro ao disparar notifica\xE7\xE3o de pagamento:", mailErr);
    }
    return {
      success: true,
      event: eventType,
      message: `Matr\xEDcula confirmada para ${normalizedEmail}`,
      studentEmail: normalizedEmail,
      coursesEnrolled: courseIds
    };
  }
  if (eventType === "charge.succeeded" || eventType === "payment_intent.succeeded") {
    const email = eventData.billing_details?.email || eventData.receipt_email || eventData.metadata?.student_email || "";
    const amount = eventData.amount ? eventData.amount / 100 : 0;
    console.log(
      `[Stripe Webhook] Pagamento aprovado (${eventType}): R$ ${amount.toFixed(2)} para ${email || "cliente"}`
    );
    return {
      success: true,
      event: eventType,
      message: `Cobran\xE7a no valor de R$ ${amount.toFixed(2)} confirmada com sucesso.`,
      studentEmail: email
    };
  }
  return {
    success: true,
    event: eventType,
    message: `Evento ${eventType} registrado com sucesso.`
  };
}

// server.ts
dotenv.config();
dotenv.config({ path: ".env.local" });
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var isInsideDist2 = path2.basename(__dirname2) === "dist";
var projectRoot2 = isInsideDist2 ? path2.resolve(__dirname2, "..") : process.cwd() || __dirname2;
var distDir = isInsideDist2 ? __dirname2 : path2.join(projectRoot2, "dist");
var publicDir = path2.join(projectRoot2, "public");
var app = express();
var port = process.env.PORT || 3e3;
app.use(express.json({ limit: "10mb" }));
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    platform: "Deds Academy",
    uptime: process.uptime(),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const origin = `${req.protocol}://${req.get("host")}`;
    const session = await createStripeCheckoutSession(req.body, origin);
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("[Stripe Express Error]", err);
    res.status(500).json({ error: err.message || "Erro ao processar checkout Stripe" });
  }
});
app.post("/api/stripe-webhook", async (req, res) => {
  try {
    const result = await processStripeWebhook(req.body);
    res.status(200).json({ received: true, ...result });
  } catch (err) {
    console.error("[Stripe Express Webhook Error]", err);
    res.status(400).json({ received: false, error: err.message || "Erro ao processar webhook" });
  }
});
app.post("/api/zoho-auth", async (req, res) => {
  try {
    const result = await exchangeZohoGrantToken(req.body);
    if (!result.success) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (err) {
    console.error("[Zoho Express Auth Error]", err);
    res.status(500).json({ success: false, error: err.message || "Erro ao autenticar Zoho" });
  }
});
app.post("/api/zoho-refresh", async (req, res) => {
  try {
    const result = await refreshZohoAccessToken(req.body);
    if (!result.success) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (err) {
    console.error("[Zoho Express Refresh Error]", err);
    res.status(500).json({ success: false, error: err.message || "Erro ao renovar token Zoho" });
  }
});
app.post("/api/zoho-send-email", async (req, res) => {
  try {
    const result = await sendZohoEmailMessage(req.body);
    console.log("[Zoho Express /api/zoho-send-email Result]:", JSON.stringify(result));
    if (!result.success) {
      res.status(400).json(result);
    } else {
      res.status(200).json(result);
    }
  } catch (err) {
    console.error("[Zoho Express Send Error]", err);
    res.status(500).json({ success: false, error: err.message || "Erro ao enviar e-mail via Zoho" });
  }
});
app.post("/api/issue-certificate", async (req, res) => {
  try {
    const { studentId, studentName, studentCpf, studentCode, courseId, courseTitle, hours, instructor, issueDate } = req.body;
    if (!studentId || !studentName || !courseId || !courseTitle) {
      return res.status(400).json({ error: "Dados incompletos para emiss\xE3o" });
    }
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    const randomSeq = Math.floor(1e3 + Math.random() * 9e3);
    const code = `DA${currentYear}-${randomSeq}`;
    const cert = {
      id: `cert-${courseId}-${Date.now()}`,
      code,
      courseId,
      courseTitle,
      studentId,
      studentCode: studentCode || `ALU-${studentId.slice(-4).toUpperCase()}`,
      studentName,
      studentCpf: studentCpf || "000.000.000-00",
      hours: Number(hours) || 40,
      issueDate: issueDate || (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
      instructor: instructor || "Deds Academy",
      status: "valido"
    };
    saveCertificate(cert);
    return res.status(201).json({ success: true, certificate: cert });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
var handleValidateCertificate = (req, res) => {
  try {
    const rawCode = req.query.codigo || req.query.code || req.body?.code;
    if (!rawCode) {
      return res.status(400).json({ error: "C\xF3digo de certificado n\xE3o informado." });
    }
    const cert = findCertificateByCode(rawCode);
    if (!cert) {
      return res.status(404).json({ valid: false, error: "Certificado n\xE3o encontrado nos registros oficiais." });
    }
    return res.status(200).json({
      valid: cert.status === "valido",
      status: cert.status,
      certificate: cert
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno ao validar certificado" });
  }
};
app.get("/api/validate-certificate", handleValidateCertificate);
app.post("/api/validate-certificate", handleValidateCertificate);
app.get("/api/platform-sync", (req, res) => {
  try {
    const data = getPlatformData();
    const etag = `W/"${data.version}"`;
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("ETag", etag);
    res.setHeader("X-Platform-Version", String(data.version));
    const clientEtag = req.headers["if-none-match"];
    if (clientEtag && clientEtag === etag) {
      return res.status(304).end();
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Erro ao obter dados da plataforma" });
  }
});
app.post("/api/platform-sync", (req, res) => {
  try {
    const result = savePlatformData(req.body);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("ETag", `W/"${result.version}"`);
    res.setHeader("X-Platform-Version", String(result.version));
    res.json({ ...result, invalidated: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Erro ao sincronizar dados" });
  }
});
app.post("/api/upload-image", (req, res) => {
  try {
    const result = handleImageUpload(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || "Erro ao fazer upload da imagem" });
  }
});
var uploadsDir = path2.join(publicDir, "uploads");
var distUploadsDir = path2.join(distDir, "uploads");
if (!fs2.existsSync(uploadsDir)) {
  try {
    fs2.mkdirSync(uploadsDir, { recursive: true });
  } catch {
  }
}
app.use("/uploads", express.static(uploadsDir, {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
  }
}));
if (distUploadsDir !== uploadsDir && fs2.existsSync(distUploadsDir)) {
  app.use("/uploads", express.static(distUploadsDir));
}
var certGenDir = path2.join(publicDir, "certificate-generator");
var certGenDistDir = path2.join(distDir, "certificate-generator");
var certGenFallback = path2.join(projectRoot2, "certificate-generator");
app.use("/certificate-generator", (req, res, next) => {
  if (req.url === "" || req.url === "/") {
    req.url = "/index.html";
  }
  next();
});
app.use("/certificate-generator", express.static(certGenDistDir));
app.use("/certificate-generator", express.static(certGenDir));
app.use("/certificate-generator", express.static(certGenFallback));
app.use(
  express.static(distDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else if (filePath.includes(`${path2.sep}assets${path2.sep}`) || /\/assets\//.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (/\.(jpg|jpeg|png|webp|svg|gif|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      }
    }
  })
);
var indexHtmlPath = path2.join(distDir, "index.html");
app.get("*", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (fs2.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(200).send("<!DOCTYPE html><html><head><title>Deds Academy</title></head><body><h1>Deds Academy</h1><p>Aplica\xE7\xE3o online.</p></body></html>");
  }
});
app.listen(Number(port), "0.0.0.0", () => {
  console.log(`[Deds Academy] Servidor rodando em http://0.0.0.0:${port}`);
  syncFromSupabase().catch((err) => {
    console.warn("[Deds Academy] Falha ao sincronizar dados iniciais do Supabase:", err);
  });
});
