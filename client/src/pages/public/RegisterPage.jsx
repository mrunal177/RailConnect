import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, UserPlus, Train } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    setIsLoading(true);
    try {
      const response = await authService.register({ fullName, email, phone, password });
      login(response.user, response.token);
      navigate('/passenger');
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
            <h2 className="text-2xl font-extrabold text-white">Create Passenger Account</h2>
            <p className="text-xs text-slate-400 mt-1">Register for instant bookings and ticket tracking</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
            <Input
              label="Full Name"
              type="text"
              icon={User}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Rahul Sharma"
              required
            />
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              icon={Phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
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

            <Button type="submit" variant="primary" size="md" icon={UserPlus} isLoading={isLoading} className="mt-2">
              Register Account
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
