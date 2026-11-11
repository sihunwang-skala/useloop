"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    }).catch(() => {
      // 설치 기능이 실패해도 웹 서비스 자체는 그대로 사용할 수 있습니다.
    });
  }, []);

  return null;
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const initialCheck = window.requestAnimationFrame(() => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches
        || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    });

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.cancelAnimationFrame(initialCheck);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone || (!installPrompt && !isIOS)) return null;

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    setShowIOSHelp((value) => !value);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={install}
        className="ml-1 inline-flex min-h-9 items-center rounded-lg border border-brand/25 bg-brand-soft px-3 text-sm font-semibold text-brand-dark hover:border-brand/40"
        aria-expanded={showIOSHelp}
      >
        앱 설치
      </button>
      {showIOSHelp && (
        <div role="status" className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-line bg-white p-4 text-sm text-ink shadow-lg">
          Safari의 공유 버튼을 누른 뒤 <strong>홈 화면에 추가</strong>를 선택하세요.
          <button type="button" className="mt-2 block text-xs font-medium text-brand" onClick={() => setShowIOSHelp(false)}>
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
