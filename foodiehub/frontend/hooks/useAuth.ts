'use client';

import { useState } from 'react';
import { loginRequest } from '@/services/auth.service';

export function useAuth() {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      return await loginRequest(email, password);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
