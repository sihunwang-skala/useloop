import Link from "next/link";
import type { Service } from "@/lib/domain/types";
import { Badge } from "./ui";

export function ServiceCard({ service, hasBenefit }: { service: Service; hasBenefit: boolean }) {
  return (
    <Link href={`/services/${service.id}`} className="group flex flex-col rounded-xl border border-line bg-white p-5 transition-colors hover:border-neutral-400">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {service.sponsored && <Badge tone="warn">광고</Badge>}
        {hasBenefit && <Badge tone="brand">체험 혜택</Badge>}
        {service.isDemo && <Badge>데모 예시</Badge>}
      </div>
      <h3 className="font-semibold group-hover:text-brand">{service.name}</h3>
      <p className="mt-1 text-sm text-muted">{service.tagline}</p>
      <p className="mt-3 text-xs text-muted">{service.tags.map((t) => `#${t}`).join(" ")}</p>
    </Link>
  );
}
