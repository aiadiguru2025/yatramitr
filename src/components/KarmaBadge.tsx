import { Sprout, Footprints, HeartHandshake, Users, Star } from "lucide-react";
import { getKarmaTier, type KarmaTier } from "@/lib/karma";

const TIER_ICONS: Record<KarmaTier["icon"], React.ElementType> = {
  seedling: Sprout,
  footprints: Footprints,
  "heart-handshake": HeartHandshake,
  users: Users,
  star: Star,
};

interface KarmaBadgeProps {
  score: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function KarmaBadge({ score, size = "sm", showLabel = true }: KarmaBadgeProps) {
  const tier = getKarmaTier(score);
  const Icon = TIER_ICONS[tier.icon];

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 bg-karma/10 text-karma px-2 py-0.5 rounded-full text-xs font-semibold">
        <Icon className="h-3 w-3" />
        {score}
        {showLabel && <span className="hidden sm:inline">· {tier.name}</span>}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-karma/10 text-karma px-3 py-1.5 rounded-full text-sm font-semibold">
      <Icon className="h-4 w-4" />
      <span>{score} karma</span>
      <span className="text-karma/70">· {tier.name}</span>
    </div>
  );
}
