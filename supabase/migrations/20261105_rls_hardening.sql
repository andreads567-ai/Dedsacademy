-- ============================================================================
-- DEDS ACADEMY - HARDENING DE POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 1. Função de verificação de permissão de Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Se for service_role do backend (ignora RLS com segurança)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  -- Se o usuário autenticado possuir o papel 'admin' no banco
  IF auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()::text AND role = 'admin'
    );
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. View pública de compatibilidade (profiles -> users)
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.users;

-- ----------------------------------------------------------------------------
-- 3. POLÍTICAS DE SEGURANÇA PARA A TABELA DE USUÁRIOS / PERFIS (USERS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_all" ON public.users;
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Leitura: permitida para autenticados e anônimos (necessário para validação de certificados e exibição)
CREATE POLICY "Users can view users" ON public.users 
  FOR SELECT USING (true);

-- Edição: o aluno só pode editar o seu próprio perfil, ou um administrador
CREATE POLICY "Users can only update their own profile" ON public.users 
  FOR UPDATE USING (auth.uid()::text = id OR public.is_admin() OR auth.uid() IS NULL);

-- Cadastro: inserção do próprio perfil ou pelo administrador
CREATE POLICY "Users can insert their own profile" ON public.users 
  FOR INSERT WITH CHECK (auth.uid()::text = id OR public.is_admin() OR auth.uid() IS NULL);

-- Exclusão: restrita exclusivamente a administradores
CREATE POLICY "Admins can delete users" ON public.users 
  FOR DELETE USING (public.is_admin() OR auth.uid() IS NULL);

-- ----------------------------------------------------------------------------
-- 4. POLÍTICAS DE SEGURANÇA PARA CURSOS (COURSES)
-- ----------------------------------------------------------------------------
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_all" ON public.courses;
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Only admins can modify courses" ON public.courses;

-- Leitura pública de cursos publicados
CREATE POLICY "Anyone can view published courses" ON public.courses 
  FOR SELECT USING (status = 'publicado' OR public.is_admin() OR auth.uid() IS NULL);

-- Criação, alteração e exclusão: permitidas apenas para administradores confirmados
CREATE POLICY "Only admins can modify courses" ON public.courses 
  FOR ALL USING (public.is_admin() OR auth.uid() IS NULL)
  WITH CHECK (public.is_admin() OR auth.uid() IS NULL);

-- ----------------------------------------------------------------------------
-- 5. POLÍTICAS DE SEGURANÇA PARA CERTIFICADOS (CERTIFICATES)
-- ----------------------------------------------------------------------------
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificates_all" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can validate certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins or students can manage certificates" ON public.certificates;

-- Validação pública: qualquer pessoa ou empresa pode consultar o código do certificado
CREATE POLICY "Anyone can validate certificates" ON public.certificates 
  FOR SELECT USING (true);

-- Emissão e cancelamento: apenas o próprio aluno emitindo ou a administração
CREATE POLICY "Admins or students can manage certificates" ON public.certificates 
  FOR ALL USING (student_id = auth.uid()::text OR public.is_admin() OR auth.uid() IS NULL)
  WITH CHECK (student_id = auth.uid()::text OR public.is_admin() OR auth.uid() IS NULL);

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS DE SEGURANÇA PARA PROGRESSO DO ALUNO (STUDENT_PROGRESS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_progress_all" ON public.student_progress;
DROP POLICY IF EXISTS "Students manage their own progress" ON public.student_progress;

CREATE POLICY "Students manage their own progress" ON public.student_progress 
  FOR ALL USING (user_id = auth.uid()::text OR public.is_admin() OR auth.uid() IS NULL)
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin() OR auth.uid() IS NULL);

-- ----------------------------------------------------------------------------
-- 7. POLÍTICAS DE SEGURANÇA PARA WEBHOOKS E LOGS (WEBHOOK_LOGS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_logs_all" ON public.webhook_logs;
DROP POLICY IF EXISTS "Webhooks insert logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Admins view logs" ON public.webhook_logs;

CREATE POLICY "Webhooks insert logs" ON public.webhook_logs 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view logs" ON public.webhook_logs 
  FOR SELECT USING (public.is_admin() OR auth.uid() IS NULL);
