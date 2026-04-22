import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', role:'user', phone:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const update = (f) => (e) => setForm({...form, [f]: e.target.value});

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header"><h1>Create account</h1><p>Join EventHub to discover and manage events</p></div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Full Name</label><input required placeholder="John Doe" value={form.name} onChange={update('name')} /></div>
          <div className="form-group"><label>Email</label><input type="email" required placeholder="you@example.com" value={form.email} onChange={update('email')} /></div>
          <div className="form-group"><label>Phone (optional)</label><input type="tel" placeholder="+91 1234567890" value={form.phone} onChange={update('phone')} /></div>
          <div className="form-group"><label>I want to</label>
            <select value={form.role} onChange={update('role')}>
              <option value="user">Attend events</option>
              <option value="organizer">Organize events</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Password</label><input type="password" required placeholder="Min 6 chars" value={form.password} onChange={update('password')} /></div>
            <div className="form-group"><label>Confirm</label><input type="password" required placeholder="••••••••" value={form.confirmPassword} onChange={update('confirmPassword')} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
