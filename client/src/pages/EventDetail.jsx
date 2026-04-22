import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers, HiOutlineTicket, HiOutlineClock } from 'react-icons/hi';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState({ type:'', text:'' });

  useEffect(() => {
    api.get(`/events/${id}`).then(r => setEvent(r.data.event)).catch(() => navigate('/events')).finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async () => {
    if (!user) return navigate('/login');
    setRegistering(true); setMessage({type:'',text:''});
    try {
      await api.post(`/registrations/${id}`);
      setMessage({type:'success',text:'Registered! Check your dashboard for your ticket.'});
      setEvent(p => ({...p, registeredCount: p.registeredCount + 1}));
    } catch (e) { setMessage({type:'error',text:e.response?.data?.message||'Registration failed'}); }
    finally { setRegistering(false); }
  };

  const handleTeamCreate = async (e) => {
    e.preventDefault(); if (!user) return navigate('/login');
    setRegistering(true);
    try {
      const res = await api.post(`/registrations/${id}/team`, { teamName });
      setMessage({type:'success',text:`Team created! Invite code: ${res.data.team.inviteCode}`});
      setShowTeamForm(false); setEvent(p => ({...p, registeredCount: p.registeredCount + 1}));
    } catch (err) { setMessage({type:'error',text:err.response?.data?.message||'Failed'}); }
    finally { setRegistering(false); }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault(); if (!user) return navigate('/login');
    setRegistering(true);
    try {
      await api.post(`/registrations/team/join/${joinCode}`);
      setMessage({type:'success',text:'Joined team! Check your dashboard.'});
    } catch (err) { setMessage({type:'error',text:err.response?.data?.message||'Failed'}); }
    finally { setRegistering(false); }
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const fmtTime = d => new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

  if (loading) return <div className="page-loader">Loading event...</div>;
  if (!event) return null;

  return (
    <div className="event-detail">
      <div className="event-detail-hero" style={{backgroundImage: event.coverImage ? `url(${event.coverImage})` : 'linear-gradient(135deg, #667eea, #764ba2)'}}>
        <div className="event-detail-overlay">
          <span className="event-category">{event.category}</span>
          <h1>{event.title}</h1>
          <div className="event-detail-meta">
            <span><HiOutlineCalendar /> {fmtDate(event.startDate)}</span>
            <span><HiOutlineClock /> {fmtTime(event.startDate)} - {fmtTime(event.endDate)}</span>
            <span><HiOutlineLocationMarker /> {event.venue?.isOnline ? 'Online' : event.venue?.name}</span>
          </div>
        </div>
      </div>
      <div className="event-detail-content">
        <div className="event-detail-main">
          <section><h2>About this event</h2><p className="event-description">{event.description}</p></section>
          {event.tags?.length > 0 && <div className="event-tags">{event.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
          <section><h2>Organizer</h2>
            <div className="organizer-info">
              <div className="organizer-avatar">{event.organizer?.name?.charAt(0)}</div>
              <div><strong>{event.organizer?.name}</strong><p>{event.organizer?.email}</p></div>
            </div>
          </section>
        </div>
        <aside className="event-detail-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-price">{event.price > 0 ? `₹${event.price}` : 'Free'}</div>
            <div className="sidebar-stats">
              <div><HiOutlineUsers size={18} /> <span>{event.registeredCount}/{event.capacity} registered</span></div>
              <div className="capacity-bar"><div className="capacity-fill" style={{width:`${Math.min(100,(event.registeredCount/event.capacity)*100)}%`}} /></div>
            </div>
            {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
            {event.status === 'published' && !event.isFull && (
              <>
                <button className="btn btn-primary btn-full" onClick={handleRegister} disabled={registering}>
                  <HiOutlineTicket size={18} /> {registering ? 'Registering...' : 'Register Now'}
                </button>
                {event.allowTeams && (
                  <div className="team-section">
                    <button className="btn btn-outline btn-full" onClick={() => setShowTeamForm(!showTeamForm)}>Create a Team</button>
                    {showTeamForm && <form onSubmit={handleTeamCreate} className="team-form"><input placeholder="Team name" value={teamName} onChange={e=>setTeamName(e.target.value)} required /><button type="submit" className="btn btn-primary btn-sm" disabled={registering}>Create</button></form>}
                    <form onSubmit={handleJoinTeam} className="team-form"><input placeholder="Invite code" value={joinCode} onChange={e=>setJoinCode(e.target.value)} required /><button type="submit" className="btn btn-outline btn-sm" disabled={registering}>Join</button></form>
                  </div>
                )}
              </>
            )}
            {event.isFull && <div className="badge-full large">Event is Full</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
