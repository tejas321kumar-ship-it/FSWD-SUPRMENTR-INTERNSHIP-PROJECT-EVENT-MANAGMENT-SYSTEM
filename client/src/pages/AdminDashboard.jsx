import { useState, useEffect } from 'react';
import api from '../services/api';
import { CalendarDays, Users, Ticket, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

export default function AdminDashboard() {
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/overview')
      .then(r => setOv(r.data.overview))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ov) {
    return (
      <div className="container-wide py-16 text-center">
        <h3 className="text-lg font-semibold">Unable to load data</h3>
        <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total events', value: ov.totalEvents, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'Registrations', value: ov.totalRegistrations, icon: Ticket, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Categories', value: ov.eventsByCategory?.length || 0, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'This month', value: ov.monthlyTrend?.length > 0 ? ov.monthlyTrend[ov.monthlyTrend.length - 1].count : 0, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
  ];

  const maxCat = Math.max(...(ov.eventsByCategory?.map(x => x.count) || [1]));
  const maxTrend = Math.max(...(ov.monthlyTrend?.map(t => t.count) || [1]));

  return (
    <div className="container-wide py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Admin dashboard</h1>
        <p className="mt-1 text-muted-foreground">System-wide overview and analytics</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}>
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

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events by category</CardTitle>
          </CardHeader>
          <CardContent>
            {ov.eventsByCategory?.length > 0 ? (
              <div className="space-y-3">
                {ov.eventsByCategory.map(c => (
                  <div key={c.category} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-muted-foreground capitalize shrink-0">
                      {c.category}
                    </span>
                    <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(c.count / maxCat) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-medium tabular-nums">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly trend</CardTitle>
          </CardHeader>
          <CardContent>
            {ov.monthlyTrend?.length > 0 ? (
              <div className="flex items-end gap-2 h-48">
                {ov.monthlyTrend.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                    <div
                      className="w-full max-w-[40px] bg-primary rounded-t-md transition-all duration-500 hover:bg-primary/80 relative group"
                      style={{ height: `${Math.max(4, (m.count / maxTrend) * 100)}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {m.count}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{m.month.slice(5)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ov.recentEvents?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ov.recentEvents.map(ev => (
                  <TableRow key={ev._id}>
                    <TableCell className="font-medium">{ev.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize font-normal">{ev.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ev.registeredCount}/{ev.capacity}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No recent events</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
