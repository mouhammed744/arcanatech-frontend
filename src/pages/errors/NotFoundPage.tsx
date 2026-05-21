import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';
export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={40} className="text-slate-400" />
      </div>
      <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-slate-800 mb-2">Page introuvable</h2>
      <p className="text-slate-500 mb-8 max-w-md">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <button onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors">
        <Home size={16} /> Retour au tableau de bord
      </button>
    </div>
  );
};
