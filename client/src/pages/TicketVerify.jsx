import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  CheckCircle2, XCircle, Loader2, Calendar, MapPin, User, Ticket, Users, Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusConfig = {
  confirmed: { label: 'Confirmed', color: 'bg-emerald-500', icon: CheckCircle2, variant: 'success' },
  attended: { label: 'Checked in', color: 'bg-blue-500', icon: CheckCircle2, variant: 'default' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: XCircle, variant: 'destructive' },
  waitlisted: { label: 'Waitlisted', color: 'bg-amber-500', icon: Clock, variant: 'warning' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
});

const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', {
  hour: 'numeric', minute: '2-digit', hour12: true,
});

export default function TicketVerify() {
  const { code } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/registrations/verify/${code}`)
      .then(r => setTicket(r.data.ticket))
      .catch(err => setError(err.response?.data?.message || 'Unable to verify ticket'))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <XCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Invalid ticket</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || 'This ticket could not be found or has expired.'}
          </p>
          <Button asChild variant="outline">
            <Link to="/">Go to EventHub</Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[ticket.status] || statusConfig.confirmed;
  const StatusIcon = status.icon;
  const ev = ticket.event;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-8 px-4 md:py-12">
      <div className="mx-auto max-w-lg">
        {/* Brand header */}
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block text-xl font-bold tracking-tight">
            Event<span className="text-primary">Hub</span>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Digital ticket</p>
        </div>

        {/* Ticket card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          {/* Status stripe */}
          <div className={`${status.color} h-1.5 w-full`} />

          {/* Event hero */}
          {ev?.coverImage ? (
            <div className="relative h-40 overflow-hidden">
              <img src={ev.coverImage} alt={ev.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <Badge variant="secondary" className="mb-2 capitalize bg-white/20 backdrop-blur text-white border-white/30">
                  {ev.category}
                </Badge>
                <h1 className="text-xl font-bold leading-tight">{ev.title}</h1>
              </div>
            </div>
          ) : (
            <div className="relative h-40 bg-gradient-to-br from-primary via-primary to-primary/70 p-5 flex flex-col justify-end text-primary-foreground">
              <Badge variant="secondary" className="self-start mb-2 capitalize bg-white/20 backdrop-blur text-white border-white/30">
                {ev?.category}
              </Badge>
              <h1 className="text-xl font-bold leading-tight">{ev?.title}</h1>
            </div>
          )}

          {/* Status banner */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-2.5 bg-muted/30">
            <StatusIcon className={`h-5 w-5 ${ticket.status === 'attended' ? 'text-blue-600' : ticket.status === 'cancelled' ? 'text-red-600' : 'text-emerald-600'}`} />
            <span className="font-semibold text-sm">{status.label}</span>
            {ticket.checkedInAt && (
              <span className="ml-auto text-xs text-muted-foreground">
                {fmtDate(ticket.checkedInAt)}
              </span>
            )}
          </div>

          {/* Ticket details */}
          <div className="p-5 space-y-4">
            <DetailRow icon={User} label="Attendee" value={ticket.attendee?.name} />

            {ticket.team && (
              <DetailRow icon={Users} label="Team" value={ticket.team.name} />
            )}

            {ev?.startDate && (
              <DetailRow
                icon={Calendar}
                label="Date & time"
                value={fmtDate(ev.startDate)}
                sub={`${fmtTime(ev.startDate)}${ev.endDate ? ` – ${fmtTime(ev.endDate)}` : ''}`}
              />
            )}

            {ev?.venue?.name && (
              <DetailRow
                icon={MapPin}
                label="Venue"
                value={ev.venue.name}
                sub={ev.venue.city || (ev.venue.isOnline ? 'Online' : null)}
              />
            )}
          </div>

          {/* Perforated edge */}
          <div className="relative h-6 mx-5">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-border" />
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border border-border" />
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border border-border" />
          </div>

          {/* Ticket code */}
          <div className="px-5 pb-6 pt-2">
            <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                <Ticket className="h-3.5 w-3.5" />
                Ticket code
              </div>
              <code className="font-mono text-base font-semibold tracking-wide break-all">
                {ticket.ticketCode}
              </code>
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Show this screen at the venue for entry
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Verified by EventHub • {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="font-medium text-sm mt-0.5 truncate">{value || '—'}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
