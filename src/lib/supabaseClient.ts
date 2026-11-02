// Supabase desativado - a plataforma agora utiliza armazenamento centralizado no servidor Hostinger (platform-store.json)
export const supabase = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null, count: 0 }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    eq: () => ({
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      select: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    ilike: () => ({
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    }),
    or: () => ({
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    order: () => Promise.resolve({ data: [], error: null }),
  }),
} as any;

