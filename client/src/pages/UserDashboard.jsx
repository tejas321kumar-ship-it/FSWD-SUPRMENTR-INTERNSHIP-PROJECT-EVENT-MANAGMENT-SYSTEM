import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlineTicket, HiOutlineCalendar, HiOutlineQrcode, HiOutlineDownload } from 'react-icons/hi';

export default function UserDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => { api.get('/registrations/my').then(r => setRegistrations(r.data.registrations)).catch(console.error).finally(() => setLoading(false)); }, []);

  const downloadCert = async (regId) => {
    try {
      const res = await api.get(`/analytics/certificate/${regId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `certificate-${regId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { alert(e.response?.data?.message || 'Certificate not available'); }
  };

  const fmtDate = d => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div><h1>Welcome, {user?.name}</h1><p>Manage your registrations and tickets</p></div>
        <Link to="/events" className="btn btn-primary">Browse Events</Link>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card"><HiOutlineTicket size={24} /><div><span className="stat-value">{registrations.length}</span><span className="stat-label">Registrations</span></div></div>
        <div className="stat-card"><HiOutlineCalendar size={24} /><div><span className="stat-value">{registrations.filter(r=>r.status==='confirmed').length}</span><span className="stat-label">Upcoming</span></div></div>
        <div className="stat-card"><HiOutlineQrcode size={24} /><div><span className="stat-value">{registrations.filter(r=>r.status==='attended').length}</span><span className="stat-label">Attended</span></div></div>
      </div>
      <h2>Your Registrations</h2>
      {loading ? <div className="page-loader">Loading...</div> : registrations.length === 0 ? (
        <div className="empty-state"><h3>No registrations yet</h3><p>Browse events and register to see your tickets here</p><Link to="/events" className="btn btn-primary">Find Events</Link></div>
      ) : (
        <div className="registrations-list">
          {registrations.map(reg => (
            <div key={reg._id} className="registration-card">
              <div className="registration-info">
                <h3>{reg.event?.title || 'Event'}</h3>
                <p className="reg-date"><HiOutlineCalendar /> {reg.event?.startDate ? fmtDate(reg.event.startDate) : 'TBD'}</p>
                <p className="reg-venue">{reg.event?.venue?.name}</p>
                {reg.team && <span className="team-badge">Team: {reg.team.name}</span>}
              </div>
              <div className="registration-ticket">
                <span className={`status-badge ${reg.status}`}>{reg.status}</span>
                <code className="ticket-code">{reg.ticketCode}</code>
                <div className="ticket-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedTicket(selectedTicket===reg._id?null:reg._id)}>
                    <HiOutlineQrcode /> {selectedTicket===reg._id ? 'Hide QR' : 'View QR'}
                  </button>
                  {reg.status === 'attended' && <button className="btn btn-outline btn-sm" onClick={() => downloadCert(reg._id)}><HiOutlineDownload /> Certificate</button>}
                </div>
              </div>
              {selectedTicket === reg._id && reg.qrData && <div className="qr-display"><img src={reg.qrData} alt="QR Code" /><p>Show this at the venue</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
