import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { KARMA_REASON_LABELS, type KarmaReason } from "@/lib/karma";

interface KarmaHistoryProps {
  userId: string;
}

interface KarmaEntry {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export default function KarmaHistory({ userId }: KarmaHistoryProps) {
  const [entries, setEntries] = useState<KarmaEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("karma_log")
      .select("id, delta, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setEntries((data || []) as KarmaEntry[]);
        setLoading(false);
      });
  }, [userId]);

  if (loading || entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        Karma History
      </button>

      {open && (
        <div className="space-y-1.5 pl-1">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 text-xs">
              {entry.delta > 0 ? (
                <TrendingUp className="h-3 w-3 text-karma shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive shrink-0" />
              )}
              <span className={`font-semibold ${entry.delta > 0 ? "text-karma" : "text-destructive"}`}>
                {entry.delta > 0 ? "+" : ""}{entry.delta}
              </span>
              <span className="text-muted-foreground truncate">
                {KARMA_REASON_LABELS[entry.reason as KarmaReason] || entry.reason}
              </span>
              <span className="text-muted-foreground/60 ml-auto shrink-0">
                {new Date(entry.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
