import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { EMPTY_STATE, mergeStates, sameState, type SyncState } from "../lib/sync";

const TABLE = "user_state";

export type SyncStatus = "signedOut" | "loading" | "synced" | "error";

interface Params {
  /** 현재 로컬 상태 */
  local: SyncState;
  /** 원격에서 받은 상태를 로컬에 반영 */
  applyRemote: (s: SyncState) => void;
}

/**
 * Supabase 세션 관리 + 기기간 상태 동기화.
 * - 로그인 시: 원격 상태를 받아 로컬과 병합(무손실) → 로컬 반영 + 원격 저장
 * - 이후 로컬 변경: 디바운스 후 원격 push
 * - 다른 기기 변경: realtime 구독으로 수신 → 병합 반영
 */
export function useSync({ local, applyRemote }: Params) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>("signedOut");
  const localRef = useRef(local);
  localRef.current = local;
  const applyRef = useRef(applyRemote);
  applyRef.current = applyRemote;
  const lastPushed = useRef<SyncState | null>(null);

  // 세션 초기화 + 변화 구독
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 로그인 시: pull → merge → apply + push, 그리고 realtime 구독
  useEffect(() => {
    if (!supabase || !session) {
      setStatus("signedOut");
      return;
    }
    const sb = supabase;
    const uid = session.user.id;
    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const { data, error } = await sb.from(TABLE).select("data").eq("user_id", uid).maybeSingle();
        if (error) throw error;
        const remote = (data?.data as SyncState) ?? EMPTY_STATE;
        const merged = mergeStates(localRef.current, remote);
        if (cancelled) return;
        applyRef.current(merged);
        lastPushed.current = merged;
        await sb.from(TABLE).upsert({ user_id: uid, data: merged, updated_at: new Date().toISOString() });
        if (!cancelled) setStatus("synced");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    const channel = sb
      .channel(`user_state:${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLE, filter: `user_id=eq.${uid}` }, (payload) => {
        const remote = (payload.new as { data?: SyncState })?.data;
        if (!remote) return;
        const merged = mergeStates(localRef.current, remote);
        if (!sameState(merged, localRef.current)) {
          applyRef.current(merged);
          lastPushed.current = merged;
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [session]);

  // 로컬 변경 → 디바운스 push
  useEffect(() => {
    if (!supabase || !session || status !== "synced") return;
    if (lastPushed.current && sameState(lastPushed.current, local)) return;
    const uid = session.user.id;
    const t = setTimeout(async () => {
      const payload: SyncState = { ...local, updatedAt: Date.now() };
      lastPushed.current = payload;
      await supabase!.from(TABLE).upsert({ user_id: uid, data: payload, updated_at: new Date().toISOString() });
    }, 800);
    return () => clearTimeout(t);
  }, [local, session, status]);

  const signIn = async (email: string) => {
    if (!supabase) return { error: "sync disabled" };
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    return { error: error?.message };
  };

  /** 비밀번호 로그인 — 계정 없으면 즉시 가입(이메일 확인 꺼진 경우 바로 로그인). */
  const signInPassword = async (email: string, password: string) => {
    if (!supabase) return { error: "sync disabled" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return {};
    // 계정이 없으면 가입 시도
    if (/invalid login credentials/i.test(error.message)) {
      const { data, error: upErr } = await supabase.auth.signUp({ email, password });
      if (upErr) return { error: upErr.message };
      if (!data.session) return { error: "가입됨 — 이메일 확인이 켜져 있어요. Supabase Auth에서 'Confirm email'을 끄면 바로 로그인됩니다." };
      return {};
    }
    return { error: error.message };
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return { session, status, signIn, signInPassword, signOut };
}
