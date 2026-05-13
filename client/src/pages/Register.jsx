import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, CalendarDays, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user', phone: '' });
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address';
    const [local, domain] = trimmed.split('@');
    if (!/[a-zA-Z]/.test(local)) return 'Email must contain letters, not just numbers';
    if (local.length < 3) return 'Email username is too short';
    const isAllowedProvider = allowedDomains.includes(domain);
    const isOrgOrEdu = /\.(edu|edu\.in|ac\.in|org|gov|gov\.in)$/i.test(domain);
    if (!isAllowedProvider && !isOrgOrEdu) return `Email domain "${domain}" is not supported. Use Gmail, Outlook, Yahoo, etc.`;
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!form.email.trim()) return setError('Email is required');
    const emailError = validateEmail(form.email);
    if (emailError) return setError(emailError);
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const data = await register(payload);
      // Route to the correct dashboard based on role
      const role = data.user?.role;
      navigate(role === 'admin' ? '/admin' : role === 'organizer' ? '/organizer' : '/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.join(', ') ||
        'Registration failed'
      );
    } finally { setLoading(false); }
  };

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  return (
    <div className="soft-gradient flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join EventHub to discover and manage events</p>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Get started</CardTitle>
            <CardDescription>Choose what you'd like to do</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={form.role} onValueChange={(v) => setForm({ ...form, role: v })} className="mb-5">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user" className="gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />Attend
                </TabsTrigger>
                <TabsTrigger value="organizer" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" />Organize
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" required placeholder="John Doe" value={form.name} onChange={update('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required placeholder="you@example.com" value={form.email} onChange={update('email')} autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="phone" type="tel" placeholder="+91 1234567890" value={form.phone} onChange={update('phone')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required minLength={6} placeholder="Min 6 chars" value={form.password} onChange={update('password')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm</Label>
                  <Input id="confirm" type="password" required placeholder="••••••••" value={form.confirmPassword} onChange={update('confirmPassword')} />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />}
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
