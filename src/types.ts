export type CourseStatus = 'publicado' | 'rascunho' | 'inativo' | 'previsto' | 'arquivado';

export type CourseLevel = 'Básico' | 'Intermediário' | 'Avançado' | 'Dedicado' | 'Todos os Níveis' | string;

export interface LessonAttachment {
  id: string;
  name: string;
  type: 'word' | 'excel' | 'pdf' | 'powerpoint' | 'outro';
  fileName: string;
  fileSize?: string;
  fileUrl: string; // Data URL or external link for download
}

export interface QuizOption {
  id: string;
  letter?: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation?: string;
}

export interface LessonQuiz {
  id: string;
  title: string;
  maxAttempts: number; // 1, 2, 3, 5, or 0 (0 = ilimitadas)
  passingScore?: number; // 70 (%)
  questions: QuizQuestion[];
}

export interface ModuleQuizOption {
  id: string;
  letter?: string;
  text: string;
  isCorrect: boolean;
}

export interface ModuleQuizQuestion {
  id: string;
  question: string;
  type: 'unica' | 'multipla'; // resposta única ou múltiplas
  weight: number; // definição de pesos para cada questão
  options: ModuleQuizOption[];
  explanation?: string;
}

export interface ModuleQuiz {
  id: string;
  title: string;
  enabled: boolean;
  maxAttempts?: number;
  passingScore?: number;
  questions: ModuleQuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  order?: number;
  duration?: string; // ex: "15 min"
  videoUrl?: string;
  videoFileName?: string;
  videoType?: 'upload' | 'url';
  imageUrl?: string;
  imageFileName?: string;
  attachments: LessonAttachment[];
  isFreePreview?: boolean;
  quiz?: LessonQuiz;
}

export interface CourseModule {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
  quiz?: ModuleQuiz;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorRole?: string;
  rating: number;
  reviewsCount: number;
  hours: number;
  lessonsCount?: number;
  originalPrice: number;
  currentPrice: number;
  image: string;
  imageFileName?: string;
  bannerImage?: string;
  bannerFileName?: string;
  badge: {
    text: string;
    variant: 'emerald' | 'secondary' | 'dark';
    expiresAt?: string;
  };
  category: string;
  level?: CourseLevel;
  filterTags: string[];
  description?: string;
  syllabus?: string[];
  modules?: CourseModule[];
  status?: CourseStatus;
  studentsCount?: number;
  createdAt?: string;
  publishedAt?: string;
  isAutoLaunchBadge?: boolean;
  videoUrl?: string;
  videoFileName?: string;
  videoType?: 'upload' | 'url';
  finalExam?: CourseFinalExam;
}

export interface Category {
  id: string;
  name: string;
  courseCount: number;
  icon: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

export interface CartItem {
  course: Course;
  quantity: number;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'aluno' | 'admin';
  password?: string;
  studentCode?: string;
  cpf?: string;
  phone?: string;
  avatar?: string;
  address?: {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  certificateData?: {
    customName?: string;
    customCpf?: string;
    signatureType?: 'upload' | 'draw' | 'automatic';
    signatureImage?: string; // base64 or URL or SVG
    fontStyle?: string;
  };
  status: 'ativo' | 'inativo' | 'pendente';
  registeredAt: string;
  lastAccess?: string;
  enrolledCourseIds: string[];
  completedCourseIds: string[];
}

export interface StudentProgress {
  courseId: string;
  percent: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonTitle: string;
  lastAccessed: string;
}

export interface CertificateItem {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCategory?: string;
  studentId?: string;
  studentCode?: string;
  studentName: string;
  studentCpf: string;
  hours: number;
  issueDate: string;
  code: string;
  instructor: string;
  status?: 'valido' | 'cancelado';
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface StudentOrder {
  id: string;
  orderNumber: string;
  title: string;
  date: string;
  purchaseTimestamp: number; // For 24h eligibility calculation
  paymentMethod: string;
  invoiceNumber: string;
  totalPrice: number;
  status: 'liquidado' | 'cancelamento_solicitado' | 'cancelado';
  courseIds: string[];
  cancellationRequestedAt?: string;
  cancellationReason?: string;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  role: string;
  specialty: string;
  avatar: string;
  coursesCount: number;
  studentsCount: number;
  rating: number;
  status: 'ativo' | 'inativo';
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  summary: string;
  content?: string;
  status: 'publicado' | 'rascunho';
  viewsCount?: number;
}

export interface CourseExamOption {
  id: string;
  letter: string; // 'A' | 'B' | 'C' | 'D' | 'E' ...
  text: string;
  isCorrect: boolean;
}

export interface CourseExamQuestion {
  id: string;
  title: string;
  type: 'assertiva' | 'opiniao'; // assertiva ou opinião
  selectionType: 'unica' | 'multipla'; // resposta única ou múltipla resposta
  points: number; // 1 ponto, 2 ponto, 3 ponto...
  options: CourseExamOption[];
  explanation?: string;
}

export interface SatisfactionQuestionConfig {
  enabled: boolean;
  requiredForCertificate: boolean;
  prompt: string;
  type: 'nps' | 'stars' | 'text';
}

export interface CourseFinalExam {
  id: string;
  title: string;
  description?: string;
  minPassingPercent: number; // default 80%
  maxAttempts: number; // default 3
  immediateResult: boolean; // default true
  allowRetake: boolean; // default true
  status: 'publicado' | 'rascunho';
  questions: CourseExamQuestion[];
  updatedAt?: string;
  requireSatisfactionSurvey?: boolean; // obrigatoriedade de responder a questão de satisfação para liberação do certificado
  satisfactionQuestion?: SatisfactionQuestionConfig;
}

export interface CourseReview {
  id: string;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  instructor?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  studentCode?: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  status?: 'aprovado' | 'oculto' | 'pendente';
  reply?: {
    message: string;
    date: string;
    author: string;
  };
}

export interface WebhookLogItem {
  id: string;
  service: 'pagamento' | 'video' | 'storage' | 'email';
  event: string;
  status: 'sucesso' | 'erro' | 'pendente';
  statusCode: number;
  payload: string;
  timestamp: string;
}

export interface ApiIntegrationSettings {
  payment: {
    provider: 'mercadopago' | 'asaas' | 'stripe' | 'pagseguro';
    environment: 'producao' | 'sandbox';
    publicKey: string;
    secretKey: string;
    pixKey?: string;
    boletoEnabled: boolean;
    pixEnabled: boolean;
    cardEnabled: boolean;
    webhookUrl: string;
    webhookSecret: string;
    status: 'conectado' | 'desconectado' | 'erro';
    lastTested?: string;
  };
  video: {
    provider: 'panda' | 'cloudflare' | 'vimeo' | 'bunny';
    apiKey: string;
    libraryId: string;
    playerToken: string;
    allowedDomains: string;
    drmEnabled: boolean;
    antiDownload: boolean;
    webhookUrl: string;
    status: 'conectado' | 'desconectado' | 'erro';
    lastTested?: string;
  };
  storage: {
    provider: 's3' | 'gcs' | 'firebase' | 'backblaze';
    bucketName: string;
    region: string;
    accessKey: string;
    secretKey: string;
    cdnDomain?: string;
    backupFolder: string;
    webhookUrl: string;
    status: 'conectado' | 'desconectado' | 'erro';
    lastTested?: string;
  };
  email: {
    provider: 'sendgrid' | 'resend' | 'ses' | 'mailgun';
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
    notifyOnEnrollment: boolean;
    notifyOnCompletion: boolean;
    notifyOnCertificate: boolean;
    webhookUrl: string;
    status: 'conectado' | 'desconectado' | 'erro';
    lastTested?: string;
  };
  database: {
    type: 'firestore' | 'postgresql' | 'mysql' | 'local_indexed';
    host: string;
    port: number;
    databaseName: string;
    user: string;
    ssl: boolean;
    poolSize: number;
    status: 'conectado' | 'desconectado' | 'erro';
    lastSynced?: string;
  };
  webhooks: WebhookLogItem[];
}

export interface TicketMessage {
  id: string;
  sender: 'aluno' | 'suporte' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  protocol: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  studentCpf: string;
  studentPhone?: string;
  studentStatus?: 'ativo' | 'inativo' | 'pendente';
  courseId?: string;
  courseTitle?: string;
  category?: string;
  subject: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aguardando_retorno' | 'respondido' | 'finalizado';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export type AdminTab =
  | 'visao-geral'
  | 'analise'
  | 'postagem-cursos'
  | 'gestao-curso'
  | 'categoria'
  | 'instrutores'
  | 'gestao-aluno'
  | 'usuarios'
  | 'blog'
  | 'certificado'
  | 'avaliacao-curso'
  | 'tickets'
  | 'configuracoes'
  | 'promocoes';

export type CertificateSide = 'frente' | 'verso';

export type CertificateFieldKey =
  | 'carga_horaria'
  | 'nome_curso'
  | 'nome_aluno'
  | 'cpf_aluno'
  | 'dados_instituicao'
  | 'data_emissao'
  | 'instrutor_assinatura'
  | 'codigo_emissao'
  | 'qr_code'
  | 'registro_academico'
  | 'amparo_legal'
  | 'conteudo_programatico';

export interface CertificateFieldConfig {
  key: CertificateFieldKey;
  label: string;
  side: CertificateSide;
  x: number; // 0 - 100 percentage from left
  y: number; // 0 - 100 percentage from top
  fontSize: number; // in pixels
  color: string;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  textAlign: 'left' | 'center' | 'right';
  visible: boolean;
  prefix?: string;
  suffix?: string;
  sampleText?: string;
  width?: number; // percentage width or auto
  maxWidth?: number; // percentage width for text wrap (e.g. 20, 25, 30, 40, 50, 75, 100)
  textWrap?: boolean; // whether text wrapping / quebra de texto is enabled
  fontFamily?: string; // font family (e.g. 'Inter, sans-serif', 'Playfair Display, serif', 'Cinzel, serif')
  size?: number; // For QR code size (in pixels)
}

export interface CertificateOfficialTemplate {
  id: string;
  name: string;
  institutionName: string;
  institutionCnpj: string;
  institutionCity: string;
  frontBgImage: string | null;
  backBgImage: string | null;
  frontPreset: 'dark_gold' | 'emerald_luxury' | 'classic_light' | 'custom';
  backPreset: 'dark_gold' | 'emerald_luxury' | 'classic_light' | 'custom';
  showBorders: boolean;
  aspectRatioMode?: 'auto' | '16_9' | 'a4';
  imageFitMode?: 'contain' | 'fill' | 'cover';
  defaultFontFamily?: string;
  fields: Record<CertificateFieldKey, CertificateFieldConfig>;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDateTime: string; // ISO or YYYY-MM-DDTHH:mm
  endDateTime: string;   // ISO or YYYY-MM-DDTHH:mm
  usageLimitPerCpf: number;
  usageLimitTotal: number;
  currentUses: number;
  status: 'ativo' | 'expirado' | 'inativo';
  description?: string;
  createdAt?: string;
}

export interface PromotionalCampaign {
  id: string;
  title: string;
  description?: string;
  targetCourseIds: string[]; // ['all'] or array of course IDs
  discountType: 'percentage' | 'fixed_price';
  discountValue: number; // % or new fixed price in R$
  startDateTime: string;
  endDateTime: string;
  status: 'ativa' | 'pausada' | 'expirada' | 'cancelada';
  originalPricesBackup?: Record<string, number>;
  createdAt: string;
}

export interface HeroBannerConfig {
  imageUrl: string;
  badge1Number: string;
  badge1Text: string;
  overlayTitle: string;
  overlaySubtitle: string;
  ratingScore: string;
  reviewsCountText: string;
}

export const DEFAULT_HERO_BANNER: HeroBannerConfig = {
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3RjbhYdYpcG8bEMcRoGanGqik_hu0oU1QgS3ppWFcKR3mWxNyU8UvQOaipy0SDpm3J2adzS1uqX0CplKZPzA35Kzz14SXTCUZrqaPeVovrBKFmxgMJRjmV_sW7q2ELgtX8Fc2SaMedqtrx2AVyk2Bd4oYyB1YfPZ0nJOcUuuEfjwOgTgq3kgUO6q2B997ZgQ-Rh3ZMrOC-DyIA_6qq0v6dqNkbEnzBBQzIUnK7AVkF-bb7wygYDP3PQ',
  badge1Number: '+10.000',
  badge1Text: 'Alunos certificados',
  overlayTitle: 'Carreiras Tech 2026',
  overlaySubtitle: 'Certificados Verificados',
  ratingScore: '4.9 / 5.0',
  reviewsCountText: 'Mais de 12.000 reviews verificadas',
};

export interface MiddlePromoBannerConfig {
  enabled: boolean;
  imageUrl: string;
  targetUrl: string;
  altText: string;
}

export const DEFAULT_MIDDLE_PROMO_BANNER: MiddlePromoBannerConfig = {
  enabled: true,
  imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&auto=format&fit=crop&q=80',
  targetUrl: '#courses-section',
  altText: 'Formações Profissionais e Tecnológicas com Certificado Válido - Deds Academy',
};


