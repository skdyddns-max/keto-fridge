import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * 자격증명이 주입된 경우에만 클라이언트를 만든다.
 * 미설정이면 null → 앱은 동기화 없이 localStorage 단독으로 정상 동작 (무료·오프라인 유지).
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const syncEnabled = supabase !== null;
