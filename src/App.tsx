import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import CardCreator from './components/CardCreator';
import CardCollection from './components/CardCollection';
import BattleMatchmaking from './components/BattleMatchmaking';
import BattleArena from './components/BattleArena';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Swords, Plus, Library, LogOut } from 'lucide-react';

type View = 'collection' | 'create' | 'battle' | 'arena';

function GameContent() {
  const { user, loading, signOut } = useAuth();
  const [view, setView] = useState<View>('collection');
  const [battleId, setBattleId] = useState<string | null>(null);
  const [refreshCards, setRefreshCards] = useState(0);

  const handleCardCreated = () => {
    setRefreshCards(prev => prev + 1);
    setView('collection');
  };

  const handleBattleStart = (id: string) => {
    setBattleId(id);
    setView('arena');
  };

  const handleBattleEnd = () => {
    setBattleId(null);
    setView('battle');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Swords className="w-6 h-6 text-slate-900" />
              </div>
              <h1 className="text-xl font-bold text-white">Card Battle Arena</h1>
            </div>

            {view !== 'arena' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('collection')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    view === 'collection'
                      ? 'bg-amber-500 text-slate-900 font-bold'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Library className="w-4 h-4" />
                  <span className="hidden sm:inline">Collection</span>
                </button>

                <button
                  onClick={() => setView('create')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    view === 'create'
                      ? 'bg-amber-500 text-slate-900 font-bold'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Create</span>
                </button>

                <button
                  onClick={() => setView('battle')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    view === 'battle'
                      ? 'bg-amber-500 text-slate-900 font-bold'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span className="hidden sm:inline">Battle</span>
                </button>

                <div className="w-px h-8 bg-slate-700 mx-2"></div>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'collection' && (
          <CardCollection key={refreshCards} />
        )}

        {view === 'create' && (
          <CardCreator onCardCreated={handleCardCreated} />
        )}

        {view === 'battle' && (
          <BattleMatchmaking onBattleStart={handleBattleStart} />
        )}

        {view === 'arena' && battleId && (
          <BattleArena battleId={battleId} onBattleEnd={handleBattleEnd} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <GameContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
