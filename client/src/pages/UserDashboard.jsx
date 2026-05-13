import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Ticket, Calendar, QrCode, Download, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const statusVariant = {
  confirmed: 'default',
  attended: 'success',
  cancelled: 'destructive',
  waitlisted: 'warning',
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    api.get('/registrations/my')
      .then(r => setRegistrations(r.data.registrations))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const downloadCert = async (regId) => {
    try {
      const res = await api.get(`/analytics/certificate/${regId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `certificate-${regId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Certificate not available');
    }
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const stats = [
    { label: 'Total registrations', value: registrations.length, icon: Ticket },
    { label: 'Upcoming', value: registrations.filter(r => r.status === 'confirmed').length, icon: Calendar },
    { label: 'Attended', value: registrations.filter(r => r.status === 'attended').length, icon: QrCode },
  ];

  return (
    <div className="container-wide py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">Manage your registrations and tickets</p>
        </div>
        <Button asChild>
          <Link to="/events">Browse events</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
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

      {/* Registrations */}
      <h2 className="text-xl font-semibold mb-4">Your registrations</h2>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No registrations yet</h3>
          <p className="text-sm text-muted-foreground mb-5">Browse events and register to see your tickets here</p>
          <Button asChild>
            <Link to="/events">Find events</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map(reg => (
            <Card key={reg._id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-base truncate">
                        {reg.event?.title || 'Event'}
                      </h3>
                      <Badge variant={statusVariant[reg.status] || 'secondary'} className="capitalize">
                        {reg.status}
                      </Badge>
                      {reg.team && (
                        <Badge variant="outline" className="font-normal">
                          Team: {reg.team.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {reg.event?.startDate ? fmtDate(reg.event.startDate) : 'TBD'}
                      </span>
                      {reg.event?.venue?.name && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {reg.event.venue.name}
                        </span>
                      )}
                    </div>
                    <code className="mt-2 inline-block rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {reg.ticketCode}
                    </code>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(selectedTicket === reg._id ? null : reg._id)}
                    >
                      <QrCode />
                      {selectedTicket === reg._id ? 'Hide QR' : 'View QR'}
                    </Button>
                    {reg.status === 'attended' && (
                      <Button variant="outline" size="sm" onClick={() => downloadCert(reg._id)}>
                        <Download />Certificate
                      </Button>
                    )}
                  </div>
                </div>

                {selectedTicket === reg._id && reg.qrData && (
                  <div className="mt-5 rounded-lg border border-border bg-muted/50 p-6 text-center animate-fade-in">
                    <img src={reg.qrData} alt="QR Code" className="mx-auto max-w-[200px] rounded-lg" />
                    <p className="mt-3 text-xs text-muted-foreground">Show this at the venue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
