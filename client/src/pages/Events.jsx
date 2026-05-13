import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const categories = ['conference', 'workshop', 'seminar', 'hackathon', 'meetup', 'webinar', 'other'];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await api.get('/events', { params });
      setEvents(res.data.events);
      setPagination(res.data.pagination);
    } catch (err) { console.error('Failed to fetch events', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [category]);

  const handleSearch = (e) => { e.preventDefault(); fetchEvents(1); };
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="container-wide py-10 md:py-14">
      {/* Hero */}
      <div className="soft-gradient -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 md:py-16 rounded-none mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
          Discover Events
        </h1>
        <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
          Find conferences, workshops, and meetups happening near you
        </p>
        <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-2xl items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-12 rounded-xl pl-10 text-base shadow-sm"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 rounded-xl">Search</Button>
        </form>
      </div>

      {/* Category filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={cn(
            'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
            !category ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50'
          )}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              category === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[16/10] w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-20 text-center">
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(ev => (
              <Link to={`/events/${ev._id}`} key={ev._id} className="group">
                <Card className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
                  <div
                    className="relative aspect-[16/10] bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400"
                    style={ev.coverImage ? { backgroundImage: `url(${ev.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  >
                    <div className="absolute inset-x-3 top-3 flex items-start justify-between">
                      <Badge variant="secondary" className="capitalize bg-background/90 backdrop-blur">
                        {ev.category}
                      </Badge>
                      <Badge className={cn('backdrop-blur', ev.price > 0 ? 'bg-foreground/90 text-background' : 'bg-success/90 text-success-foreground')}>
                        {ev.price > 0 ? `₹${ev.price}` : 'Free'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {ev.title}
                    </h3>
                    <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDate(ev.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{ev.venue?.isOnline ? 'Online' : ev.venue?.name}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {ev.registeredCount}/{ev.capacity} registered
                      </span>
                      {ev.isFull && <Badge variant="destructive" className="text-[10px]">Full</Badge>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="mt-10 flex justify-center gap-1">
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchEvents(i + 1)}
                  className={cn(
                    'h-9 min-w-[36px] rounded-lg border text-sm font-medium transition-colors',
                    pagination.page === i + 1
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/50'
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
