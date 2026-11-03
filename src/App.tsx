import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { QuizScreen } from './screens/QuizScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { RevisionScreen } from './screens/RevisionScreen';
import { UploadNotesScreen } from './screens/UploadNotesScreen';
import { BattleLobbyScreen } from './screens/BattleLobbyScreen';
import { BattleGameScreen } from './screens/BattleGameScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LandingPage } from './screens/LandingPage';
import type { Question, BattleRoom, BattleParticipant } from './types/database';

function MainLayout() {
  const { user, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash) return hash;
      const path = window.location.pathname;
      if (path === '/app') return 'home';
      if (path === '/login') return 'login';
    }
    return 'landing';
  });
  // Active quiz state
  const [activeQuizTopicId, setActiveQuizTopicId] = useState<string>('topic-1');
  const [activeQuizTitle, setActiveQuizTitle] = useState<string>('ER Modeling');
  const [activeQuizCustomQuestions, setActiveQuizCustomQuestions] = useState<Question[] | undefined>();

  // Active quiz results state
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    xpEarned: number;
    weakTopics: string[];
  }>({ score: 0, total: 10, xpEarned: 0, weakTopics: [] });

  // Active battle game state
  const [activeBattleRoom, setActiveBattleRoom] = useState<BattleRoom | null>(null);
  const [activeBattleParticipants, setActiveBattleParticipants] = useState<BattleParticipant[]>([]);

  const handleNavigate = (route: string, params: any = {}) => {
    if (params?.topicId) {
      setActiveQuizTopicId(params.topicId);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartPracticeQuiz = (topicId: string, topicTitle: string, customQuestions?: Question[]) => {
    setActiveQuizTopicId(topicId);
    setActiveQuizTitle(topicTitle);
    setActiveQuizCustomQuestions(customQuestions);
    setCurrentRoute('quiz');
  };

  const handleStartRevisionQuiz = (questions: Question[]) => {
    setActiveQuizTopicId('revision');
    setActiveQuizTitle("Today's Revision Quiz");
    setActiveQuizCustomQuestions(questions);
    setCurrentRoute('quiz');
  };

  const handleQuizFinish = (result: {
    score: number;
    total: number;
    xpEarned: number;
    weakTopics: string[];
  }) => {
    setQuizResult(result);
    setCurrentRoute('results');
  };

  const handleStartBattleGame = (room: BattleRoom, participants: BattleParticipant[]) => {
    setActiveBattleRoom(room);
    setActiveBattleParticipants(participants);
    setCurrentRoute('battle-game');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--dp-color-ground)] flex items-center justify-center font-clay">
        <div className="clay-cushion-cream p-8 flex flex-col items-center gap-4 rounded-3xl">
          <div className="w-10 h-10 rounded-full border-3 border-[var(--dp-color-surface-support)] border-t-[var(--dp-color-primary-action)] animate-spin"></div>
          <span className="text-sm font-bold text-[var(--dp-color-ink)]">
            Loading Learnify...
          </span>
        </div>
      </div>
    );
  }

  if (currentRoute === 'landing') {
    return <LandingPage onEnterApp={() => handleNavigate(user ? 'home' : 'login')} />;
  }

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] font-clay flex flex-col justify-between selection:bg-[var(--dp-color-accent)] selection:text-[var(--dp-color-ink)] antialiased">
      {/* Top Navbar Component (hidden on login and landing screens) */}
      {user && currentRoute !== 'login' && currentRoute !== 'landing' && (
        <Navbar onNavigate={handleNavigate} currentRoute={currentRoute} />
      )}

      {/* Main Operational Stage */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        {(!user || currentRoute === 'login') ? (
          <LoginScreen
            onSuccess={() => handleNavigate('home')}
            onBackToLanding={() => handleNavigate('landing')}
          />
        ) : (
          <>
            {currentRoute === 'login' && (
              <LoginScreen onSuccess={() => handleNavigate('home')} />
            )}

            {currentRoute === 'home' && (
              <HomeScreen onNavigate={handleNavigate} />
            )}

            {currentRoute === 'practice' && (
              <PracticeScreen onStartQuiz={handleStartPracticeQuiz} />
            )}

            {currentRoute === 'quiz' && (
              <QuizScreen
                topicId={activeQuizTopicId}
                topicTitle={activeQuizTitle}
                customQuestions={activeQuizCustomQuestions}
                onFinish={handleQuizFinish}
                onExit={() => handleNavigate('home')}
              />
            )}

            {currentRoute === 'results' && (
              <ResultsScreen
                score={quizResult.score}
                total={quizResult.total}
                xpEarned={quizResult.xpEarned}
                weakTopicIds={quizResult.weakTopics}
                onNavigate={handleNavigate}
              />
            )}

            {currentRoute === 'revision' && (
              <RevisionScreen
                onStartRevisionQuiz={handleStartRevisionQuiz}
                onNavigate={handleNavigate}
              />
            )}

            {currentRoute === 'upload' && (
              <UploadNotesScreen onStartQuiz={handleStartPracticeQuiz} />
            )}

            {currentRoute === 'battle' && (
              <BattleLobbyScreen onStartGame={handleStartBattleGame} />
            )}

            {currentRoute === 'battle-game' && activeBattleRoom && (
              <BattleGameScreen
                room={activeBattleRoom}
                initialParticipants={activeBattleParticipants}
                onExit={() => handleNavigate('battle')}
              />
            )}

            {currentRoute === 'profile' && (
              <ProfileScreen onNavigate={handleNavigate} />
            )}
          </>
        )}
      </main>

      {/* Modernized Clean Footer */}
      <footer className="mt-8 bg-white border-t border-slate-200/80 px-4 py-5 text-xs text-slate-500 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900">Learnify</span>
            <span>·</span>
            <span>Practice. Compete. Revise.</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span>DBMS Relational Console</span>
            <span>&copy; 2026 Learnify · Gamified Exam Prep</span>
          </div>
        </div>
      </footer>

      {/* Bottom Nav on Mobile Devices */}
      {user && currentRoute !== 'login' && currentRoute !== 'landing' && currentRoute !== 'quiz' && currentRoute !== 'battle-game' && (
        <BottomNav currentRoute={currentRoute} onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
