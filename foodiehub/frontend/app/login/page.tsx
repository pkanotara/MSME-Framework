'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginRequest } from '@/services/auth.service';
import { useAuthContext } from '@/context/AuthContext';

const roleFromToken = (token: string): 'super_admin' | 'restaurant_owner' | 'manager' | null => {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload)).role ?? null;
  } catch {
    return null;
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const { token } = await loginRequest(email, password);
      const role = roleFromToken(token);
      setSession({ token, role });
      if (role === 'super_admin') router.push('/admin');
      else router.push('/owner');
    } catch {
      setError('Login failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-6">Login to FoodieHub</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input className="w-full border rounded-lg px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full bg-indigo-600 text-white py-2 rounded-lg">Sign in</button>
        </form>
      </div>
    </main>
  );
}
