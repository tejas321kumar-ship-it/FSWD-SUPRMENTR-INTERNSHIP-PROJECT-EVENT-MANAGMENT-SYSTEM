import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { HiOutlineSearch, HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineUsers } from 'react-icons/hi';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [pagination, setPagination] = useState({ page:1, pages:1, total:0 });
  const categories = ['conference','workshop','seminar','hackathon','meetup','webinar','other'];

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
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });

  return (
    <div className="events-page">
      <div className="events-hero">
        <h1>Discover Events</h1>
        <p>Find conferences, workshops, and meetups near you</p>
        <form className="search-bar" onSubmit={handleSearch}>
          <HiOutlineSearch size={20} />
          <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>
      <div className="events-filters">
        <button className={`filter-chip ${!category?'active':''}`} onClick={() => setCategory('')}>All</button>
        {categories.map(c => <button key={c} className={`filter-chip ${category===c?'active':''}`} onClick={() => setCategory(c)}>{c.charAt(0).toUpperCase()+c.slice(1)}</button>)}
      </div>
      {loading ? (
        <div className="loader-grid">{[...Array(6)].map((_,i) => <div key={i} className="skeleton-card" />)}</div>
      ) : events.length === 0 ? (
        <div className="empty-state"><h3>No events found</h3><p>Try adjusting your search or filters</p></div>
      ) : (
        <>
          <div className="events-grid">
            {events.map(ev => (
              <Link to={`/events/${ev._id}`} key={ev._id} className="event-card">
                <div className="event-card-image" style={{backgroundImage: ev.coverImage ? `url(${ev.coverImage})` : 'linear-gradient(135deg, #667eea, #764ba2)'}}>
                  <span className="event-category">{ev.category}</span>
                  <span className={`event-price ${ev.price === 0 ? 'free' : ''}`}>{ev.price > 0 ? `₹${ev.price}` : 'Free'}</span>
                </div>
                <div className="event-card-body">
                  <h3>{ev.title}</h3>
                  <div className="event-meta">
                    <span><HiOutlineCalendar /> {formatDate(ev.startDate)}</span>
                    <span><HiOutlineLocationMarker /> {ev.venue?.name}</span>
                  </div>
                  <div className="event-footer">
                    <span className="event-spots"><HiOutlineUsers /> {ev.registeredCount}/{ev.capacity}</span>
                    {ev.isFull && <span className="badge-full">Full</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {pagination.pages > 1 && (
            <div className="pagination">
              {[...Array(pagination.pages)].map((_,i) => <button key={i} className={`page-btn ${pagination.page===i+1?'active':''}`} onClick={() => fetchEvents(i+1)}>{i+1}</button>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
