import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ENDORSEMENT_TAGS, ENDORSEMENT_TAG_LABELS, awardKarma } from "@/lib/karma";

interface EndorsementDialogProps {
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function EndorsementDialog({
  receiverId,
  receiverName,
  receiverAvatar,
  open,
  onOpenChange,
  onComplete,
}: EndorsementDialogProps) {
  const { user } = useAuth();
  const [existingTags, setExistingTags] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Fetch existing endorsements when dialog opens
  useEffect(() => {
    if (open && user) {
      setFetching(true);
      setSelectedTags(new Set());
      setNote("");

      supabase
        .from("endorsements")
        .select("tag")
        .eq("giver_id", user.id)
        .eq("receiver_id", receiverId)
        .then(({ data }) => {
          setExistingTags(new Set((data || []).map((e) => e.tag)));
          setFetching(false);
        });
    }
  }, [open, user, receiverId]);

  const toggleTag = (tag: string) => {
    if (existingTags.has(tag)) return; // Can't toggle already-given
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user || selectedTags.size === 0) return;
    setLoading(true);

    const newTags = [...selectedTags];

    // Insert endorsements
    const { error } = await supabase.from("endorsements").insert(
      newTags.map((tag) => ({
        giver_id: user.id,
        receiver_id: receiverId,
        tag,
        note: note.trim() || null,
      }))
    );

    if (error) {
      toast({ title: "Error", description: "Could not save endorsements", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Award karma for each endorsement
    for (const tag of newTags) {
      await awardKarma(user.id, "endorsement_given", receiverId);
      await awardKarma(receiverId, "endorsement_received", user.id);
    }

    toast({
      title: "Endorsement sent!",
      description: `You endorsed ${receiverName} for ${newTags.length} skill${newTags.length > 1 ? "s" : ""}`,
    });

    setLoading(false);
    onOpenChange(false);
    onComplete?.();
  };

  const allEndorsed = ENDORSEMENT_TAGS.every((t) => existingTags.has(t));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Endorse {receiverName}</DialogTitle>
          <DialogDescription>
            Recognize their help by endorsing specific skills. This boosts their karma!
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={receiverAvatar || ""} />
            <AvatarFallback>{receiverName?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{receiverName}</span>
        </div>

        {fetching ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : allEndorsed ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            You've already endorsed {receiverName} for all skills!
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {ENDORSEMENT_TAGS.map((tag) => {
                const isExisting = existingTags.has(tag);
                const isSelected = selectedTags.has(tag);

                return (
                  <Badge
                    key={tag}
                    variant={isExisting ? "secondary" : isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      isExisting
                        ? "opacity-60 cursor-default"
                        : isSelected
                        ? "bg-karma text-white border-karma"
                        : "hover:border-karma hover:text-karma"
                    }`}
                    onClick={() => toggleTag(tag)}
                  >
                    {isExisting && <Check className="h-3 w-3 mr-1" />}
                    {ENDORSEMENT_TAG_LABELS[tag] || tag}
                  </Badge>
                );
              })}
            </div>

            <Textarea
              placeholder="Add an optional note (e.g. 'Great local guide in Tokyo!')"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">{note.length}/200</p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!allEndorsed && (
            <Button
              onClick={handleSubmit}
              disabled={loading || selectedTags.size === 0}
              className="bg-karma hover:bg-karma/90 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Endorse (${selectedTags.size})`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
