import { supabase } from './supabaseClient';

export interface MfaEnrollResult {
  success: boolean;
  factorId?: string;
  qrCode?: string;
  secret?: string;
  uri?: string;
  error?: string;
}

export interface MfaVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Inicia o registro de 2FA / MFA (TOTP - Google Authenticator / Authy)
 */
export async function enrollAdminMfa(friendlyName: string = 'Deds Academy Admin'): Promise<MfaEnrollResult> {
  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao iniciar MFA' };
  }
}

/**
 * Valida o código de 6 dígitos gerado pelo Google Authenticator para ativar o MFA
 */
export async function verifyAdminMfa(factorId: string, verificationCode: string): Promise<MfaVerifyResult> {
  try {
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      return { success: false, error: challengeError.message };
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verificationCode.trim(),
    });

    if (verifyError) {
      return { success: false, error: verifyError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao verificar código MFA' };
  }
}

/**
 * Lista os fatores de MFA cadastrados para o usuário logado
 */
export async function listUserMfaFactors() {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return { all: [], totp: [] };
    return data;
  } catch {
    return { all: [], totp: [] };
  }
}

/**
 * Remove um fator de MFA
 */
export async function unenrollAdminMfa(factorId: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    return !error;
  } catch {
    return false;
  }
}
