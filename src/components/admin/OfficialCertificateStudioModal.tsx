import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CertificateItem, UserAccount, Course } from '../../types';
import {
  generateSequentialCertificateCode,
  generateUniqueRandomCertificateCode,
  isCertificateCodeDuplicate,
  saveCertificateToDB,
} from '../../services/certificateService';
import { downloadCertificatePdf, downloadCertificatePng } from '../../utils/certificateGenerator';

interface OfficialCertificateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'issue' | 'view';
  initialCertificate?: CertificateItem | null;
  initialStudent?: UserAccount | null;
  initialStudentId?: string;
  students?: UserAccount[];
  courses?: Course[];
  existingCertificates?: CertificateItem[];
  onCertificateIssued?: (certificate: CertificateItem) => void;
}

export const OfficialCertificateStudioModal: React.FC<OfficialCertificateStudioModalProps> = ({
  isOpen,
  onClose,
  mode = 'issue',
  initialCertificate = null,
  initialStudent = null,
  initialStudentId,
  students = [],
  courses = [],
  existingCertificates = [],
  onCertificateIssued,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Determina dados padrão iniciais a partir do primeiro aluno/curso ou do certificado inicial
  const defaultStudent = useMemo(() => {
    if (initialCertificate) {
      return students.find((s) => s.id === initialCertificate.studentId) || null;
    }
    if (initialStudent) {
      return initialStudent;
    }
    if (initialStudentId) {
      return students.find((s) => s.id === initialStudentId) || null;
    }
    return students[0] || null;
  }, [initialCertificate, initialStudent, initialStudentId, students]);

  const defaultCourse = useMemo(() => {
    if (initialCertificate) {
      return courses.find((c) => c.id === initialCertificate.courseId) || null;
    }
    return courses[0] || null;
  }, [initialCertificate, courses]);

  // Estado dos dados do certificado
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    return initialCertificate?.studentId || defaultStudent?.id || '';
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string>(() => {
    return initialCertificate?.courseId || defaultCourse?.id || '';
  });

  const [studentName, setStudentName] = useState<string>(() => {
    return (
      initialCertificate?.studentName ||
      defaultStudent?.certificateData?.customName ||
      defaultStudent?.name ||
      'Aluno Deds Academy'
    );
  });
  const [studentCpf, setStudentCpf] = useState<string>(() => {
    return (
      initialCertificate?.studentCpf ||
      defaultStudent?.certificateData?.customCpf ||
      defaultStudent?.cpf ||
      '123.456.789-00'
    );
  });
  const [courseTitle, setCourseTitle] = useState<string>(() => {
    return initialCertificate?.courseTitle || defaultCourse?.title || 'Curso Profissionalizante';
  });
  const [hours, setHours] = useState<number>(() => {
    return initialCertificate?.hours || defaultCourse?.hours || 40;
  });
  const [issueDate, setIssueDate] = useState<string>(() => {
    return initialCertificate?.issueDate || new Date().toLocaleDateString('pt-BR');
  });
  const [code, setCode] = useState<string>(() => {
    return initialCertificate?.code || generateUniqueRandomCertificateCode(existingCertificates);
  });
  const [instructor, setInstructor] = useState<string>(() => {
    return initialCertificate?.instructor || defaultCourse?.instructor || 'Prof. Dr. Carlos Mendes';
  });
  const [institutionCnpj, setInstitutionCnpj] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : null;
    return (
      (saved && saved.trim()) ||
      (initialCertificate?.institutionCnpj && initialCertificate.institutionCnpj !== '45.678.901/0001-23'
        ? initialCertificate.institutionCnpj
        : null) ||
      initialCertificate?.institutionCnpj ||
      '45.678.901/0001-23'
    );
  });
  const [isCnpjSaved, setIsCnpjSaved] = useState(false);
  const [validationUrl, setValidationUrl] = useState<string>(() => {
    return (
      localStorage.getItem('deds_certificate_validation_url') ||
      'https://www.dedsacademy.com.br/validar-certificado'
    );
  });
  const [signatureImage, setSignatureImage] = useState<string | null>(() => {
    return defaultStudent?.certificateData?.signatureImage || null;
  });
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [isSpinningCode, setIsSpinningCode] = useState(false);

  // Canvas drawing ref para assinatura digital na tela
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const [viewSide, setViewSide] = useState<'frente' | 'verso' | 'ambos'>('ambos');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Verificação em tempo real de código duplicado
  const isDuplicateCode = useMemo(() => {
    return isCertificateCodeDuplicate(code, existingCertificates, initialCertificate?.id);
  }, [code, existingCertificates, initialCertificate]);

  // Ref que mantém sempre os dados mais recentes para callbacks sem closures obsoletas
  const currentDataRef = useRef({
    nome: studentName,
    cpf: studentCpf,
    cnpj: institutionCnpj,
    curso: courseTitle,
    horas: `${hours} horas`,
    data: issueDate,
    codigo: code,
    url: validationUrl,
    signatureImage,
    lado: viewSide,
  });

  useEffect(() => {
    currentDataRef.current = {
      nome: studentName,
      cpf: studentCpf,
      cnpj: institutionCnpj,
      curso: courseTitle,
      horas: `${hours} horas`,
      data: issueDate,
      codigo: code,
      url: validationUrl,
      signatureImage,
      lado: viewSide,
    };
  }, [studentName, studentCpf, institutionCnpj, courseTitle, hours, issueDate, code, validationUrl, signatureImage, viewSide]);

  /**
   * Envia os dados atualizados para o iframe do gerador oficial.
   * Suporta chamada direta síncrona via window.sincronizarCertificado (0ms de latência)
   * e fallback resiliente via postMessage.
   */
  const postDataToIframe = (customData?: Partial<{
    nome: string;
    cpf: string;
    cnpj: string;
    curso: string;
    horas: string;
    data: string;
    codigo: string;
    url: string;
    signatureImage: string | null;
    lado: 'frente' | 'verso' | 'ambos';
  }>) => {
    const cur = currentDataRef.current;
    const payload = {
      nome: customData?.nome !== undefined ? customData.nome : cur.nome,
      cpf: customData?.cpf !== undefined ? customData.cpf : cur.cpf,
      cnpj: customData?.cnpj !== undefined ? customData.cnpj : cur.cnpj,
      curso: customData?.curso !== undefined ? customData.curso : cur.curso,
      horas: customData?.horas !== undefined ? customData.horas : cur.horas,
      data: customData?.data !== undefined ? customData.data : cur.data,
      codigo: customData?.codigo !== undefined ? customData.codigo : cur.codigo,
      url: customData?.url !== undefined ? customData.url : cur.url,
      assinaturaImg: customData?.signatureImage !== undefined ? customData.signatureImage : cur.signatureImage,
      lado: customData?.lado !== undefined ? customData.lado : cur.lado,
    };

    // 1. Acesso direto ao window do iframe na mesma origem (síncrono, imediato)
    try {
      const win = iframeRef.current?.contentWindow as any;
      if (win && typeof win.sincronizarCertificado === 'function') {
        win.sincronizarCertificado(payload);
      }
    } catch (e) {
      // Ignora se restrição
    }

    // 2. Fallback via postMessage
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'DEDS_UPDATE_CERTIFICATE',
            payload,
          },
          '*'
        );
      }
    } catch (e) {
      console.warn('Erro ao sincronizar dados com o gerador:', e);
    }
  };

  // Inicialização e sincronização quando o modal abre ou as propriedades mudam
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'view' && initialCertificate) {
      setSelectedStudentId(initialCertificate.studentId || '');
      setSelectedCourseId(initialCertificate.courseId || '');
      setStudentName(initialCertificate.studentName);
      setStudentCpf(initialCertificate.studentCpf || '123.456.789-00');
      setCourseTitle(initialCertificate.courseTitle);
      setHours(initialCertificate.hours || 40);
      setIssueDate(initialCertificate.issueDate);
      setCode(initialCertificate.code);
      const savedGlobalCnpj = typeof window !== 'undefined' ? localStorage.getItem('deds_institution_cnpj') : null;
      const effectiveCnpjForView =
        (savedGlobalCnpj && savedGlobalCnpj.trim()) ||
        (initialCertificate.institutionCnpj && initialCertificate.institutionCnpj !== '45.678.901/0001-23'
          ? initialCertificate.institutionCnpj
          : null) ||
        initialCertificate.institutionCnpj ||
        '45.678.901/0001-23';

      setInstitutionCnpj(effectiveCnpjForView);
      setSignatureImage(null);

      const viewPayload = {
        nome: initialCertificate.studentName,
        cpf: initialCertificate.studentCpf || '123.456.789-00',
        cnpj: effectiveCnpjForView,
        curso: initialCertificate.courseTitle,
        horas: `${initialCertificate.hours || 40} horas`,
        data: initialCertificate.issueDate,
        codigo: initialCertificate.code,
        url: validationUrl,
        signatureImage: null,
      };
      postDataToIframe(viewPayload);
      setTimeout(() => postDataToIframe(viewPayload), 100);
    } else {
      const nextCode = generateUniqueRandomCertificateCode(existingCertificates);
      setCode(nextCode);

      const targetStudent =
        initialStudent ||
        (initialStudentId ? students.find((s) => s.id === initialStudentId) : null) ||
        students.find((s) => s.id === selectedStudentId) ||
        students[0];
      const targetCourse =
        courses.find((c) => c.id === selectedCourseId) || courses[0];

      let nextName = 'Aluno Deds Academy';
      let nextCpf = '123.456.789-00';
      let nextSig: string | null = null;
      let nextCourseTitle = 'Curso Profissionalizante';
      let nextHours = 40;
      let nextInstructor = 'Prof. Dr. Carlos Mendes';
      const nextDate = new Date().toLocaleDateString('pt-BR');

      if (targetStudent) {
        setSelectedStudentId(targetStudent.id);
        nextName = targetStudent.certificateData?.customName || targetStudent.name;
        nextCpf = targetStudent.certificateData?.customCpf || targetStudent.cpf || '123.456.789-00';
        nextSig = targetStudent.certificateData?.signatureImage || null;
        setStudentName(nextName);
        setStudentCpf(nextCpf);
        setSignatureImage(nextSig);
      }

      if (targetCourse) {
        setSelectedCourseId(targetCourse.id);
        nextCourseTitle = targetCourse.title;
        nextHours = targetCourse.hours || 40;
        nextInstructor = targetCourse.instructor || 'Prof. Dr. Carlos Mendes';
        setCourseTitle(nextCourseTitle);
        setHours(nextHours);
        setInstructor(nextInstructor);
      }

      setIssueDate(nextDate);

      const issuePayload = {
        nome: nextName,
        cpf: nextCpf,
        cnpj: institutionCnpj,
        curso: nextCourseTitle,
        horas: `${nextHours} horas`,
        data: nextDate,
        codigo: nextCode,
        url: validationUrl,
        signatureImage: nextSig,
      };
      postDataToIframe(issuePayload);
      setTimeout(() => postDataToIframe(issuePayload), 100);
    }
  }, [isOpen, mode, initialCertificate, initialStudent, initialStudentId]);

  // Listener para o handshake do gerador (DEDS_CERTIFICATE_READY)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'DEDS_CERTIFICATE_READY') {
        postDataToIframe();
        setTimeout(() => postDataToIframe(), 100);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sincroniza em tempo real com o gerador quando qualquer campo muda
  useEffect(() => {
    postDataToIframe();
  }, [studentName, studentCpf, courseTitle, hours, issueDate, code, institutionCnpj, validationUrl, signatureImage, viewSide]);

  // Quando o usuário seleciona outro aluno
  const handleStudentChange = (sId: string) => {
    setSelectedStudentId(sId);
    const found = students.find((s) => s.id === sId);
    if (found) {
      const nextName = found.certificateData?.customName || found.name;
      const nextCpf = found.certificateData?.customCpf || found.cpf || '123.456.789-00';
      const nextSig = found.certificateData?.signatureImage || null;

      setStudentName(nextName);
      setStudentCpf(nextCpf);
      setSignatureImage(nextSig);

      postDataToIframe({
        nome: nextName,
        cpf: nextCpf,
        signatureImage: nextSig,
      });
      setTimeout(() => {
        postDataToIframe({
          nome: nextName,
          cpf: nextCpf,
          signatureImage: nextSig,
        });
      }, 80);
    }
  };

  // Quando o usuário seleciona outro curso
  const handleCourseChange = (cId: string) => {
    setSelectedCourseId(cId);
    const found = courses.find((c) => c.id === cId);
    if (found) {
      const nextTitle = found.title;
      const nextHours = found.hours || 40;
      const nextInstructor = found.instructor || 'Prof. Dr. Carlos Mendes';

      setCourseTitle(nextTitle);
      setHours(nextHours);
      setInstructor(nextInstructor);

      postDataToIframe({
        curso: nextTitle,
        horas: `${nextHours} horas`,
      });
    }
  };

  // Gerar novo código aleatório sem duplicidade
  const handleGenerateRandomCode = () => {
    setIsSpinningCode(true);
    const nextCode = generateUniqueRandomCertificateCode(existingCertificates);
    setCode(nextCode);
    postDataToIframe({ codigo: nextCode });
    setTimeout(() => setIsSpinningCode(false), 450);
  };

  // Edição manual do código
  const handleCodeChange = (newCode: string) => {
    const val = newCode.toUpperCase().trim();
    setCode(val);
    postDataToIframe({ codigo: val });
  };

  // Alteração e persistência do CNPJ
  const handleCnpjChange = (newVal: string) => {
    setInstitutionCnpj(newVal);
    postDataToIframe({ cnpj: newVal });
  };

  const handleSaveCnpj = () => {
    const clean = institutionCnpj.trim();
    if (!clean) return;
    try {
      localStorage.setItem('deds_institution_cnpj', clean);
      // Sincroniza e atualiza imediatamente todos os certificados locais
      const savedStorage = localStorage.getItem('deds_certificates_list');
      if (savedStorage) {
        const parsed = JSON.parse(savedStorage);
        if (Array.isArray(parsed)) {
          const updated = parsed.map((c: any) => ({
            ...c,
            institutionCnpj: clean,
          }));
          localStorage.setItem('deds_certificates_list', JSON.stringify(updated));
        }
      }
      window.dispatchEvent(new CustomEvent('deds_cnpj_updated', { detail: clean }));
    } catch (e) {}
    setIsCnpjSaved(true);
    postDataToIframe({ cnpj: clean });
    setTimeout(() => setIsCnpjSaved(false), 2500);
  };

  // Alteração da Data de Conclusão
  const handleDateChange = (newDate: string) => {
    setIssueDate(newDate);
    postDataToIframe({ data: newDate });
  };

  // Alteração do Link de Validação (QR Code)
  const handleValidationUrlChange = (newUrl: string) => {
    setValidationUrl(newUrl);
    try {
      localStorage.setItem('deds_certificate_validation_url', newUrl);
    } catch (e) {}
    postDataToIframe({ url: newUrl });
  };

  // Upload de arquivo de imagem da assinatura
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        setSignatureImage(dataUrl);
        postDataToIframe({ signatureImage: dataUrl });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Handlers para o Canvas de Assinatura na Tela
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pos = getCanvasPos(e);
    ctx.strokeStyle = '#0b2230';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    isDrawingRef.current = false;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSaveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureImage(dataUrl);
    postDataToIframe({ signatureImage: dataUrl });
    setIsSigningOpen(false);
  };

  const handleRemoveSignature = () => {
    setSignatureImage(null);
    postDataToIframe({ signatureImage: null });
  };

  // Alternar lado exibido (Frente / Verso / Ambos)
  const handleToggleSide = (side: 'frente' | 'verso' | 'ambos') => {
    setViewSide(side);
    postDataToIframe({ lado: side });
  };

  // Salvar certificado no sistema (banco / localStorage)
  const handleSaveCertificate = async () => {
    if (isDuplicateCode) {
      alert('Atenção: Já existe um certificado cadastrado com este código no sistema. Gere outro código aleatório antes de salvar.');
      return;
    }

    try {
      setIsSaving(true);
      const student = students.find((s) => s.id === selectedStudentId);
      const course = courses.find((c) => c.id === selectedCourseId);

      const newCert: CertificateItem = {
        id: initialCertificate?.id || `cert-${Date.now()}`,
        studentId: selectedStudentId || (student ? student.id : 'user-custom'),
        studentCode: student?.studentCode || 'ALU-8921',
        studentName,
        studentCpf,
        courseId: selectedCourseId || (course ? course.id : 'course-custom'),
        courseTitle,
        courseCategory: course?.category || 'Certificação Profissional',
        hours: Number(hours) || 40,
        issueDate,
        code,
        instructor,
        institutionCnpj,
        status: 'valido',
      };

      try {
        localStorage.setItem('deds_institution_cnpj', institutionCnpj.trim());
        window.dispatchEvent(new CustomEvent('deds_cnpj_updated', { detail: institutionCnpj.trim() }));
      } catch (e) {}

      await saveCertificateToDB(newCert, student);

      if (onCertificateIssued) {
        onCertificateIssued(newCert);
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao registrar certificado:', err);
      alert('Erro ao registrar certificado no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  // Download do PDF oficial em 300 DPI direto do estúdio
  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const currentStudent = students.find((s) => s.id === selectedStudentId);
      const currentCourse = courses.find((c) => c.id === selectedCourseId);

      await downloadCertificatePdf(
        {
          studentName,
          studentCpf,
          studentCode: currentStudent?.studentCode || 'ALU-8921',
          courseTitle,
          courseCategory: currentCourse?.category || 'Certificação Profissional',
          hours: Number(hours) || 40,
          issueDate,
          code,
          instructor,
          institutionCnpj,
          signatureImage,
        },
        undefined,
        true
      );
    } catch (err) {
      console.error('Erro ao gerar PDF do certificado:', err);
      alert('Houve um problema ao gerar o PDF. Tente novamente.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Download da imagem PNG (Frente ou Verso)
  const handleDownloadPng = async (side: 'frente' | 'verso') => {
    try {
      const currentStudent = students.find((s) => s.id === selectedStudentId);
      const currentCourse = courses.find((c) => c.id === selectedCourseId);

      await downloadCertificatePng(
        {
          studentName,
          studentCpf,
          studentCode: currentStudent?.studentCode || 'ALU-8921',
          courseTitle,
          courseCategory: currentCourse?.category || 'Certificação Profissional',
          hours: Number(hours) || 40,
          issueDate,
          code,
          instructor,
          institutionCnpj,
          signatureImage,
        },
        undefined,
        side
      );
    } catch (err) {
      console.error('Erro ao gerar PNG:', err);
    }
  };

  // URL dinâmica calibrada para o iframe do gerador oficial
  const iframeSrc = useMemo(() => {
    const p = new URLSearchParams();
    p.set('nome', studentName || '');
    p.set('cpf', studentCpf || '');
    p.set('cnpj', institutionCnpj);
    p.set('curso', courseTitle || '');
    p.set('horas', `${hours} horas`);
    p.set('data', issueDate);
    p.set('codigo', code);
    p.set('url', validationUrl);
    p.set('lado', viewSide);
    p.set('preview', '1');
    p.set('readonly', '1');
    return `/certificate-generator/index.html?${p.toString()}`;
  }, [studentName, studentCpf, courseTitle, hours, issueDate, code, institutionCnpj, validationUrl, viewSide, selectedStudentId, selectedCourseId, initialCertificate?.id, isOpen]);

  // URL viva e sempre atualizada para abrir em nova aba
  const openInNewTabUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set('nome', studentName || 'Aluno');
    p.set('cpf', studentCpf || '');
    p.set('cnpj', institutionCnpj);
    p.set('curso', courseTitle || '');
    p.set('horas', `${hours} horas`);
    p.set('data', issueDate);
    p.set('codigo', code);
    p.set('url', validationUrl);
    p.set('lado', viewSide);
    return `/certificate-generator/index.html?${p.toString()}`;
  }, [studentName, studentCpf, courseTitle, hours, issueDate, code, institutionCnpj, validationUrl, viewSide]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog Card Fullscreen / Studio */}
      <div className="relative w-full max-w-7xl h-[95vh] flex flex-col bg-[#0b1320] border border-emerald-500/30 rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Superior do Estúdio */}
        <div className="px-5 py-3.5 bg-[#070d18] border-b border-border-subtle flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-lg shrink-0">
              <span className="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  {mode === 'issue'
                    ? 'Estúdio de Emissão Oficial de Certificado'
                    : 'Visualização do Certificado no Gerador Oficial'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Gerador Incorporado • A4 Paisagem (300 DPI)
                </span>
              </div>
              <p className="text-xs text-text-tertiary">
                Sistema Oficial Frente e Verso • Lei Federal nº 9.394/96 • Validação QR Code
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Controles de Visualização Frente / Verso / Ambos */}
            <div className="flex items-center bg-surface-raised rounded-xl p-0.5 border border-border-subtle text-xs">
              <button
                type="button"
                onClick={() => handleToggleSide('ambos')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewSide === 'ambos' ? 'bg-primary text-black shadow-xs' : 'text-text-secondary hover:text-white'
                }`}
              >
                Frente &amp; Verso
              </button>
              <button
                type="button"
                onClick={() => handleToggleSide('frente')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewSide === 'frente' ? 'bg-primary text-black shadow-xs' : 'text-text-secondary hover:text-white'
                }`}
              >
                Frente
              </button>
              <button
                type="button"
                onClick={() => handleToggleSide('verso')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewSide === 'verso' ? 'bg-primary text-black shadow-xs' : 'text-text-secondary hover:text-white'
                }`}
              >
                Verso
              </button>
            </div>

            {/* Exportar PDF oficial */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-1.5 rounded-xl bg-accent-gold/20 hover:bg-accent-gold/30 text-accent-gold border border-accent-gold/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Baixar Certificado Oficial em PDF A4 de Alta Definição"
            >
              <span className="material-symbols-outlined text-sm">
                {isDownloadingPdf ? 'hourglass_top' : 'picture_as_pdf'}
              </span>
              <span>{isDownloadingPdf ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>

            {/* Abrir em nova aba */}
            <a
              href={openInNewTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border border-border-subtle text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir gerador em aba dedicada do navegador com todos os dados atuais"
            >
              <span className="material-symbols-outlined text-sm text-accent-gold">open_in_new</span>
              <span>Abrir em Nova Aba</span>
            </a>

            {/* Salvar / Registrar no sistema */}
            <button
              type="button"
              onClick={handleSaveCertificate}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">
                {isSaving ? 'hourglass_top' : 'check_circle'}
              </span>
              <span>{isSaving ? 'Salvando...' : (mode === 'issue' ? 'Registrar no Sistema' : 'Salvar Alterações')}</span>
            </button>

            {/* Fechar modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-text-tertiary hover:text-white hover:bg-surface-raised transition-colors cursor-pointer"
              title="Fechar Estúdio"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Barra de Seleção Rápida e Configuração Oficial */}
        <div className="px-5 py-2.5 bg-[#0d1626] border-b border-border-subtle flex flex-col gap-2 shrink-0">
            {/* Linha 1: Aluno, Curso, Código com Botão Circular, Data e CNPJ */}
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2.5 flex-wrap flex-1">
                {students.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Aluno:</span>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => handleStudentChange(e.target.value)}
                      className="px-2.5 py-1 bg-surface-overlay border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary font-medium cursor-pointer max-w-[200px] truncate"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.cpf || s.studentCode || s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {courses.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Curso:</span>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="px-2.5 py-1 bg-surface-overlay border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary font-medium cursor-pointer max-w-[200px] truncate"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.hours}h)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Código do Certificado com Botão Circular Aleatório e Validador de Duplicidade */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Código:</span>
                  <div className={`flex items-center rounded-lg border px-1.5 py-0.5 bg-surface-overlay ${
                    isDuplicateCode ? 'border-red-500/60 bg-red-950/20' : 'border-emerald-500/30'
                  }`}>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="DA2026-0001"
                      className="w-32 bg-transparent text-emerald-400 font-mono text-xs font-bold outline-none uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomCode}
                      className="p-1 text-text-tertiary hover:text-white rounded hover:bg-surface-raised cursor-pointer transition-transform"
                      title="Gerar código aleatório único (sem duplicidade)"
                    >
                      <span className={`material-symbols-outlined text-sm ${isSpinningCode ? 'animate-spin text-emerald-400' : ''}`}>
                        autorenew
                      </span>
                    </button>
                  </div>
                  {isDuplicateCode && (
                    <span className="text-[10px] text-red-400 font-bold bg-red-950/60 border border-red-500/40 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      Código em uso!
                    </span>
                  )}
                </div>

                {/* Data de Conclusão */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Data:</span>
                  <input
                    type="text"
                    value={issueDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-24 px-2 py-1 bg-surface-overlay border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary font-medium"
                    title="Data de Conclusão / Emissão do Certificado"
                  />
                </div>

                {/* CNPJ Deds Academy com Botão Salvar */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">CNPJ:</span>
                  <div className="flex items-center rounded-lg border border-border-subtle bg-surface-overlay overflow-hidden">
                    <input
                      type="text"
                      value={institutionCnpj}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-36 px-2 py-1 bg-transparent text-xs text-text-primary outline-none font-medium"
                      title="CNPJ da Instituição no Certificado"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCnpj}
                      className={`px-2 py-1 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        isCnpjSaved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border-l border-border-subtle'
                      }`}
                      title="Salvar CNPJ para este certificado e próximas emissões"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {isCnpjSaved ? 'check' : 'save'}
                      </span>
                      <span>{isCnpjSaved ? 'Salvo!' : 'Salvar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status de Sincronização */}
              <span className="text-[10px] text-emerald-400/90 font-medium hidden xl:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                Sincronização em tempo real ativa
              </span>
            </div>

            {/* Linha 2: Link de Validação QR Code, Assinatura na Tela / Imagem e Atalhos PNG */}
            <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1.5 border-t border-border-subtle/50">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                {/* Link de Validação QR Code */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[280px] max-w-md">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider shrink-0">
                    Validação (QR):
                  </span>
                  <input
                    type="text"
                    value={validationUrl}
                    onChange={(e) => handleValidationUrlChange(e.target.value)}
                    placeholder="https://www.dedsacademy.com.br/validar-certificado"
                    className="w-full px-2 py-1 bg-surface-overlay border border-border-subtle rounded-lg text-xs text-text-primary outline-none focus:border-primary font-medium"
                    title="URL base do QR Code e do link no verso do certificado"
                  />
                </div>

                {/* Opções de Assinatura */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Assinatura:</span>
                  
                  {/* Botão Assinar na Tela */}
                  <button
                    type="button"
                    onClick={() => setIsSigningOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border border-border-subtle text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Desenhar assinatura na tela (touch / mouse)"
                  >
                    <span>✍️</span>
                    <span>Assinar na Tela</span>
                  </button>

                  {/* Botão Carregar Imagem de Assinatura */}
                  <label
                    htmlFor="studio-sig-file-upload"
                    className="px-2.5 py-1 rounded-lg bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border border-border-subtle text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Carregar imagem de arquivo com a assinatura do aluno"
                  >
                    <span className="material-symbols-outlined text-xs text-accent-gold">upload</span>
                    <span>Carregar Imagem</span>
                  </label>
                  <input
                    id="studio-sig-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Indicador de Assinatura Personalizada Ativa com Opção de Remover */}
                  {signatureImage && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span className="text-[11px] font-medium">Assinatura Anexada</span>
                      <button
                        type="button"
                        onClick={handleRemoveSignature}
                        className="ml-1 text-text-tertiary hover:text-red-400 cursor-pointer p-0.5 rounded"
                        title="Remover assinatura e usar caligrafia padrão"
                      >
                        <span className="material-symbols-outlined text-[13px]">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botões PNG rápidos */}
              <div className="flex items-center gap-1 pl-2 border-l border-border-subtle">
                <span className="text-[10px] uppercase font-bold text-text-tertiary">PNG:</span>
                <button
                  type="button"
                  onClick={() => handleDownloadPng('frente')}
                  className="px-2 py-0.5 rounded bg-surface-overlay hover:bg-surface-raised text-[11px] text-text-secondary hover:text-white border border-border-subtle cursor-pointer"
                  title="Baixar imagem PNG da Frente em 300 DPI"
                >
                  Frente
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPng('verso')}
                  className="px-2 py-0.5 rounded bg-surface-overlay hover:bg-surface-raised text-[11px] text-text-secondary hover:text-white border border-border-subtle cursor-pointer"
                  title="Baixar imagem PNG do Verso em 300 DPI"
                >
                  Verso
                </button>
              </div>
            </div>
          </div>

        {/* Palco do Gerador Oficial Incorporado (Iframe 100% Funcional e Sincronizado) */}
        <div className="flex-1 w-full relative bg-slate-900 overflow-hidden">
          <iframe
            key="official-studio-generator-iframe"
            ref={iframeRef}
            src={iframeSrc}
            title="Gerador Oficial de Certificados Deds Academy"
            className="w-full h-full border-0 bg-white"
            allow="clipboard-write"
            onLoad={() => {
              postDataToIframe();
              setTimeout(() => postDataToIframe(), 80);
              setTimeout(() => postDataToIframe(), 250);
            }}
          />
        </div>
      </div>

      {/* Modal Dedicado de Assinatura Digital na Tela */}
      {isSigningOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#0b1320] border border-emerald-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-xl">✍️</span>
                <h4 className="text-base font-bold text-white">Desenhe a Assinatura do Aluno</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSigningOpen(false)}
                className="p-1 rounded-lg text-text-tertiary hover:text-white hover:bg-surface-raised cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-text-tertiary">
              Utilize o mouse, touchpad ou dedo (em telas touch) para desenhar a assinatura. Ela será inserida automaticamente no certificado.
            </p>

            <div className="w-full border-2 border-dashed border-border-subtle rounded-xl bg-white overflow-hidden p-1 flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={460}
                height={150}
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleStopDraw}
                onMouseLeave={handleStopDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDraw}
                onTouchEnd={handleStopDraw}
                className="w-full max-w-[460px] h-[150px] cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border border-border-subtle text-xs font-semibold cursor-pointer"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveSignature();
                    setIsSigningOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border border-border-subtle text-xs font-semibold cursor-pointer"
                >
                  Usar Fonte Caligráfica
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSigningOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-surface-overlay text-text-secondary hover:text-white border border-border-subtle text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCanvasSignature}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Salvar Assinatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
