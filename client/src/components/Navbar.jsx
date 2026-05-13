import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, LogOut, Menu, X, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

  const initials = (user?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container-wide flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground hover:opacity-80 transition">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="h-4 w-4" />
          </div>
          <span className="text-lg">EventHub</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" asChild size="sm">
            <Link to="/events">Events</Link>
          </Button>
          {user && (
            <Button variant="ghost" asChild size="sm">
              <Link to={getDashboardLink()}>Dashboard</Link>
            </Button>
          )}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3 hover:bg-accent transition">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    <Badge variant="secondary" className="mt-1.5 w-fit capitalize">{user.role}</Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={getDashboardLink()}><LayoutDashboard />Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut />Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container-wide py-4 flex flex-col gap-2">
            <Link
              to="/events"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Events
            </Link>
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user.name}</span>
                  <Badge variant="secondary" className="ml-auto capitalize">{user.role}</Badge>
                </div>
                <Button variant="outline" onClick={handleLogout} className="justify-start">
                  <LogOut />Log out
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" asChild>
                  <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
