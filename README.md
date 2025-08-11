# Gesti-Frella 🚀

Sistema web per la gestione di progetti freelancer, dall'iniziale contatto con il cliente fino alla consegna finale.

## 🎯 Funzionalità

### Gestione Progetti
- ✅ Creare, visualizzare, modificare ed eliminare progetti
- ✅ Collegamento progetti-clienti
- ✅ Stati progetto: "In attesa di briefing", "In corso", "Pausa", "Completato"
- ✅ Note interne per progetto
- 🔄 Upload file (Firebase Storage) - *In sviluppo*

### Formulario Pubblico di Briefing
- ✅ Link unico per ogni progetto
- ✅ Formulario completo in italiano con 12 sezioni
- ✅ Salvataggio automatico risposte in Firestore
- ✅ Validazione campi e UX ottimizzata

### Gestione Clienti
- ✅ CRUD completo clienti
- ✅ Validazione email e codice fiscale/P.IVA
- ✅ Associazione progetti-clienti
- ✅ Ricerca e filtri

### Dashboard Amministratore
- ✅ Autenticazione Firebase (solo admin)
- ✅ Statistiche progetti per stato
- ✅ Lista progetti recenti
- ✅ Filtri e ricerca avanzata

### Email Automatiche
- 🔄 Invio automatico via Firebase Functions - *In sviluppo*
- 🔄 Template personalizzabili - *In sviluppo*
- 🔄 Log email - *In sviluppo*

## 🛠 Tecnologie

- **Frontend**: Next.js 14 + TypeScript
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Yup
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Icons**: Lucide React
- **Deployment**: Vercel (frontend) + Firebase (backend)

## 📁 Struttura Firestore

```
collections/
├── projects/
│   ├── clientId: string
│   ├── nome: string
│   ├── descrizione?: string
│   ├── status: 'In attesa di briefing' | 'In corso' | 'Pausa' | 'Completato'
│   ├── briefingCompleted: boolean
│   ├── briefingURL: string
│   ├── internalNotes?: string
│   ├── createdAt: Date
│   └── updatedAt?: Date
│
├── clients/
│   ├── nomeCompleto: string
│   ├── nomeAzienda?: string
│   ├── codiceFiscaleOrPIVA: string
│   ├── email: string
│   ├── telefono: string
│   ├── ruolo?: string
│   ├── createdAt: Date
│   └── updatedAt?: Date
│
├── briefings/
│   ├── projectId: string
│   ├── clientId: string
│   ├── [tutti i campi del formulario]
│   ├── createdAt: Date
│   └── updatedAt?: Date
│
└── emails/ (futuro)
    ├── templates/
    └── logs/
```

## 🚀 Setup e Installazione

### 1. Clone del Repository
```bash
git clone <repository-url>
cd gesti-frella
```

### 2. Installazione Dipendenze
```bash
npm install
```

### 3. Configuração Supabase

1. Cria um novo projeto em [Supabase](https://supabase.com/)
2. Vai em Authentication > Settings e configura Email/Password
3. Cria as tabelas no banco de dados (veja estrutura abaixo)
4. Obtém as credenciais da API

### 4. Configuração do Ambiente

#### Desenvolvimento Local

1. Copia o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` e insere suas credenciais do Supabase:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Admin Email
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@example.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Produção

**IMPORTANTE**: Para produção, você deve configurar as variáveis de ambiente diretamente na plataforma de hospedagem:

- **Vercel**: Vá em Project Settings > Environment Variables
- **Netlify**: Vá em Site Settings > Environment Variables  
- **Outras plataformas**: Consulte a documentação específica

**Variáveis obrigatórias para produção**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_APP_URL` (URL da sua aplicação em produção)
- `NEXT_PUBLIC_BASE_URL` (URL base da sua aplicação em produção)

> ⚠️ **Nota**: Os arquivos `.env*` são ignorados pelo Git por segurança. Nunca commite credenciais reais no repositório.

### 5. Estrutura do Banco de Dados Supabase

Cria as seguintes tabelas no seu projeto Supabase:

**Tabela: projects**
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_progetto TEXT NOT NULL,
  cliente_id UUID REFERENCES clients(id),
  tipo_progetto TEXT NOT NULL,
  descrizione TEXT,
  stato TEXT DEFAULT 'in_corso',
  data_inizio DATE,
  data_fine_prevista DATE,
  budget DECIMAL,
  briefing_url TEXT,
  note_interne TEXT,
  files TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Tabela: clients**
```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  nome_azienda TEXT,
  codice_fiscale_or_piva TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  ruolo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Tabela: briefings**
```sql
CREATE TABLE briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  nome_azienda TEXT,
  tipo_progetto TEXT NOT NULL,
  descrizione_progetto TEXT NOT NULL,
  obiettivi TEXT,
  target_audience TEXT,
  budget TEXT,
  timeline TEXT,
  riferimenti TEXT,
  note_aggiuntive TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. Avvio Sviluppo
```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:3000`

## 📱 Utilizzo

### Accesso Amministratore
1. Vai su `/login`
2. Accedi con le credenziali Firebase
3. Accedi al dashboard su `/dashboard`

### Creazione Progetto
1. Dashboard > Progetti > Nuovo Progetto
2. Compila i dati del progetto
3. Seleziona cliente esistente o creane uno nuovo
4. Il sistema genera automaticamente il link del briefing

### Briefing Cliente
1. Condividi il link del briefing con il cliente
2. Il cliente compila il formulario pubblico
3. Le risposte vengono salvate automaticamente
4. Il progetto viene marcato come "briefing completato"

## 🎨 Design System

Il design è ispirato ai colori e al layout moderno, con:
- **Colori primari**: Blu e verde
- **Font**: Inter
- **Componenti**: Card, Button, Input riutilizzabili
- **Responsive**: Mobile-first design
- **Icone**: Lucide React

## 🔧 Struttura Progetto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── dashboard/          # Dashboard protetto
│   ├── briefing/[id]/      # Formulario pubblico
│   ├── login/              # Pagina login
│   └── globals.css         # Stili globali
│
├── components/             # Componenti riutilizzabili
│   ├── ui/                 # Componenti UI base
│   ├── DashboardLayout.tsx # Layout dashboard
│   └── ProtectedRoute.tsx  # Protezione route
│
├── hooks/                  # Custom hooks
│   └── useAuth.tsx         # Hook autenticazione
│
├── lib/                    # Utilities e configurazioni
│   ├── firebase.ts         # Config Firebase
│   └── utils.ts            # Funzioni utility
│
├── services/               # Servizi API
│   ├── projectService.ts   # CRUD progetti
│   ├── clientService.ts    # CRUD clienti
│   └── briefingService.ts  # CRUD briefing
│
└── types/                  # TypeScript types
    └── index.ts            # Definizioni tipi
```

## 🚀 Deploy

### Frontend (Vercel)
1. Connetti repository a Vercel
2. Configura variabili ambiente
3. Deploy automatico

### Backend (Firebase)
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase init`
4. `firebase deploy`

## 🔮 Roadmap

- [ ] Sistema email automatiche (Firebase Functions)
- [ ] Upload e gestione file (Firebase Storage)
- [ ] Template email personalizzabili
- [ ] Notifiche in-app
- [ ] Export dati (PDF, Excel)
- [ ] Calendario e scadenze
- [ ] Sistema fatturazione
- [ ] App mobile (React Native)

## 🤝 Contributi

Il progetto è in sviluppo attivo. Per contribuire:
1. Fork del repository
2. Crea feature branch
3. Commit delle modifiche
4. Push e Pull Request

## 📄 Licenza

MIT License - vedi file LICENSE per dettagli.

---

**Gesti-Frella** - Sistema di gestione progetti freelancer 🇮🇹
