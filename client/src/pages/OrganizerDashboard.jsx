import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Plus, Pencil, Trash2, Users, BarChart3, CheckCircle2, Loader2, Calendar,
  Ticket, TrendingUp, DollarSign, CalendarDays, ImagePlus, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const cats = ['conference', 'workshop', 'seminar', 'hackathon', 'meetup', 'webinar', 'other'];
const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];
const initForm = {
  title: '', description: '', category: 'workshop',
  'venue.name': '', 'venue.city': '', 'venue.isOnline': false,
  startDate: '', endDate: '', capacity: 50, price: 0, tags: '',
  allowTeams: false, maxTeamSize: 5, status: 'draft', coverImage: '',
};

const statusVariant = {
  draft: 'secondary',
  published: 'success',
  cancelled: 'destructive',
  completed: 'default',
  confirmed: 'default',
  attended: 'success',
  waitlisted: 'warning',
};

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [attendees, setAttendees] = useState({ open: false, list: [], title: '' });
  const [analytics, setAnalytics] = useState(null);
  const [form, setForm] = useState(initForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = (field) => (e) => {
    const val = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm(f => ({ ...f, [field]: val }));
  };

  useEffect(() => {
    api.get('/events/my/events')
      .then(r => setEvents(r.data.events))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const reset = () => { setForm(initForm); setEditId(null); setFormOpen(false); };
  const openCreate = () => { setForm(initForm); setEditId(null); setFormOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title, description: form.description, category: form.category,
      venue: { name: form['venue.name'], city: form['venue.city'], isOnline: form['venue.isOnline'] },
      startDate: form.startDate, endDate: form.endDate,
      capacity: +form.capacity, price: +form.price,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      allowTeams: form.allowTeams, maxTeamSize: +form.maxTeamSize, status: form.status,
      coverImage: form.coverImage,
    };
    try {
      if (editId) {
        const r = await api.put(`/events/${editId}`, payload);
        setEvents(events.map(ev => ev._id === editId ? r.data.event : ev));
      } else {
        const r = await api.post('/events', payload);
        setEvents([r.data.event, ...events]);
      }
      reset();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const edit = (ev) => {
    setForm({
      title: ev.title, description: ev.description, category: ev.category,
      'venue.name': ev.venue?.name || '', 'venue.city': ev.venue?.city || '',
      'venue.isOnline': ev.venue?.isOnline || false,
      startDate: ev.startDate?.slice(0, 16), endDate: ev.endDate?.slice(0, 16),
      capacity: ev.capacity, price: ev.price,
      tags: ev.tags?.join(', ') || '',
      allowTeams: ev.allowTeams, maxTeamSize: ev.maxTeamSize, status: ev.status,
      coverImage: ev.coverImage || '',
    });
    setEditId(ev._id);
    setFormOpen(true);
  };

  const del = async (id) => {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await api.delete(`/events/${id}`);
    setEvents(events.filter(e => e._id !== id));
  };

  const openAttendees = async (ev) => {
    const r = await api.get(`/registrations/event/${ev._id}`);
    setAttendees({ open: true, list: r.data.registrations, title: ev.title });
  };

  const openAnalytics = async (ev) => {
    const r = await api.get(`/analytics/event/${ev._id}`);
    setAnalytics({ ...r.data.analytics, eventTitle: ev.title });
  };

  const checkIn = async (regId) => {
    await api.put(`/registrations/${regId}/checkin`);
    setAttendees(p => ({ ...p, list: p.list.map(x => x._id === regId ? { ...x, status: 'attended' } : x) }));
  };

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, coverImage: res.data.url }));
    } catch (err) {
      alert(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Stats
  const stats = [
    { label: 'Total events', value: events.length, icon: CalendarDays },
    { label: 'Published', value: events.filter(e => e.status === 'published').length, icon: TrendingUp },
    { label: 'Total registrations', value: events.reduce((s, e) => s + (e.registeredCount || 0), 0), icon: Ticket },
  ];

  return (
    <div className="container-wide py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Organizer dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome back, {user?.name?.split(' ')[0]}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus />Create event
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events table */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your events</h2>
        <span className="text-sm text-muted-foreground">{events.length} total</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No events yet</h3>
          <p className="text-sm text-muted-foreground mb-5">Create your first event to get started</p>
          <Button onClick={openCreate}><Plus />Create event</Button>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(ev => {
                const pct = ev.capacity > 0 ? Math.min(100, (ev.registeredCount / ev.capacity) * 100) : 0;
                return (
                  <TableRow key={ev._id}>
                    <TableCell>
                      <div className="font-medium">{ev.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{ev.category}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {ev.registeredCount}/{ev.capacity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[ev.status] || 'secondary'} className="capitalize">
                        {ev.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Attendees" onClick={() => openAttendees(ev)}>
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Analytics" onClick={() => openAnalytics(ev)}>
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => edit(ev)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Delete" onClick={() => del(ev._id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Event Dialog */}
      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) reset(); else setFormOpen(true); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit event' : 'Create event'}</DialogTitle>
            <DialogDescription>
              {editId ? 'Update the details for this event' : 'Fill in the details to publish a new event'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" required value={form.title} onChange={update('title')} placeholder="React Conf 2026" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" required rows={3} value={form.description} onChange={update('description')} placeholder="Describe your event..." />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => update('category')(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cats.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => update('status')(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input id="venue" required value={form['venue.name']} onChange={update('venue.name')} placeholder="Grand Hall" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form['venue.city']} onChange={update('venue.city')} placeholder="Bangalore" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start">Start date &amp; time</Label>
                <Input id="start" type="datetime-local" required value={form.startDate} onChange={update('startDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End date &amp; time</Label>
                <Input id="end" type="datetime-local" required value={form.endDate} onChange={update('endDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" type="number" min="1" value={form.capacity} onChange={update('capacity')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input id="price" type="number" min="0" value={form.price} onChange={update('price')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tags">Tags <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
                <Input id="tags" value={form.tags} onChange={update('tags')} placeholder="react, javascript, web" />
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2 md:col-span-2">
                <Label>Cover Image</Label>
                {form.coverImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img
                      src={form.coverImage}
                      alt="Cover preview"
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/50 p-6 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploading ? 'Uploading...' : 'Click to upload cover image'}
                    </span>
                    <span className="text-xs text-muted-foreground">JPEG, PNG, GIF, WebP — max 5 MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              <div className="md:col-span-2 flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form['venue.isOnline']} onCheckedChange={(v) => setForm(f => ({ ...f, 'venue.isOnline': !!v }))} />
                  <span className="text-sm">Online event</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.allowTeams} onCheckedChange={(v) => setForm(f => ({ ...f, allowTeams: !!v }))} />
                  <span className="text-sm">Allow teams</span>
                </label>
              </div>
              {form.allowTeams && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="maxTeamSize">Max team size</Label>
                  <Input id="maxTeamSize" type="number" min="2" max="20" value={form.maxTeamSize} onChange={update('maxTeamSize')} className="max-w-[140px]" />
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={reset}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />}
                {editId ? 'Update event' : 'Create event'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Attendees Dialog */}
      <Dialog open={attendees.open} onOpenChange={(v) => !v && setAttendees({ open: false, list: [], title: '' })}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Attendees — {attendees.title}</DialogTitle>
            <DialogDescription>{attendees.list.length} registration(s)</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No registrations yet
                    </TableCell>
                  </TableRow>
                ) : attendees.list.map(r => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.user?.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.user?.email}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[r.status] || 'secondary'} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'confirmed' && (
                        <Button size="sm" variant="outline" onClick={() => checkIn(r._id)}>
                          <CheckCircle2 />Check in
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={!!analytics} onOpenChange={(v) => !v && setAnalytics(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Analytics — {analytics?.eventTitle}</DialogTitle>
            <DialogDescription>Event performance overview</DialogDescription>
          </DialogHeader>
          {analytics && (
            <div className="grid grid-cols-2 gap-3">
              <AnalyticsStat label="Total" value={analytics.totalRegistrations} icon={Ticket} />
              <AnalyticsStat label="Fill rate" value={`${analytics.fillRate}%`} icon={TrendingUp} />
              <AnalyticsStat label="Checked in" value={analytics.checkedIn} icon={CheckCircle2} />
              <AnalyticsStat label="Revenue" value={`₹${analytics.revenue}`} icon={DollarSign} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalyticsStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
