import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Camera, ChevronsUpDown, Loader2, LogOut, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import KarmaBadge from "@/components/KarmaBadge";
import EndorsementSummary from "@/components/EndorsementSummary";
import KarmaHistory from "@/components/KarmaHistory";
import { awardKarma } from "@/lib/karma";

const LANGUAGES = [
  "English", "Hindi", "Spanish", "French", "German", "Mandarin", "Japanese",
  "Korean", "Portuguese", "Russian", "Arabic", "Italian", "Dutch", "Swedish",
  "Turkish", "Thai", "Vietnamese", "Indonesian", "Malay", "Tamil", "Telugu",
  "Bengali", "Urdu", "Punjabi", "Marathi", "Gujarati", "Kannada", "Malayalam",
  "Polish", "Czech", "Greek", "Hebrew", "Persian", "Swahili", "Filipino"
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    home_city: "",
    languages: [] as string[],
    avatar_url: "",
    karma_score: 0,
  });
  
  const [privacy, setPrivacy] = useState({
    discoverable: true,
    show_email: false,
    show_phone: false,
    show_full_name: true
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    const [profileRes, privacyRes] = await Promise.all([
      supabase.from("profiles").select("display_name, bio, home_city, languages, avatar_url, karma_score").eq("user_id", user.id).single(),
      supabase.from("privacy_settings").select("discoverable, show_email, show_phone, show_full_name").eq("user_id", user.id).single()
    ]);

    if (profileRes.data) {
      setProfile({
        display_name: profileRes.data.display_name || "",
        bio: profileRes.data.bio || "",
        home_city: profileRes.data.home_city || "",
        languages: profileRes.data.languages || [],
        avatar_url: profileRes.data.avatar_url || "",
        karma_score: profileRes.data.karma_score ?? 0,
      });
    }
    
    if (privacyRes.data) {
      setPrivacy(privacyRes.data);
    }
    
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    
    if (uploadError) {
      toast({ title: "Upload failed", variant: "destructive" });
    } else {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
      setProfile(prev => ({ ...prev, avatar_url: url }));
      awardKarma(user.id, "avatar_uploaded");
      toast({ title: "Avatar updated!" });
    }
    setUploading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const [profileRes, privacyRes] = await Promise.all([
        supabase.from("profiles").update({
          display_name: profile.display_name,
          bio: profile.bio,
          home_city: profile.home_city,
          languages: profile.languages
        }).eq("user_id", user.id),
        supabase.from("privacy_settings").update(privacy).eq("user_id", user.id)
      ]);

      if (profileRes.error || privacyRes.error) {
        toast({ title: "Save failed", variant: "destructive" });
      } else {
        toast({ title: "Profile saved!" });
      }
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-4 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <Button variant="ghost" size="icon" onClick={async () => {
            try {
              await signOut();
              navigate("/auth", { replace: true });
            } catch {
              toast({ title: "Logout failed", variant: "destructive" });
            }
          }}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">{profile.display_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <Camera className="h-4 w-4 text-primary-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Karma & Endorsements */}
        <div className="flex justify-center">
          <KarmaBadge score={profile.karma_score} size="md" />
        </div>

        {user && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <EndorsementSummary userId={user.id} />
              <KarmaHistory userId={user.id} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))} />
            </div>
            <div>
              <Label>Home City</Label>
              <Input value={profile.home_city} onChange={e => setProfile(p => ({ ...p, home_city: e.target.value }))} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Languages</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {profile.languages.map(lang => (
                  <Badge key={lang} variant="secondary" className="gap-1 pr-1">
                    {lang}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      onClick={() => setProfile(p => ({ ...p, languages: p.languages.filter(l => l !== lang) }))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal text-muted-foreground">
                    Add languages...
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search languages..." />
                    <CommandList>
                      <CommandEmpty>No language found.</CommandEmpty>
                      <CommandGroup>
                        {LANGUAGES.filter(lang => !profile.languages.includes(lang)).map(lang => (
                          <CommandItem
                            key={lang}
                            onSelect={() => setProfile(p => ({ ...p, languages: [...p.languages, lang] }))}
                          >
                            {lang}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Privacy Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Discoverable</Label>
              <Switch checked={privacy.discoverable} onCheckedChange={v => setPrivacy(p => ({ ...p, discoverable: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Full Name</Label>
              <Switch checked={privacy.show_full_name} onCheckedChange={v => setPrivacy(p => ({ ...p, show_full_name: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Email</Label>
              <Switch checked={privacy.show_email} onCheckedChange={v => setPrivacy(p => ({ ...p, show_email: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Phone</Label>
              <Switch checked={privacy.show_phone} onCheckedChange={v => setPrivacy(p => ({ ...p, show_phone: v }))} />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={saveProfile} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
      <BottomNav />
    </div>
  );
}
