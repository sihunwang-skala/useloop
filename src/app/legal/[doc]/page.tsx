import { notFound } from "next/navigation";
import { Notice } from "@/components/ui";

const docs: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "개인정보처리방침 (샘플)",
    body: [
      "수집 항목: 이메일, 표시 이름, (선택) 관심 카테고리, 작성한 비공개 피드백, 혜택 수령 이력.",
      "이용 목적: 계정 관리, 비공개 피드백 전달, 혜택 발급·사용 관리, 서비스 추천(관심 카테고리 기반).",
      "제3자 제공: 고객의 이름·이메일 등 개인정보는 다른 기업에 제공하지 않습니다. 기업에는 익명 식별자와 피드백 내용만 전달됩니다.",
      "보유 기간 및 삭제: 계정 설정에서 삭제를 요청할 수 있으며, 운영자가 확인 후 처리합니다.",
      "※ 이 문서는 개발용 샘플이며 법적 효력이 없습니다. 출시 전 LEGAL_REVIEW.md 의 항목을 법률 전문가와 검토해야 합니다.",
    ],
  },
  terms: {
    title: "이용약관 (샘플)",
    body: [
      "UseLoop 는 고객 피드백 전달과 서비스 발견을 돕는 플랫폼이며, 기본 기능은 무료입니다.",
      "이용자는 실제 사용 경험에 근거해 피드백을 작성해야 하며, 허위·대리 작성·AI 생성 가짜 후기를 올릴 수 없습니다.",
      "기업은 발급 권한이 있는 혜택만 등록할 수 있으며, 긍정적 평가나 리뷰 수정·삭제를 조건으로 혜택을 제공할 수 없습니다.",
      "※ 이 문서는 개발용 샘플이며 법적 효력이 없습니다.",
    ],
  },
  policy: {
    title: "피드백·혜택 운영 원칙",
    body: [
      "모든 피드백은 긍정·부정과 관계없이 동일한 정책으로 취급합니다.",
      "혜택은 긍정적 평가, 높은 평점, 공개 리뷰, 앱스토어 평점·설치 수와 연결되지 않습니다.",
      "혜택 조건·유효기간·수량·사용 방법은 받기 전에 모두 공개됩니다.",
      "관리자가 승인한 혜택만 발급되며, 코드 중복 사용과 수량 초과는 시스템이 차단합니다.",
      "현재는 '사용자 직접 등록' 정보이며, 실제 사용자 인증(Verified)은 제공하지 않습니다.",
      "광고(스폰서)는 '광고' 라벨로 표시하고 일반 추천과 구분합니다. 제휴하지 않은 기업을 공식 제휴사로 표시하지 않습니다.",
    ],
  },
};

export default async function Legal({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = docs[doc];
  if (!d) notFound();
  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">{d.title}</h1>
      {doc !== "policy" && <Notice tone="warn">샘플 문구입니다. 실제 서비스 출시 전 법률 검토가 필요합니다.</Notice>}
      <ul className="list-disc space-y-2 pl-5">{d.body.map((l) => <li key={l}>{l}</li>)}</ul>
    </article>
  );
}
