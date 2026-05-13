import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, MapPin, Users, Ticket, Clock, Loader2, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    api.get(`/events/${id}`)
      .then(r => setEvent(r.data.event))
      .catch(() => navigate('/events'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!user) return navigate('/login');
    setRegistering(true); setMessage({ type: '', text: '' });
    try {
      await api.post(`/registrations/${id}`);
      setMessage({ type: 'success', text: 'Registered! Check your dashboard for your ticket.' });
      setEvent(p => ({ ...p, registeredCount: p.registeredCount + 1 }));
    } catch (e) { setMessage({ type: 'error', text: e.response?.data?.message || 'Registration failed' }); }
    finally { setRegistering(false); }
  };

  const handleTeamCreate = async (e) => {
    e.preventDefault(); if (!user) return navigate('/login');
    setRegistering(true);
    try {
      const res = await api.post(`/registrations/${id}/team`, { teamName });
      setMessage({ type: 'success', text: `Team created! Invite code: ${res.data.team.inviteCode}` });
      setTeamDialogOpen(false); setTeamName('');
      setEvent(p => ({ ...p, registeredCount: p.registeredCount + 1 }));
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    finally { setRegistering(false); }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault(); if (!user) return navigate('/login');
    setRegistering(true);
    try {
      await api.post(`/registrations/team/join/${joinCode}`);
      setMessage({ type: 'success', text: 'Joined team! Check your dashboard.' });
      setTeamDialogOpen(false); setJoinCode('');
    } catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
    finally { setRegistering(false); }
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const fmtTime = d => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="container-wide py-10">
        <Skeleton className="aspect-[21/9] w-full rounded-2xl mb-8" />
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }
  if (!event) return null;

  const fillPct = event.capacity > 0 ? Math.min(100, (event.registeredCount / event.capacity) * 100) : 0;
  const organizerInitials = (event.organizer?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="container-wide py-8 md:py-12">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl aspect-[21/9] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-8"
        style={event.coverImage ? { backgroundImage: `url(${event.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white">
          <Badge variant="secondary" className="bg-white/90 text-foreground capitalize mb-3">
            {event.category}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-white/90">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{fmtDate(event.startDate)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{fmtTime(event.startDate)} — {fmtTime(event.endDate)}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue?.isOnline ? 'Online' : event.venue?.name}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">About this event</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </section>

          {event.tags?.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map(t => (
                  <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
                ))}
              </div>
            </section>
          )}

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Organizer</h2>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {organizerInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{event.organizer?.name}</p>
                <p className="text-sm text-muted-foreground">{event.organizer?.email}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="mb-5">
                <div className="text-3xl font-bold">
                  {event.price > 0 ? `₹${event.price}` : 'Free'}
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {event.registeredCount} / {event.capacity} registered
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {Math.round(fillPct)}% full
                  </span>
                </div>
                <Progress value={fillPct} className="h-2" />
              </div>

              {message.text && (
                <Alert variant={message.type === 'success' ? 'success' : 'destructive'} className="mb-4">
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              {event.status === 'published' && !event.isFull ? (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleRegister}
                    disabled={registering}
                  >
                    {registering ? <Loader2 className="animate-spin" /> : <Ticket />}
                    {registering ? 'Registering...' : 'Register now'}
                  </Button>

                  {event.allowTeams && (
                    <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full" size="lg">
                          <Users />Team options
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Team registration</DialogTitle>
                          <DialogDescription>
                            Create a new team or join an existing one using an invite code.
                          </DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="create" className="mt-2">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="create"><UserPlus className="h-3.5 w-3.5 mr-1.5" />Create</TabsTrigger>
                            <TabsTrigger value="join"><LogIn className="h-3.5 w-3.5 mr-1.5" />Join</TabsTrigger>
                          </TabsList>
                          <TabsContent value="create">
                            <form onSubmit={handleTeamCreate} className="space-y-4 pt-2">
                              <div className="space-y-2">
                                <Label htmlFor="teamName">Team name</Label>
                                <Input
                                  id="teamName"
                                  placeholder="The Code Wizards"
                                  value={teamName}
                                  onChange={e => setTeamName(e.target.value)}
                                  required
                                />
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={registering}>
                                  {registering && <Loader2 className="animate-spin" />}
                                  Create team
                                </Button>
                              </DialogFooter>
                            </form>
                          </TabsContent>
                          <TabsContent value="join">
                            <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
                              <div className="space-y-2">
                                <Label htmlFor="joinCode">Invite code</Label>
                                <Input
                                  id="joinCode"
                                  placeholder="ABC12345"
                                  value={joinCode}
                                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                  required
                                />
                              </div>
                              <DialogFooter>
                                <Button type="submit" disabled={registering}>
                                  {registering && <Loader2 className="animate-spin" />}
                                  Join team
                                </Button>
                              </DialogFooter>
                            </form>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              ) : event.isFull ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm font-medium text-destructive">
                  Event is full
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                  Registration is closed
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
