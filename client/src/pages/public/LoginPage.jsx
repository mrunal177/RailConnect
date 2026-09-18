import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Train } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('rahul@railconnect.ai');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      login(response.user, response.token);
      navigate(response.user.role === 'admin' ? '/admin' : '/passenger');
    } catch (requestError) { setError(requestError.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0d1929] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-cyan-500/20 shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-3">
              <Train className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Sign In to RailConnect</h2>
            <p className="text-xs text-slate-400 mt-1">Access your bookings, tickets, and passenger portal</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={LogIn}
              isLoading={isLoading}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 font-bold hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
