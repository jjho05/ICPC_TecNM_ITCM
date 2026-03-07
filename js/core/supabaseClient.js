export const supabaseUrl = 'https://wcphiwxhikfwoukxkyoh.supabase.co';
export const supabaseKey = 'sb_publishable_YxgQjgHuvkK2mVBV0Y9ecA_YfagN';

export const supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;
