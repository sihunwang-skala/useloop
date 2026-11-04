import Link from "next/link";
import { btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <Link href="/discover" className={`${btn.primary} mt-6`}>서비스 둘러보기</Link>
    </div>
  );
}
