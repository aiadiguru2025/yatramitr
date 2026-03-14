import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ENDORSEMENT_TAG_LABELS } from "@/lib/karma";

interface EndorsementSummaryProps {
  userId: string;
}

export default function EndorsementSummary({ userId }: EndorsementSummaryProps) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("endorsements")
      .select("tag")
      .eq("receiver_id", userId)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data || []).forEach((e) => {
          map[e.tag] = (map[e.tag] || 0) + 1;
        });
        setCounts(map);
        setLoading(false);
      });
  }, [userId]);

  const tags = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (loading || tags.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Endorsements</h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(([tag, count]) => (
          <Badge
            key={tag}
            variant="outline"
            className="bg-karma/10 text-karma border-karma/30 text-xs"
          >
            {ENDORSEMENT_TAG_LABELS[tag] || tag}
            <span className="ml-1 bg-karma/20 px-1 rounded text-[10px]">{count}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
