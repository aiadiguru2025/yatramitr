import type { PresenceStatus } from "@/hooks/usePresence";

const statusColors: Record<PresenceStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  offline: "bg-gray-400",
};

const statusLabels: Record<PresenceStatus, string> = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

interface PresenceDotProps {
  status: PresenceStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function PresenceDot({ status, size = "sm", showLabel = false }: PresenceDotProps) {
  const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={`${dotSize} rounded-full ${statusColors[status]} ${status === "online" ? "animate-pulse" : ""}`}
        title={statusLabels[status]}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
      )}
    </span>
  );
}
