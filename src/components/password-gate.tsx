"use client";

import { useEffect, useState } from "react";

// 공유 비밀번호 게이트 (내부툴용 간단 보호) — 진행현황 시스템과 동일 비밀번호
const PASSWORD = "Dlsrks123!";
const SESSION_KEY = "cost_auth";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false); // 초기 sessionStorage 확인 전 깜빡임 방지
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "true") setUnlocked(true);
    setReady(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwInput === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
    } else {
      setPwError(true);
      setPwInput("");
    }
  }

  if (!ready) return null;

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="w-80">
          <p className="mb-4 text-center text-sm font-semibold text-gray-700">
            굿즈 원가·공급가 DB
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => {
                setPwInput(e.target.value);
                setPwError(false);
              }}
              placeholder="비밀번호를 입력하세요"
              autoFocus
              className={`border px-3 py-2 text-sm outline-none focus:border-gray-400 ${
                pwError ? "border-red-400" : "border-gray-200"
              }`}
            />
            {pwError && (
              <p className="text-center text-xs text-red-500">비밀번호가 올바르지 않습니다.</p>
            )}
            <button
              type="submit"
              className="bg-gray-800 py-2 text-sm text-white hover:bg-gray-900"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
