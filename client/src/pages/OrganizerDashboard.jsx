import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUsers, HiOutlineChartBar, HiOutlineCheckCircle } from 'react-icons/hi';

const cats = ['conference','workshop','seminar','hackathon','meetup','webinar','other'];
const initForm = {title:'',description:'',category:'workshop','venue.name':'','venue.city':'','venue.isOnline':false,startDate:'',endDate:'',capacity:50,price:0,tags:'',allowTeams:false,maxTeamSize:5,status:'draft'};

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [att, setAtt] = useState({show:false,list:[]});
  const [ana, setAna] = useState(null);
  const [form, setForm] = useState(initForm);
  const u = f => e => setForm({...form,[f]:e.target.type==='checkbox'?e.target.checked:e.target.value});

  useEffect(()=>{api.get('/events/my/events').then(r=>setEvents(r.data.events)).finally(()=>setLoading(false))},[]);

  const reset = ()=>{setForm(initForm);setEditId(null);setShowForm(false)};

  const submit = async e => {
    e.preventDefault();
    const p = {title:form.title,description:form.description,category:form.category,venue:{name:form['venue.name'],city:form['venue.city'],isOnline:form['venue.isOnline']},startDate:form.startDate,endDate:form.endDate,capacity:+form.capacity,price:+form.price,tags:form.tags.split(',').map(t=>t.trim()).filter(Boolean),allowTeams:form.allowTeams,maxTeamSize:+form.maxTeamSize,status:form.status};
    try{if(editId){const r=await api.put(`/events/${editId}`,p);setEvents(events.map(ev=>ev._id===editId?r.data.event:ev))}else{const r=await api.post('/events',p);setEvents([r.data.event,...events])}reset()}catch(err){alert(err.response?.data?.message||'Failed')}
  };

  const edit = ev => {setForm({title:ev.title,description:ev.description,category:ev.category,'venue.name':ev.venue?.name||'','venue.city':ev.venue?.city||'','venue.isOnline':ev.venue?.isOnline||false,startDate:ev.startDate?.slice(0,16),endDate:ev.endDate?.slice(0,16),capacity:ev.capacity,price:ev.price,tags:ev.tags?.join(', ')||'',allowTeams:ev.allowTeams,maxTeamSize:ev.maxTeamSize,status:ev.status});setEditId(ev._id);setShowForm(true)};
  const del = async id=>{if(!confirm('Delete?'))return;await api.delete(`/events/${id}`);setEvents(events.filter(e=>e._id!==id))};

  return (
    <div className="dashboard">
      <div className="dashboard-header"><div><h1>Organizer Dashboard</h1><p>Welcome, {user?.name}</p></div>
        <button className="btn btn-primary" onClick={()=>{reset();setShowForm(!showForm)}}><HiOutlinePlus size={18}/>{showForm?'Cancel':'Create Event'}</button></div>

      {showForm&&<div className="card form-card"><h2>{editId?'Edit':'Create'} Event</h2><form onSubmit={submit}>
        <div className="form-row"><div className="form-group"><label>Title</label><input required value={form.title} onChange={u('title')}/></div>
        <div className="form-group"><label>Category</label><select value={form.category} onChange={u('category')}>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select></div></div>
        <div className="form-group"><label>Description</label><textarea rows={3} required value={form.description} onChange={u('description')}/></div>
        <div className="form-row"><div className="form-group"><label>Venue</label><input required value={form['venue.name']} onChange={u('venue.name')}/></div>
        <div className="form-group"><label>City</label><input value={form['venue.city']} onChange={u('venue.city')}/></div></div>
        <div className="form-row"><div className="form-group"><label>Start</label><input type="datetime-local" required value={form.startDate} onChange={u('startDate')}/></div>
        <div className="form-group"><label>End</label><input type="datetime-local" required value={form.endDate} onChange={u('endDate')}/></div></div>
        <div className="form-row"><div className="form-group"><label>Capacity</label><input type="number" min="1" value={form.capacity} onChange={u('capacity')}/></div>
        <div className="form-group"><label>Price</label><input type="number" min="0" value={form.price} onChange={u('price')}/></div>
        <div className="form-group"><label>Status</label><select value={form.status} onChange={u('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></div></div>
        <div className="form-group"><label>Tags</label><input value={form.tags} onChange={u('tags')} placeholder="react, js"/></div>
        <div className="form-group checkbox-group"><label><input type="checkbox" checked={form.allowTeams} onChange={u('allowTeams')}/> Allow Teams</label></div>
        <button type="submit" className="btn btn-primary">{editId?'Update':'Create'}</button></form></div>}

      {ana&&<div className="modal-overlay" onClick={()=>setAna(null)}><div className="modal-content" onClick={e=>e.stopPropagation()}><h2>Analytics</h2>
        <div className="analytics-grid">
          <div className="analytics-stat"><span className="stat-value">{ana.totalRegistrations}</span><span>Total</span></div>
          <div className="analytics-stat"><span className="stat-value">{ana.fillRate}%</span><span>Fill Rate</span></div>
          <div className="analytics-stat"><span className="stat-value">{ana.checkedIn}</span><span>Checked In</span></div>
          <div className="analytics-stat"><span className="stat-value">₹{ana.revenue}</span><span>Revenue</span></div>
        </div><button className="btn btn-ghost" onClick={()=>setAna(null)}>Close</button></div></div>}

      {att.show&&<div className="modal-overlay" onClick={()=>setAtt({show:false,list:[]})}><div className="modal-content wide" onClick={e=>e.stopPropagation()}><h2>Attendees ({att.list.length})</h2>
        <div className="attendees-table"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {att.list.map(r=><tr key={r._id}><td>{r.user?.name}</td><td>{r.user?.email}</td><td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
          <td>{r.status==='confirmed'&&<button className="btn btn-sm btn-primary" onClick={async()=>{await api.put(`/registrations/${r._id}/checkin`);setAtt(p=>({...p,list:p.list.map(x=>x._id===r._id?{...x,status:'attended'}:x)}))}}><HiOutlineCheckCircle/> Check In</button>}</td></tr>)}
        </tbody></table></div><button className="btn btn-ghost" onClick={()=>setAtt({show:false,list:[]})}>Close</button></div></div>}

      <h2>Your Events ({events.length})</h2>
      {loading?<div className="page-loader">Loading...</div>:events.length===0?<div className="empty-state"><h3>No events yet</h3></div>:
      <div className="events-table"><table><thead><tr><th>Event</th><th>Date</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {events.map(ev=><tr key={ev._id}><td><strong>{ev.title}</strong></td><td>{new Date(ev.startDate).toLocaleDateString()}</td><td>{ev.registeredCount}/{ev.capacity}</td>
        <td><span className={`status-badge ${ev.status}`}>{ev.status}</span></td>
        <td className="action-buttons">
          <button className="btn btn-ghost btn-sm" onClick={async()=>{const r=await api.get(`/registrations/event/${ev._id}`);setAtt({show:true,list:r.data.registrations})}}><HiOutlineUsers/></button>
          <button className="btn btn-ghost btn-sm" onClick={async()=>{const r=await api.get(`/analytics/event/${ev._id}`);setAna(r.data.analytics)}}><HiOutlineChartBar/></button>
          <button className="btn btn-ghost btn-sm" onClick={()=>edit(ev)}><HiOutlinePencil/></button>
          <button className="btn btn-ghost btn-sm danger" onClick={()=>del(ev._id)}><HiOutlineTrash/></button>
        </td></tr>)}
      </tbody></table></div>}
    </div>
  );
}
