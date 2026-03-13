import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type PresenceStatus = "online" | "away" | "offline";

interface PresenceState {
  user_id: string;
  status: PresenceStatus;
  last_seen: string;
}

/**
 * Tracks online/away presence for the current user and their connections.
 * - "online" when the tab is visible and user is authenticated
 * - "away" when the tab is hidden
 * - "offline" when a tracked user has no presence
 */
export function usePresence(trackedUserIds: string[] = []) {
  const { user } = useAuth();
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceStatus>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("presence:global", {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    const syncPresence = () => {
      const state = channel.presenceState<PresenceState>();
      const map: Record<string, PresenceStatus> = {};

      for (const key of Object.keys(state)) {
        const entries = state[key] as unknown as PresenceState[];
        if (entries && entries.length > 0) {
          // Use the most recent status if multiple tabs
          const latest = entries[entries.length - 1];
          map[key] = latest.status;
        }
      }

      setPresenceMap(map);
    };

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            status: document.visibilityState === "visible" ? "online" : "away",
            last_seen: new Date().toISOString(),
          } as PresenceState);
        }
      });

    // Update status on visibility change
    const handleVisibility = async () => {
      const newStatus: PresenceStatus =
        document.visibilityState === "visible" ? "online" : "away";
      await channel.track({
        user_id: user.id,
        status: newStatus,
        last_seen: new Date().toISOString(),
      } as PresenceState);
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user?.id]);

  const getStatus = (userId: string): PresenceStatus => {
    return presenceMap[userId] || "offline";
  };

  return { presenceMap, getStatus };
}
