// 실행 중인 데모 서버(DEMO_MODE=true)에서 고객·기업·관리자 핵심 흐름을 실제 브라우저로 진행하며 검증하고 스크린샷을 저장합니다.
//   DEMO_MODE=true npm run build && DEMO_MODE=true npx next start -p 3100   (다른 터미널)
//   BASE_URL=http://localhost:3100 npm run e2e:capture
// Chrome(설치된 브라우저)을 사용합니다. 데모 서버는 재시작 직후 초기 상태여야 합니다.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
const PW = "demo-password-1234";
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok) => { results.push({ name, ok: !!ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); };

const browser = await chromium.launch({ channel: "chrome", headless: true });
const mk = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "ko-KR", deviceScaleFactor: 1 });
  return ctx.newPage();
};
const shot = (page, name, full = false) => page.screenshot({ path: `${OUT}${name}.png`, fullPage: full });
const login = async (page, email) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name=email]', email);
  await page.fill('input[name=password]', PW);
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
};
const BENEFIT = "신규 사용자 7일 무료 체험";
// 해당 혜택 카드(제목과 버튼을 함께 가진 가장 안쪽 요소)
const benefitCard = (page) => page.locator("div, li, section, article").filter({ hasText: BENEFIT }).filter({ has: page.locator('button:has-text("혜택 받기")') }).last();
const settle = (page) => page.waitForTimeout(1200); // 스트리밍 응답 후 클라이언트 redirect 대기
const text = (page) => page.locator("body").innerText();

// ---------- 0. 비로그인: 홈 / 탐색 (로그인·리뷰 없이 가능) ----------
const anon = await mk();
await anon.goto(`${BASE}/`);
await shot(anon, "01-home");
await anon.goto(`${BASE}/discover`);
check("비로그인 서비스 탐색 가능 + 데모 배너", (await text(anon)).includes("데모 모드") && (await text(anon)).includes("노트웨이브"));
check("광고(스폰서) 라벨로 분리 표시", /광고/.test(await text(anon)));
await shot(anon, "02-customer-discover");
await anon.goto(`${BASE}/admin`); await settle(anon);
check("비로그인 /admin 접근 시 로그인으로 이동", anon.url().includes("/login"));
await anon.goto(`${BASE}/login`);
await shot(anon, "03-login-demo");

// ---------- 1. 기업이 혜택 등록 (승인 전에는 고객에게 안 보임) ----------
const co = await mk();
await login(co, "company@demo.useloop.test");
await co.goto(`${BASE}/company`);
await shot(co, "07-company-dashboard");
await co.goto(`${BASE}/company/benefits`);
await co.selectOption('select[name=serviceId]', { label: "노트웨이브 (데모)" });
await co.fill('input[name=title]', "신규 사용자 7일 무료 체험");
await co.fill('textarea[name=terms]', "신규 가입자 1인 1회, 별점 5점을 남기면 제공");
await co.fill('textarea[name=howToUse]', "가입 후 설정에서 코드를 입력하세요");
await co.check('input[name=issuerAuthorityConfirmed]');
await co.click('button:has-text("등록하고 승인 요청")');
await co.waitForTimeout(800);
check("평점 연계 문구가 포함된 혜택 등록은 거절", (await text(co)).includes("평가·평점·리뷰와 관련된 문구"));
await co.fill('textarea[name=terms]', "신규 가입자 1인 1회 제공됩니다");
await co.click('button:has-text("등록하고 승인 요청")');
await co.waitForURL(/saved=1/);
check("기업: 혜택 등록 → 승인 대기", (await text(co)).includes("관리자가 승인하면"));

// ---------- 2. 고객: 자발적 탐색 → 서비스 상세 → 피드백 ----------
const cu = await mk();
await login(cu, "customer@demo.useloop.test");
await cu.goto(`${BASE}/discover`);
await cu.click('a:has-text("페이로그")');
await cu.waitForURL(/\/services\//);
const payUrl = cu.url();
await shot(cu, "04-customer-service-detail", true);
await cu.goto(payUrl.replace(/$/, "/feedback"));
await shot(cu, "05-customer-feedback-form", true);
await cu.click('label:has-text("부정적")');
await cu.fill('textarea[name=disliked]', "정산 내역 내보내기가 불편했어요. (데모 피드백)");
await cu.fill('textarea[name=suggestion]', "CSV 내보내기를 추가해 주세요.");
await cu.click('button:has-text("비공개 피드백 보내기")');
await cu.waitForURL(/\/my\/feedback/);
check("고객: 부정적 피드백도 동일하게 접수", (await text(cu)).includes("정산 내역 내보내기"));
check("고객: 보상 문구가 피드백 화면에 없음(혜택 조건 미연결)", !(await (async () => { await cu.goto(payUrl + "/feedback"); return /쿠폰을 받|혜택을 받으려면/.test(await text(cu)); })()));
// 승인 전 혜택은 고객에게 안 보임
await cu.goto(`${BASE}/discover`);
await cu.click('a:has-text("노트웨이브")');
await cu.waitForURL(/\/services\//);
const noteUrl = cu.url();
check("고객: 승인 전 혜택은 노출되지 않음", !(await text(cu)).includes("신규 사용자 7일 무료 체험"));

// ---------- 3. 기업: 답변 + 진행 상태 ----------
await co.goto(`${BASE}/company/feedback`); await settle(co);
check("기업: 자기 서비스 피드백 조회(작성자 이메일 비노출)", !(await text(co)).includes("customer@demo"));
await shot(co, "08-company-feedback", true);
await co.goto(`${BASE}/company`);

// ---------- 4. 관리자 승인 ----------
const ad = await mk();
await login(ad, "admin@demo.useloop.test");
await ad.goto(`${BASE}/admin`);
await shot(ad, "09-admin-queue", true);
await ad.locator('li:has-text("신규 사용자 7일 무료 체험")').locator('button:has-text("혜택 승인")').click();
await ad.waitForTimeout(800);
await ad.goto(`${BASE}/admin`);
check("관리자: 혜택 승인 후 대기열에서 사라짐", !(await text(ad)).includes("신규 사용자 7일 무료 체험"));

// ---------- 5. 고객: 혜택 받기(피드백 여부와 무관) / 중복 불가 ----------
await cu.goto(noteUrl);
check("고객: 승인된 혜택 노출", (await text(cu)).includes("신규 사용자 7일 무료 체험"));
await benefitCard(cu).locator('button:has-text("혜택 받기")').click();
await cu.waitForTimeout(800);
await cu.goto(`${BASE}/my/benefits`);
const mine = await text(cu);
const code = (mine.match(/UL-[A-Z2-9]{4}-[A-Z2-9]{4}/) ?? [])[0];
check("고객: 코드 발급(요청한 혜택)", !!code && mine.includes(BENEFIT));
await shot(cu, "06-customer-my-benefits", true);
await cu.goto(noteUrl);
check("고객: 받은 혜택은 '받은 혜택'으로 표시되고 재수령 버튼이 없음(중복 방지)", /받은 혜택/.test(await text(cu)) && (await cu.locator('button:has-text("혜택 받기")').count()) === 1); // 남은 1개는 다른 혜택

// ---------- 6. 기업: 코드 사용 처리 (1회만) ----------
await co.goto(`${BASE}/company/benefits`);
await co.fill('input[name=code]', code ?? "");
await co.click('button:has-text("사용 처리")');
await co.waitForTimeout(800);
check("기업: 코드 사용 처리 성공", (await text(co)).includes("사용 처리되었습니다"));
await co.fill('input[name=code]', code ?? "");
await co.click('button:has-text("사용 처리")');
await co.waitForTimeout(800);
check("기업: 같은 코드 재사용 차단", (await text(co)).includes("이미 사용된 코드"));
await shot(co, "10-company-benefits", true);

// ---------- 7. 권한 경계 ----------
await cu.goto(`${BASE}/admin`); await settle(cu);
check("고객이 /admin 접근 시 홈으로 되돌려짐", new URL(cu.url()).pathname === "/");
await cu.goto(`${BASE}/company/feedback`); await settle(cu);
check("고객이 /company/* 접근 시 홈으로 되돌려짐", new URL(cu.url()).pathname === "/");
await co.goto(`${BASE}/admin`); await settle(co);
check("기업이 /admin 접근 시 홈으로 되돌려짐", new URL(co.url()).pathname === "/");

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);
