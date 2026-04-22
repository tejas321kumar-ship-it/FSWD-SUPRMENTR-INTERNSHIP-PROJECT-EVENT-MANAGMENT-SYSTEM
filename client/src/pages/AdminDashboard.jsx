import { useState, useEffect } from 'react';
import api from '../services/api';
import { HiOutlineCalendar, HiOutlineUsers, HiOutlineTicket, HiOutlineTrendingUp } from 'react-icons/hi';

export default function AdminDashboard() {
  const [ov, setOv] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{api.get('/analytics/overview').then(r=>setOv(r.data.overview)).finally(()=>setLoading(false))},[]);

  if (loading) return <div className="page-loader">Loading...</div>;
  if (!ov) return <div className="empty-state"><h3>Unable to load</h3></div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header"><div><h1>Admin Dashboard</h1><p>System overview</p></div></div>
      <div className="dashboard-stats four-col">
        <div className="stat-card accent-blue"><HiOutlineCalendar size={28}/><div><span className="stat-value">{ov.totalEvents}</span><span className="stat-label">Events</span></div></div>
        <div className="stat-card accent-green"><HiOutlineTicket size={28}/><div><span className="stat-value">{ov.totalRegistrations}</span><span className="stat-label">Registrations</span></div></div>
        <div className="stat-card accent-purple"><HiOutlineUsers size={28}/><div><span className="stat-value">{ov.eventsByCategory?.length}</span><span className="stat-label">Categories</span></div></div>
        <div className="stat-card accent-orange"><HiOutlineTrendingUp size={28}/><div><span className="stat-value">{ov.monthlyTrend?.length>0?ov.monthlyTrend[ov.monthlyTrend.length-1].count:0}</span><span className="stat-label">This Month</span></div></div>
      </div>
      <div className="admin-grid">
        <div className="card"><h2>By Category</h2><div className="category-bars">
          {ov.eventsByCategory?.map(c=>{const mx=Math.max(...ov.eventsByCategory.map(x=>x.count));return(
            <div key={c.category} className="category-row"><span className="category-name">{c.category}</span><div className="category-bar-wrapper"><div className="category-bar" style={{width:`${(c.count/mx)*100}%`}}/></div><span className="category-count">{c.count}</span></div>
          )})}</div></div>
        <div className="card"><h2>Monthly Trend</h2>{ov.monthlyTrend?.length>0?<div className="trend-bars tall">
          {ov.monthlyTrend.map(m=>{const mx=Math.max(...ov.monthlyTrend.map(t=>t.count));return(
            <div key={m.month} className="trend-bar"><div className="bar" style={{height:`${Math.max(8,(m.count/mx)*100)}%`}}/><span>{m.month.slice(5)}</span></div>
          )})}</div>:<p className="text-muted">No data</p>}</div>
      </div>
      <div className="card"><h2>Recent Events</h2><div className="events-table"><table><thead><tr><th>Title</th><th>Category</th><th>Registrations</th><th>Date</th></tr></thead><tbody>
        {ov.recentEvents?.map(ev=><tr key={ev._id}><td><strong>{ev.title}</strong></td><td><span className="tag">{ev.category}</span></td><td>{ev.registeredCount}/{ev.capacity}</td><td>{new Date(ev.startDate).toLocaleDateString()}</td></tr>)}
      </tbody></table></div></div>
    </div>
  );
}
