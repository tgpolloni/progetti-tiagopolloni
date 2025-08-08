'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('Auth state:', { user, loading });
    if (!loading) {
      if (user) {
        console.log('User authenticated, redirecting to dashboard');
        // Se o usuário está autenticado, redireciona para o dashboard
        router.push('/dashboard');
      } else {
        console.log('User not authenticated, redirecting to login');
        // Se não está autenticado, redireciona para o login
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gesti-Frella</h1>
        <p className="text-gray-600">
          {loading ? 'Verificando autenticação...' : 'Redirecionando...'}
        </p>
      </div>
    </div>
  );
}
