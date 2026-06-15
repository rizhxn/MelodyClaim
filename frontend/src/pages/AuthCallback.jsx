import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      // Force page reload to trigger AuthContext verification
      window.location.href = '/';
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <p className="text-white">Completing authentication...</p>
    </div>
  );
}
