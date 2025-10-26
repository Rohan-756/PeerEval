'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Star, MessageCircle, TrendingUp, Download, User, CheckCircle, Plus, Hash, Lock, LogIn, UserPlus, Home as HomeIcon } from 'lucide-react';

// --- FRONTEND MOCK DATA & DEFINITIONS ---
// These values are mocked for UI development purposes only.
const RATING_CRITERIA = [
    { id: 'contribution', name: 'Task Contribution', description: 'Degree of effort, responsibility, and output quality.' },
    { id: 'communication', name: 'Communication & Collaboration', description: 'Clarity, timeliness, and helpfulness in team interactions.' },
    { id: 'quality', name: 'Work Quality', description: 'Accuracy, completeness, and robustness of deliverables.' },
    { id: 'timeliness', name: 'Meeting Deadlines', description: 'Adherence to scheduled milestones and project timelines.' },
];
const MAX_RATING = 5;
const MOCK_UID = "mock_user_1234567890"; // Mock UID for authenticated state

// --- Main Next.js Page Component ---

export default function Page() {
    // --- Frontend State for Navigation & Auth Mock ---
    const [userId, setUserId] = useState<string | null>(null);
    // Initial view set to 'home'
    const [view, setView] = useState<'home' | 'auth' | 'dashboard' | 'review' | 'rating' | 'report'>('home');
    const [isLoading, setIsLoading] = useState(false); // No network loading required

        // --- Add this useEffect to restore logged-in user ---
        useEffect(() => {
          const savedUser = localStorage.getItem('peerEvalUser');
          if (savedUser) {
              setUserId(savedUser);
              setView('dashboard'); // automatically go to dashboard if user exists
          }
      }, []);

    // --- Mock Data States (For future functionality) ---
    const [projects, setProjects] = useState<any[]>([]); 
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);

    // --- Simulated Logout Handler ---
    const handleLogout = () => {
        setUserId(null);
        setCurrentProjectId(null);
        setProjects([]);
        setView('home');
        console.log("Logged out. State reset.");
    };

    // --- Simulated Functions (Strictly Frontend) ---
    
    // Auth actions now just mock the state change

    // Inside Page()

const handleAuthAction = async (action: 'register' | 'login', email?: string, password?: string) => {
  setIsLoading(true);
  try {
    const res = await fetch(`/api/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Authentication failed');
      return;
    }

    setUserId(data.userId);
    localStorage.setItem('peerEvalUser', data.userId);
    setView('dashboard');
    console.log(`${action} successful for UID: ${data.userId}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setIsLoading(false);
  }
};

const handlePasswordReset = async (email: string) => {
  setIsLoading(true);
  try {
    const res = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Failed to request password reset.");
      return;
    }

    alert(`${data.message}\n(Check console for preview URL)`);
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Check console.");
  } finally {
    setIsLoading(false);
  }
};



    // Project/Team actions just log the action
    const handleCreateProject = (title: string) => {
        alert(`Project "${title}" created (MOCK).`);
        console.log(`MOCK: Created project "${title}"`);
        const newProject = {
            id: Date.now().toString(),
            title: title,
            authorId: MOCK_UID,
            surveyCriteria: RATING_CRITERIA,
            teams: [],
            ratings: [],
            status: 'Draft',
        };
        setProjects(prev => [...prev, newProject]);
        setCurrentProjectId(newProject.id);
        setView('review');
    };

    const handleAddTeam = (teamName: string, memberIds: string) => {
        alert(`Team "${teamName}" added (MOCK) with IDs: ${memberIds}`);
        console.log(`MOCK: Added team ${teamName} with members: ${memberIds}`);
    };

    // The rest of the logic remains as placeholders
    // const calculateAggregatedResults = () => ({});
    // const aggregatedResults = useMemo(() => calculateAggregatedResults(currentProject), [currentProject]);
    
    // --- UI Components ---
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-xl font-semibold text-indigo-600">Processing Request...</div>
            </div>
        );
    }

    const Header = () => (
        <header className="flex justify-between items-center p-4 bg-white border-b shadow-md sticky top-0 z-10">
            <h1 className="text-3xl font-bold text-indigo-700 cursor-pointer" onClick={() => setView(userId ? 'dashboard' : 'home')}>PeerEval</h1>
            
            {userId ? (
                // Logged In State
                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-sm font-medium text-gray-600 rounded-full bg-indigo-100 px-3 py-1">
                        <User className="w-4 h-4 mr-2" />
                        UID: {userId.substring(0, 8)}... (MOCK)
                    </div>
                    <button
                        onClick={() => { setCurrentProjectId(null); setView('dashboard'); }}
                        className="p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition flex items-center"
                    >
                        <Users className="w-5 h-5 inline mr-1" /> Dashboard
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition"
                    >
                        <LogIn className="w-5 h-5 mr-1" /> Logout
                    </button>
                </div>
            ) : (
                // Logged Out State
                <button
                    onClick={() => setView('auth')}
                    className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-100 px-4 py-2 rounded-lg hover:bg-indigo-200 transition shadow-sm"
                >
                    <UserPlus className="w-5 h-5 mr-1" /> Get Started
                </button>
            )}
        </header>
    );

    // --- 1. Home Page Component ---
    const HomePage = () => (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] bg-gray-50 p-8">
            <div className="text-center w-full max-w-2xl bg-white p-12 rounded-2xl shadow-2xl border border-indigo-100">
                <HomeIcon className="w-16 h-16 mx-auto text-indigo-500 mb-6" />
                <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
                    Welcome to PeerEval System
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                    Frontend structure ready for integration with your Next.js backend.
                </p>
                
                <button
                    onClick={() => setView('auth')}
                    className="bg-indigo-600 text-white px-8 py-3 text-lg font-bold rounded-xl hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg"
                >
                    Create Account or Log In
                </button>
            </div>
        </div>
    );


    // --- 2. Auth Page Component (Signup/Login) ---
    const AuthView = () => {
        const [isRegistering, setIsRegistering] = useState(false);
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState('');
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setError('');
            
            if (email.length < 5 || password.length < 6) {
                setError("Please enter valid email and a password of at least 6 characters.");
                return;
            }

            // Call mock auth action
            handleAuthAction(isRegistering ? 'register' : 'login', email, password);
        };
        
        const handleResetClick = () => {
            const inputEmail = prompt("Enter your email to mock a password reset link:");
            if (inputEmail) {
                handlePasswordReset(inputEmail);
            }
        };


        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-gray-100">
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-indigo-200">
                    <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6 flex items-center justify-center">
                        {isRegistering ? <UserPlus className="w-6 h-6 mr-2" /> : <Lock className="w-6 h-6 mr-2" />}
                        {isRegistering ? 'Register Account (Story 1.1)' : 'Login Account (Story 1.2)'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 font-semibold"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 font-semibold"
                                required
                            />
                        </div>
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 transition disabled:bg-gray-400 shadow-md"
                        >
                            {isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm space-y-2">
                        <button
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                            className="block w-full text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register Here'}
                        </button>
                        {!isRegistering && (
                             <button
                                onClick={handleResetClick}
                                className="block w-full text-gray-500 hover:text-gray-700 font-medium pt-2"
                             >
                                 Forgot Password? (Story 1.3)
                             </button>
                        )}
                         <button
                            onClick={() => setView('home')}
                            className="block w-full text-gray-500 hover:text-gray-700 font-medium pt-2"
                         >
                             &larr; Back to Home
                         </button>
                    </div>
                </div>
            </div>
        );
    };


    // --- Placeholder Components for Logged-in State ---
    const Dashboard = () => (
        <div className="p-8 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Your Dashboard, {userId?.substring(0, 8)}... (MOCK)</h2>
            <p className="text-xl text-gray-600 mb-8">
                **Sprint 1 Status:** Frontend shell ready. Implement project creation here (Story 2.1).
            </p>
            <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
                Logout
            </button>
        </div>
    );

    const ReviewScreen = () => <div>Review Screen Placeholder</div>;
    const RatingView = () => <div>Rating View Placeholder</div>;
    const ReportScreen = () => <div>Report Screen Placeholder</div>;


    // --- Main Renderer ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <script src="https://cdn.tailwindcss.com"></script>
            <Header />
            <main>
                {view === 'home' && <HomePage />}
                {view === 'auth' && <AuthView />}
                {view === 'dashboard' && userId && <Dashboard />}
                {/* Other views will be rendered here upon implementation */}
            </main>
        </div>
    );
}
