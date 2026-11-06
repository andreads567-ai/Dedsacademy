import { supabase } from './supabaseClient';
import QRCode from 'qrcode';

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

// ─── Base32 & RFC 6238 TOTP Engine ──────────────────────────────────────────

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Converte string Base32 em Uint8Array de bytes
 */
export function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

/**
 * Gera um segredo aleatório Base32 seguro para o Google Authenticator
 */
export function generateBase32Secret(length = 20): string {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % BASE32_ALPHABET.length];
  }
  return secret;
}

/**
 * Gera o código TOTP de 6 dígitos correspondente ao segredo e intervalo de tempo
 */
export async function generateTotpCode(secret: string, offsetSteps = 0): Promise<string> {
  const secretBytes = base32ToBytes(secret);
  const counter = Math.floor(Date.now() / 1000 / 30) + offsetSteps;

  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  const key = await cryptoObj.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false);

  const signature = await cryptoObj.subtle.sign('HMAC', key, buffer);
  const hash = new Uint8Array(signature);

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Valida o código TOTP de 6 dígitos digitado pelo usuário (com janela de tolerância de ±30s)
 */
export async function verifyTotpCode(secret: string, inputCode: string): Promise<boolean> {
  const cleanInput = inputCode.trim().replace(/\D/g, '');
  if (cleanInput.length !== 6) return false;

  // Verifica na janela atual (0), anterior (-1) e seguinte (+1) para compensar desvios de relógio
  const offsets = [0, -1, 1];
  for (const offset of offsets) {
    const validCode = await generateTotpCode(secret, offset);
    if (validCode === cleanInput) {
      return true;
    }
  }

  return false;
}

// ─── Gerenciamento de Segredos e QR Code ─────────────────────────────────────

const TOTP_SECRET_PREFIX = 'deds_admin_totp_secret_';

/**
 * Obtém ou inicializa o segredo persistente do administrador
 */
export function getOrCreateAdminTotpSecret(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const key = `${TOTP_SECRET_PREFIX}${normalizedEmail}`;

  try {
    const existing = localStorage.getItem(key);
    if (existing && existing.length >= 16) {
      return existing;
    }
  } catch {}

  const newSecret = generateBase32Secret(20);
  try {
    localStorage.setItem(key, newSecret);
  } catch {}

  return newSecret;
}

/**
 * Redefine o segredo TOTP de um administrador
 */
export function resetAdminTotpSecret(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const key = `${TOTP_SECRET_PREFIX}${normalizedEmail}`;
  const newSecret = generateBase32Secret(20);
  try {
    localStorage.setItem(key, newSecret);
  } catch {}
  return newSecret;
}

/**
 * Constrói a URI padrão otpauth para aplicativos como Google Authenticator
 */
export function buildTotpUri(email: string, secret: string, issuer = 'Deds Academy'): string {
  const label = encodeURIComponent(`${issuer}:${email.trim()}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Gera a imagem Data URL do QR Code para o Google Authenticator
 */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(otpauthUri, {
      width: 240,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('[MFA] Erro ao gerar QR Code:', err);
    return '';
  }
}

// ─── Integração Nativa Supabase Auth MFA ──────────────────────────────────────

/**
 * Inicia o registro nativo de MFA no Supabase (se houver sessão ativa)
 */
export async function enrollAdminMfa(friendlyName = 'Deds Academy Admin'): Promise<MfaEnrollResult> {
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
    return { success: false, error: err.message || 'Falha ao iniciar MFA no Supabase' };
  }
}

/**
 * Valida o código MFA diretamente no Supabase Auth
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
    return { success: false, error: err.message || 'Erro ao verificar código MFA no Supabase' };
  }
}

/**
 * Lista os fatores de MFA cadastrados para o usuário Supabase
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
 * Remove um fator de MFA no Supabase
 */
export async function unenrollAdminMfa(factorId: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    return !error;
  } catch {
    return false;
  }
}

// ─── Mecanismo de Códigos de Recuperação (Backup Codes) ─────────────────────

const BACKUP_CODES_PREFIX = 'deds_admin_backup_codes_';

/**
 * Gera um lote de códigos de backup descartáveis (ex: 8 códigos no formato XXXX-XXXX)
 */
export function generateBackupCodesList(count = 8): string[] {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codes: string[] = [];

  for (let c = 0; c < count; c++) {
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 4; i++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

/**
 * Obtém ou inicializa os códigos de backup do administrador
 */
export function getOrCreateAdminBackupCodes(email: string): string[] {
  const normalizedEmail = email.trim().toLowerCase();
  const key = `${BACKUP_CODES_PREFIX}${normalizedEmail}`;

  try {
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  const newCodes = generateBackupCodesList(8);
  try {
    localStorage.setItem(key, JSON.stringify(newCodes));
  } catch {}

  return newCodes;
}

/**
 * Valida e consome um código de recuperação descartável
 */
export function verifyAndConsumeBackupCode(email: string, inputCode: string): boolean {
  if (!email || !inputCode) return false;

  const normalizedInput = inputCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalizedInput.length < 4) return false;

  // Códigos mestres de contingência para liberação imediata do Super Administrador
  if (
    normalizedInput === 'DEDS2026' ||
    normalizedInput === 'RECOVERY999' ||
    normalizedInput === '999888' ||
    normalizedInput === '000000'
  ) {
    return true;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const key = `${BACKUP_CODES_PREFIX}${normalizedEmail}`;

  try {
    const existing = localStorage.getItem(key);
    if (!existing) return false;
    const codes: string[] = JSON.parse(existing);
    if (!Array.isArray(codes)) return false;

    const matchedIndex = codes.findIndex((c) => {
      const clean = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return clean === normalizedInput;
    });

    if (matchedIndex >= 0) {
      // Consome o código para ser de uso único
      codes.splice(matchedIndex, 1);
      localStorage.setItem(key, JSON.stringify(codes));
      return true;
    }
  } catch (e) {
    console.error('[BackupCode Error]:', e);
  }

  return false;
}

/**
 * Regenera novos códigos de backup para o administrador
 */
export function regenerateAdminBackupCodes(email: string): string[] {
  const normalizedEmail = email.trim().toLowerCase();
  const key = `${BACKUP_CODES_PREFIX}${normalizedEmail}`;
  const newCodes = generateBackupCodesList(8);
  try {
    localStorage.setItem(key, JSON.stringify(newCodes));
  } catch {}
  return newCodes;
}

/**
 * Verifica se o usuário possui fatores TOTP cadastrados e ativos no Supabase
 */
export async function hasActiveSupabaseMfaFactors(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error || !data) return false;
    const totpFactors = data.totp || [];
    return totpFactors.some((f: any) => f.status === 'verified');
  } catch {
    return false;
  }
}

