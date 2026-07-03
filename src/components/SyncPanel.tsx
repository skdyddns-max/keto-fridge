import { useState } from "react";
import type { SyncStatus } from "../store/useSync";
import type { Session } from "@supabase/supabase-js";

interface Props {
  session: Session | null;
  status: SyncStatus;
  onSignIn: (email: string) => Promise<{ error?: string }>;
  onSignOut: () => void;
}

const STATUS_LABEL: Record<SyncStatus, string> = {
  signedOut: "로그인하면 기기간 동기화돼요",
  loading: "동기화 중…",
  synced: "동기화됨",
  error: "동기화 오류 — 잠시 후 다시 시도",
};

/** 이메일 매직링크 로그인 + 동기화 상태 (Supabase 설정 시에만 렌더) */
export function SyncPanel({ session, status, onSignIn, onSignOut }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const { error } = await onSignIn(email.trim());
    if (error) setErr(error);
    else setSent(true);
  };

  return (
    <details className="mb-4 rounded-xl border border-stone-200 bg-white px-4 py-3">
      <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-stone-600">
        <span>기기간 동기화</span>
        <span className={`text-xs ${status === "synced" ? "text-emerald-600" : status === "error" ? "text-rose-600" : "text-stone-400"}`}>
          {session ? STATUS_LABEL[status] : "로그아웃됨"}
        </span>
      </summary>

      <div className="mt-3">
        {session ? (
          <div className="flex items-center justify-between text-sm">
            <span className="truncate text-stone-600">{session.user.email}</span>
            <button type="button" onClick={onSignOut} className="text-xs text-stone-400 underline hover:text-stone-600">
              로그아웃
            </button>
          </div>
        ) : sent ? (
          <p className="text-sm text-emerald-700">
            {email} 로 로그인 링크를 보냈어요. 메일함을 확인해주세요.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <p className="text-xs text-stone-400">{STATUS_LABEL.signedOut}. 이메일로 링크를 보내드려요(비밀번호 없음).</p>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
              <button type="submit" className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                링크 받기
              </button>
            </div>
            {err && <p className="text-xs text-rose-600">{err}</p>}
          </form>
        )}
      </div>
    </details>
  );
}
