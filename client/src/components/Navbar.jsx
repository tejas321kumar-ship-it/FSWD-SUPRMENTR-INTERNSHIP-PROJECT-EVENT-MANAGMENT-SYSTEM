import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCalendar, HiOutlineUser, HiOutlineLogout, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'organizer') return '/organizer';
    return '/dashboard';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <HiOutlineCalendar size={24} />
          <span>EventHub</span>
        </Link>
        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
        </button>
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/events" onClick={() => setMenuOpen(false)}>Events</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <div className="navbar-user">
                <HiOutlineUser size={18} />
                <span>{user.name}</span>
                <span className="role-badge">{user.role}</span>
              </div>
              <button className="btn btn-ghost" onClick={handleLogout}>
                <HiOutlineLogout size={18} /><span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
