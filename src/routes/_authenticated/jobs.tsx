import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Briefcase, MapPin, Search, Users } from "lucide-react";
import { toast } from "sonner";

type Job = {
  id: string;
  farmer_id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  pay_rate: number;
  pay_unit: string;
  start_date: string | null;
  end_date: string | null;
  workers_needed: number;
  status: string;
  created_at: string;
};

type Application = {
  id: string;
  job_id: string;
  applicant_id: string;
  farmer_id: string;
  cover_note: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
};

const JOB_CATEGORIES = ["Planting", "Harvesting", "Weeding", "Livestock", "Irrigation", "Transport", "Other"];

export const Route = createFileRoute("/_authenticated/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApps, setMyApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);
  const [reviewJob, setReviewJob] = useState<Job | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [j, a] = await Promise.all([
      supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("job_applications").select("*").eq("applicant_id", user.id),
    ]);
    setJobs((j.data as Job[]) ?? []);
    setMyApps((a.data as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const browse = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (j.status !== "open") return false;
      if (needle && !`${j.title} ${j.category} ${j.location ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [jobs, q]);

  const mine = useMemo(() => jobs.filter((j) => j.farmer_id === user?.id), [jobs, user?.id]);
  const appliedJobIds = useMemo(() => new Set(myApps.map((a) => a.job_id)), [myApps]);

  const closeJob = async (id: string, status: string) => {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Jobs Board</h1>
            <p className="text-sm text-muted-foreground">Find farm work or hire workers.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2"><Plus className="h-5 w-5" /> Post job</Button>
            </DialogTrigger>
            <NewJobDialog onClose={() => setOpen(false)} onCreated={load} userId={user!.id} />
          </Dialog>
        </div>

        <div className="mb-4 flex gap-2">
          <Button variant={tab === "browse" ? "default" : "outline"} onClick={() => setTab("browse")}>Browse</Button>
          <Button variant={tab === "mine" ? "default" : "outline"} onClick={() => setTab("mine")}>My posts</Button>
        </div>

        {tab === "browse" && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs" className="pl-9" />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : tab === "browse" ? (
          browse.length === 0 ? (
            <Card className="p-12 text-center text-muted-foreground">No open jobs match.</Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {browse.map((j) => (
                <Card key={j.id} className="p-4 cursor-pointer hover:shadow-lg transition space-y-1" onClick={() => setSelected(j)}>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" /> {j.category}
                    {appliedJobIds.has(j.id) && <Badge variant="secondary" className="ml-1">Applied</Badge>}
                  </div>
                  <h3 className="font-semibold">{j.title}</h3>
                  <p className="text-lg font-bold text-primary">
                    R{Number(j.pay_rate).toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/{j.pay_unit}</span>
                  </p>
                  {j.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{j.location}</p>}
                  <p className="text-xs text-muted-foreground"><Users className="inline h-3 w-3" /> {j.workers_needed} worker{j.workers_needed > 1 ? "s" : ""} needed</p>
                </Card>
              ))}
            </div>
          )
        ) : mine.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">You haven't posted any jobs yet.</Card>
        ) : (
          <div className="space-y-3">
            {mine.map((j) => (
              <Card key={j.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{j.title}</h3>
                    <p className="text-xs text-muted-foreground">{j.category} · R{Number(j.pay_rate).toFixed(2)}/{j.pay_unit}</p>
                  </div>
                  <Badge variant={j.status === "open" ? "default" : "secondary"}>{j.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setReviewJob(j)}>Review applicants</Button>
                  {j.status === "open" ? (
                    <Button size="sm" variant="ghost" onClick={() => closeJob(j.id, "closed")}>Close</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => closeJob(j.id, "open")}>Re-open</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {selected && user && (
        <ApplyDialog
          job={selected}
          applicantId={user.id}
          alreadyApplied={appliedJobIds.has(selected.id)}
          onClose={() => setSelected(null)}
          onApplied={load}
        />
      )}
      {reviewJob && <ApplicantsDialog job={reviewJob} onClose={() => setReviewJob(null)} />}
    </div>
  );
}

function NewJobDialog({ onClose, onCreated, userId }: { onClose: () => void; onCreated: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(JOB_CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [payRate, setPayRate] = useState("");
  const [payUnit, setPayUnit] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workers, setWorkers] = useState("1");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || !payRate) return toast.error("Title and pay rate are required");
    setSaving(true);
    const { error } = await supabase.from("jobs").insert({
      farmer_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      category,
      location: location.trim() || null,
      pay_rate: Number(payRate),
      pay_unit: payUnit,
      start_date: startDate || null,
      end_date: endDate || null,
      workers_needed: Math.max(1, Number(workers) || 1),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Job posted");
    onCreated();
    onClose();
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Post a job</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tomato harvest crew needed" maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{JOB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Workers needed</Label>
            <Input type="number" min="1" value={workers} onChange={(e) => setWorkers(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Pay rate (R)</Label>
            <Input type="number" min="0" step="0.01" value={payRate} onChange={(e) => setPayRate(e.target.value)} />
          </div>
          <div>
            <Label>Per</Label>
            <Select value={payUnit} onValueChange={setPayUnit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">hour</SelectItem>
                <SelectItem value="day">day</SelectItem>
                <SelectItem value="job">job</SelectItem>
                <SelectItem value="week">week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pretoria, GP" maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? "Posting…" : "Publish"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ApplyDialog({ job, applicantId, alreadyApplied, onClose, onApplied }: {
  job: Job; applicantId: string; alreadyApplied: boolean; onClose: () => void; onApplied: () => void;
}) {
  const [coverNote, setCoverNote] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const isOwn = job.farmer_id === applicantId;

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("job_applications").insert({
      job_id: job.id,
      applicant_id: applicantId,
      farmer_id: job.farmer_id,
      cover_note: coverNote.trim() || null,
      contact_phone: phone.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error("Could not apply", { description: error.message });
    toast.success("Application sent");
    onApplied();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{job.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm"><span className="font-bold text-primary">R{Number(job.pay_rate).toFixed(2)}</span>/{job.pay_unit} · {job.category}</p>
          {job.location && <p className="text-xs text-muted-foreground">📍 {job.location}</p>}
          {(job.start_date || job.end_date) && (
            <p className="text-xs text-muted-foreground">{job.start_date}{job.end_date ? ` → ${job.end_date}` : ""}</p>
          )}
          {job.description && <p className="text-sm text-muted-foreground">{job.description}</p>}
          {!isOwn && !alreadyApplied && (
            <>
              <div>
                <Label>Cover note</Label>
                <Textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={3} maxLength={500} placeholder="Why you're a great fit" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" maxLength={20} />
              </div>
            </>
          )}
          {alreadyApplied && <p className="text-sm text-muted-foreground">You've already applied to this job.</p>}
          {isOwn && <p className="text-sm text-muted-foreground">This is your own job posting.</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          {!isOwn && !alreadyApplied && (
            <Button onClick={submit} disabled={saving}>{saving ? "Sending…" : "Apply now"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApplicantsDialog({ job, onClose }: { job: Job; onClose: () => void }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("job_applications").select("*").eq("job_id", job.id).order("created_at", { ascending: false });
    setApps((data as Application[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [job.id]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("job_applications").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Applicants — {job.title}</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : apps.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <div className="space-y-2">
            {apps.map((a) => (
              <Card key={a.id} className="p-3 space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-mono text-muted-foreground">{a.applicant_id.slice(0, 8)}</p>
                  <Badge variant={a.status === "accepted" ? "default" : a.status === "rejected" ? "secondary" : "outline"}>{a.status}</Badge>
                </div>
                {a.contact_phone && <p className="text-xs">📞 {a.contact_phone}</p>}
                {a.cover_note && <p className="text-sm text-muted-foreground">{a.cover_note}</p>}
                {a.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => setStatus(a.id, "accepted")}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "rejected")}>Reject</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
        <DialogFooter><Button variant="ghost" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
