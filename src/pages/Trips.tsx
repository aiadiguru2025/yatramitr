import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Plane, Calendar, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

interface Trip {
  id: string;
  origin_city: string;
  dest_city: string;
  travel_date: string;
  return_date: string | null;
  role: "traveller" | "helper";
  is_active: boolean;
  notes: string | null;
}

const emptyTrip: {
  origin_city: string;
  dest_city: string;
  travel_date: string;
  return_date: string;
  role: "traveller" | "helper";
  notes: string;
} = {
  origin_city: "",
  dest_city: "",
  travel_date: "",
  return_date: "",
  role: "traveller",
  notes: ""
};

export default function Trips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTrip);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("travel_date", { ascending: true });
    setTrips(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !form.origin_city || !form.dest_city || !form.travel_date) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    const tripData = {
      origin_city: form.origin_city,
      dest_city: form.dest_city,
      travel_date: form.travel_date,
      return_date: form.return_date || null,
      role: form.role,
      notes: form.notes || null
    };

    const { error } = editingTripId
      ? await supabase.from("trips").update(tripData).eq("id", editingTripId)
      : await supabase.from("trips").insert({ ...tripData, user_id: user.id });

    if (error) {
      toast({ title: editingTripId ? "Failed to update trip" : "Failed to add trip", variant: "destructive" });
    } else {
      toast({ title: editingTripId ? "Trip updated!" : "Trip added!" });
      setForm(emptyTrip);
      setEditingTripId(null);
      setShowForm(false);
      fetchTrips();
    }
    setSaving(false);
  };

  const startEditing = (trip: Trip) => {
    setForm({
      origin_city: trip.origin_city,
      dest_city: trip.dest_city,
      travel_date: trip.travel_date,
      return_date: trip.return_date || "",
      role: trip.role,
      notes: trip.notes || ""
    });
    setEditingTripId(trip.id);
    setShowForm(true);
  };

  const toggleActive = async (trip: Trip) => {
    await supabase.from("trips").update({ is_active: !trip.is_active }).eq("id", trip.id);
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, is_active: !t.is_active } : t));
  };

  const deleteTrip = async (id: string) => {
    await supabase.from("trips").delete().eq("id", id);
    setTrips(prev => prev.filter(t => t.id !== id));
    toast({ title: "Trip deleted" });
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
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">My Trips</h1>
          <Button size="sm" onClick={() => { setForm(emptyTrip); setEditingTripId(null); setShowForm(!showForm); }}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>From City *</Label>
                  <Input value={form.origin_city} onChange={e => setForm(f => ({ ...f, origin_city: e.target.value }))} />
                </div>
                <div>
                  <Label>To City *</Label>
                  <Input value={form.dest_city} onChange={e => setForm(f => ({ ...f, dest_city: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Travel Date *</Label>
                  <Input type="date" value={form.travel_date} onChange={e => setForm(f => ({ ...f, travel_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Return Date</Label>
                  <Input type="date" value={form.return_date} onChange={e => setForm(f => ({ ...f, return_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v: "traveller" | "helper") => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traveller">Traveller</SelectItem>
                    <SelectItem value="helper">Helper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={saving} className="flex-1">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Trip"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {trips.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No trips yet. Add your first trip!</p>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <Card key={trip.id} className={!trip.is_active ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Plane className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{trip.origin_city} → {trip.dest_city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(trip.travel_date), "MMM d, yyyy")}
                        {trip.return_date && ` - ${format(new Date(trip.return_date), "MMM d, yyyy")}`}
                      </div>
                      <Badge variant={trip.role === "traveller" ? "default" : "secondary"}>
                        {trip.role === "traveller" ? "Travelling" : "Offering Help"}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch checked={trip.is_active} onCheckedChange={() => toggleActive(trip)} />
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEditing(trip)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTrip(trip.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
