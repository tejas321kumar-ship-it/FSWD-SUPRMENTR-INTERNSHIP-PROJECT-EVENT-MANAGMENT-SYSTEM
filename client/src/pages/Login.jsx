import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Allowed email domains
  const allowedDomains = [
    'gmail.com', 'yahoo.com', 'yahoo.in', 'yahoo.co.in',
    'outlook.com', 'hotmail.com', 'live.com',
    'icloud.com', 'me.com', 'mac.com',
    'protonmail.com', 'proton.me',
    'zoho.com', 'zoho.in',
    'aol.com', 'mail.com', 'gmx.com',
    'rediffmail.com', 'yandex.com',
  ];

  const validateEmail = (email) => {
    const trimmed = email.trim().toLowerCase();
    // Basic format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address';
    const [local, domain] = trimmed.split('@');
    // Local part must contain at least one letter (rejects 123@gmail.com)
    if (!/[a-zA-Z]/.test(local)) return 'Email must contain letters, not just numbers';
    // Local part must be at least 3 characters
    if (local.length < 3) return 'Email username is too short';
    // Must be a known provider (or allow edu/org/company domains)
    const isAllowedProvider = allowedDomains.includes(domain);
    const isOrgOrEdu = /\.(edu|edu\.in|ac\.in|org|gov|gov\.in)$/i.test(domain);
    if (!isAllowedProvider && !isOrgOrEdu) return `Email domain "${domain}" is not supported. Use Gmail, Outlook, Yahoo, etc.`;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim()) return setError('Email is required');
    const emailError = validateEmail(form.email);
    if (emailError) return setError(emailError);
    if (!form.password) return setError('Password is required');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      const role = data.user.role;
      navigate(role === 'admin' ? '/admin' : role === 'organizer' ? '/organizer' : '/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soft-gradient flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your EventHub account</p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
