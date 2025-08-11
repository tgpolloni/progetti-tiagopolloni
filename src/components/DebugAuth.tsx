'use client';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

type TestResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

type TestResults = {
  timestamp: string;
  user: {
    id: string;
    email: string | undefined;
    role: string | undefined;
  } | null;
  tests: Record<string, TestResult>;
};

export function DebugAuth() {
  const { user, loading } = useAuth();
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isTestingDB, setIsTestingDB] = useState(false);

  const testDatabaseConnection = async () => {
    setIsTestingDB(true);
    const results: TestResults = {
      timestamp: new Date().toISOString(),
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null,
      tests: {}
    };

    try {
      // Test 1: Check if tables exist
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .in('table_name', ['clients', 'projects', 'briefings']);
      
      results.tests.tablesExist = {
        success: !tablesError,
        data: tables,
        error: tablesError?.message
      };

      // Test 2: Try to read from clients table
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);
      
      results.tests.clientsRead = {
        success: !clientsError,
        data: clientsData,
        error: clientsError?.message
      };

      // Test 3: Try to read from projects table
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);
      
      results.tests.projectsRead = {
        success: !projectsError,
        data: projectsData,
        error: projectsError?.message
      };

      // Test 4: Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .in('tablename', ['clients', 'projects']);
      
      results.tests.rlsPolicies = {
        success: !policiesError,
        data: policies,
        error: policiesError?.message
      };

    } catch (error: unknown) {
      const err = error as { message?: string };
      results.tests.generalError = {
        success: false,
        error: err?.message
      };
    }

    setTestResults(results);
    setIsTestingDB(false);
  };

  const createTestUser = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'test123456'
      });
      
      if (error) {
        alert(`Errore nella creazione utente: ${error.message}`);
      } else {
        alert('Utente di test creato con successo!');
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      alert(`Errore: ${err?.message || 'Errore sconosciuto'}`);
    }
  };

  if (loading) {
    return (
      <Card className="m-4">
        <CardContent className="p-4">
          <p>Caricamento stato autenticazione...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>🔍 Debug Autenticazione e Database</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Stato Autenticazione:</h3>
          <div className="bg-gray-100 p-3 rounded">
            {user ? (
              <div>
                <p>✅ <strong>Utente autenticato</strong></p>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role || 'authenticated'}</p>
              </div>
            ) : (
              <p>❌ <strong>Nessun utente autenticato</strong></p>
            )}
          </div>
        </div>

        <div className="space-x-2">
          <Button 
            onClick={testDatabaseConnection}
            disabled={isTestingDB}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTestingDB ? 'Testing...' : 'Test Database'}
          </Button>
          
          <Button 
            onClick={createTestUser}
            className="bg-green-600 hover:bg-green-700"
          >
            Crea Utente Test
          </Button>
        </div>

        {testResults && (
          <div>
            <h3 className="font-semibold mb-2">Risultati Test Database:</h3>
            <div className="bg-gray-100 p-3 rounded text-sm">
              <pre>{JSON.stringify(testResults, null, 2)}</pre>
            </div>
          </div>
        )}

        <div className="bg-yellow-100 p-3 rounded">
          <h4 className="font-semibold mb-2">🚨 Passi per risolvere gli errori 400/409:</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Assicurati di essere autenticato (login)</li>
            <li>Verifica che le tabelle esistano nel database Supabase</li>
            <li>Controlla che le politiche RLS siano configurate correttamente</li>
            <li>Esegui lo script <code>fix_rls_policies.sql</code> nel SQL Editor di Supabase</li>
            <li>Se necessario, disabilita temporaneamente RLS per il debug</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}