// 한국어 사용 방법 녹화: 실제 앱(Demo Mode)을 브라우저로 진행하면서 하단 자막 + 우측 단계 표시를 화면에 입힙니다.
//   DEMO_MODE=true npm run build && DEMO_MODE=true npx next start -p 3100   (재시작 직후 상태에서)
//   npm run demo:record   → docs/demo/useloop-demo-ko.webm (mp4/gif 변환은 scripts/make-demo-assets.sh)
import { chromium } from "playwright-core";
import { mkdirSync, renameSync, rmSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = new URL("../docs/demo/", import.meta.url).pathname;
const TMP = OUT + ".tmp/";
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const PW = "demo-password-1234";
const BENEFIT = "신규 사용자 7일 무료 체험";
const MY_FB = "알림 설정을 더 세밀하게 고를 수 있으면 좋겠어요. (데모 피드백)";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: "ko-KR", recordVideo: { dir: TMP, size: { width: 1280, height: 720 } } });
await ctx.addCookies([{ name: "useloop_locale", value: "ko", url: BASE }]);

// 자막·단계 표시·마우스 커서를 모든 페이지에 입힌다 (페이지 이동 후에도 유지)
await ctx.addInitScript(() => {
  const render = () => {
    if (!document.body) return;
    let st = document.getElementById("__cap_style");
    if (!st) {
      st = document.createElement("style");
      st.id = "__cap_style";
      st.textContent = `body{padding-bottom:120px!important}
      #__cap{position:fixed;left:0;right:0;bottom:0;z-index:2147483647;background:rgba(17,24,39,.94);color:#fff;padding:18px 32px;font:600 22px/1.45 -apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;text-align:center;min-height:84px;display:flex;align-items:center;justify-content:center}
      #__step{position:fixed;top:56px;right:16px;z-index:2147483647;background:#1d4ed8;color:#fff;padding:8px 14px;border-radius:999px;font:700 15px -apple-system,"Apple SD Gothic Neo",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25)}
      #__cur{position:fixed;width:22px;height:22px;border-radius:50%;background:rgba(239,68,68,.55);border:2px solid #ef4444;z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%);left:-50px;top:-50px}`;
      document.head.appendChild(st);
      for (const id of ["__cap", "__step", "__cur"]) { const d = document.createElement("div"); d.id = id; document.body.appendChild(d); }
    }
    const c = JSON.parse(localStorage.getItem("__cap") || "{}");
    document.getElementById("__cap").textContent = c.text || "";
    document.getElementById("__cap").style.display = c.text ? "flex" : "none";
    document.getElementById("__step").textContent = c.step || "";
    document.getElementById("__step").style.display = c.step ? "block" : "none";
  };
  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("__cap", render);
  document.addEventListener("mousemove", (e) => { const c = document.getElementById("__cur"); if (c) { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; } }, true);
});

const page = await ctx.newPage();
const say = async (step, text, ms = 3200) => {
  await page.evaluate(([s, t]) => { localStorage.setItem("__cap", JSON.stringify({ step: s, text: t })); window.dispatchEvent(new Event("__cap")); }, [step, text]);
  await page.waitForTimeout(ms);
};
const go = async (path) => { await page.goto(BASE + path); await page.waitForLoadState("networkidle"); };
const click = async (loc, wait = 900) => { await loc.scrollIntoViewIfNeeded(); await loc.hover(); await page.waitForTimeout(500); await loc.click(); await page.waitForTimeout(wait); };
const type = async (loc, value) => { await loc.scrollIntoViewIfNeeded(); await loc.hover(); await loc.click(); await loc.pressSequentially(value, { delay: 45 }); await page.waitForTimeout(400); };
const login = async (email, label) => {
  await go("/login");
  await say(label, `데모 계정으로 로그인합니다. (${email})`, 2400);
  await type(page.locator("input[name=email]"), email);
  await type(page.locator("input[name=password]"), PW);
  await click(page.locator("button[type=submit]"), 1500);
};
const logout = async () => { await click(page.locator('button:has-text("로그아웃")'), 1200); };

// ── 0. 소개 ──
await go("/");
await say("소개", "UseLoop — 고객의 자발적인 피드백과 기업의 응답·체험 혜택을 잇는 양방향 플랫폼입니다.", 4200);
await say("소개", "의무적으로 서비스를 테스트하는 곳이 아닙니다. 혜택은 긍정적인 평가나 평점과 연결되지 않습니다.", 4200);
await page.mouse.wheel(0, 500); await page.waitForTimeout(800);
await say("소개", "※ 이 영상은 가상 데이터로 동작하는 데모 모드 화면입니다.", 3000);

// ── 1. 고객: 탐색 ──
await go("/discover");
await say("① 고객 · 서비스 탐색", "로그인 없이도 서비스를 둘러볼 수 있습니다. 리뷰를 쓸 필요도 없습니다.", 3600);
await click(page.locator('nav[aria-label="카테고리"] a:has-text("개발 도구")'), 1200);
await say("① 고객 · 서비스 탐색", "카테고리로 좁혀 보고, '광고' 표시가 붙은 서비스는 일반 결과와 구분됩니다.", 3800);
await click(page.locator('nav[aria-label="카테고리"] a:has-text("전체")'), 1000);
await click(page.locator('a:has-text("노트웨이브")').first(), 1500);
await say("① 고객 · 서비스 상세", "서비스 소개와 체험 혜택을 확인합니다. 이용 여부는 전적으로 내가 결정합니다.", 4200);

// ── 2. 고객: 피드백 ──
await login("customer@demo.useloop.test", "① 고객 · 로그인");
await go("/discover");
await click(page.locator('a:has-text("노트웨이브")').first(), 1200);
await click(page.locator('a:has-text("이 서비스에 피드백 남기기")'), 1500);
await say("② 고객 · 자발적 피드백", "쓰고 있는 서비스에 비공개 피드백을 남깁니다. 기업과 나에게만 보입니다.", 3800);
await click(page.locator('label:has-text("부정적")'), 600);
await say("② 고객 · 자발적 피드백", "긍정이든 부정이든 동일하게 취급되며, 어떤 보상도 평가 내용에 좌우되지 않습니다.", 4200);
await type(page.locator("textarea[name=suggestion]"), MY_FB);
await click(page.locator('label:has-text("기능 추가")'), 500);
await click(page.locator('button:has-text("비공개 피드백 보내기")'), 1800);
await say("② 고객 · 내 피드백", "접수되었습니다. 이후 기업의 답변과 진행 상황을 이곳에서 확인합니다.", 3600);

// ── 3. 기업: 답변 + 혜택 등록 ──
await logout();
await login("company@demo.useloop.test", "③ 기업 · 로그인");
await go("/company");
await say("③ 기업 · 대시보드", "기업은 받은 피드백 현황과 진행 상태를 한눈에 봅니다. 고객 이름·이메일은 보이지 않습니다.", 4200);
await go("/company/feedback");
const card = page.locator("li").filter({ hasText: MY_FB }).last();
await say("③ 기업 · 피드백 답변", "피드백에 답변하고 '검토 중 → 개선 예정 → 개선 완료'로 진행 상황을 알립니다.", 3800);
await click(card.locator("summary", { hasText: "답변하기" }), 700);
await type(card.locator("textarea[name=body]"), "소중한 의견 감사합니다. 알림 설정 세분화를 검토하겠습니다. (데모 답변)");
await card.locator("select[name=progress]").selectOption("planned");
await click(card.locator('button:has-text("답변 등록")'), 1500);
await go("/company/benefits");
await say("③ 기업 · 혜택 제공", "체험 혜택을 등록합니다. 관리자 승인 후에 고객에게 보입니다.", 3600);
await page.locator("select[name=serviceId]").selectOption({ label: "노트웨이브 (데모)" });
await type(page.locator("input[name=title]"), BENEFIT);
await type(page.locator("textarea[name=terms]"), "신규 가입자 1인 1회 제공됩니다");
await type(page.locator("textarea[name=howToUse]"), "가입 후 설정 화면에서 코드를 입력하세요");
await click(page.locator("input[name=issuerAuthorityConfirmed]"), 500);
await say("③ 기업 · 혜택 제공", "평점·리뷰와 연결된 문구는 등록할 수 없고, 발급 권한을 직접 확인해야 합니다.", 4000);
await click(page.locator('button:has-text("등록하고 승인 요청")'), 1800);
await logout();

// ── 4. 관리자 승인 ──
await login("admin@demo.useloop.test", "④ 관리자 · 로그인");
await go("/admin");
await say("④ 관리자 · 승인", "관리자는 서비스와 혜택을 검토합니다. 평점 연계 조건이 없는지, 발급 권한이 있는지 확인합니다.", 4600);
await click(page.locator("li").filter({ hasText: BENEFIT }).locator('button:has-text("혜택 승인")'), 1500);
await say("④ 관리자 · 승인", "승인하면 대기열에서 사라지고 고객에게 노출됩니다. 신고 처리와 광고 표시도 이곳에서 관리합니다.", 4200);
await logout();

// ── 5. 고객: 혜택 받기 ──
await login("customer@demo.useloop.test", "⑤ 고객 · 로그인");
await go("/discover");
await click(page.locator('a:has-text("노트웨이브")').first(), 1200);
await say("⑤ 고객 · 혜택 받기", "승인된 혜택이 보입니다. 피드백을 쓰지 않았어도 누구나 받을 수 있습니다.", 3800);
const bcard = page.locator("div, li, section, article").filter({ hasText: BENEFIT }).filter({ has: page.locator('button:has-text("혜택 받기")') }).last();
await click(bcard.locator('button:has-text("혜택 받기")'), 1500);
await go("/my/benefits");
await say("⑤ 고객 · 내 혜택", "발급된 코드는 본인만 볼 수 있고, 같은 혜택은 한 번만 받을 수 있습니다.", 4200);
const code = ((await page.locator("body").innerText()).match(/UL-[A-Z2-9]{4}-[A-Z2-9]{4}/) ?? [])[0];
await go("/my/feedback");
await say("⑤ 고객 · 내 피드백", "기업의 답변과 진행 상황도 함께 확인합니다.", 3600);
await logout();

// ── 6. 기업: 코드 사용 처리 ──
await login("company@demo.useloop.test", "⑥ 기업 · 로그인");
await go("/company/benefits");
await say("⑥ 기업 · 코드 사용 처리", "고객이 제시한 코드를 입력하면 한 번만 사용 처리됩니다.", 3400);
await type(page.locator("input[name=code]"), code ?? "");
await click(page.locator('button:has-text("사용 처리")'), 1500);
await say("⑥ 기업 · 코드 사용 처리", "같은 코드를 다시 입력하면 '이미 사용된 코드'로 차단됩니다.", 3400);
await page.locator("input[name=code]").fill(code ?? "");
await click(page.locator('button:has-text("사용 처리")'), 1500);
await say("⑥ 기업 · 코드 사용 처리", "이미 사용된 코드는 다시 쓸 수 없습니다.", 3200);

await say("마무리", "UseLoop — 자발적인 사용과 피드백, 기업의 응답과 혜택을 잇습니다. (포트폴리오용 데모 MVP)", 4500);
const vid = page.video();
await ctx.close();
await browser.close();
renameSync(await vid.path(), OUT + "useloop-demo-ko.webm");
rmSync(TMP, { recursive: true, force: true });
console.log("saved", OUT + "useloop-demo-ko.webm");
