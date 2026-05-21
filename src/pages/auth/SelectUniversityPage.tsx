import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Building2, MapPin, CheckCircle2, ChevronRight,
  Loader2, AlertCircle,
} from 'lucide-react';
import apiClient from '@/services/api';
import { authService } from '@/services/auth.service';
import { useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';
import logoSrc from '@/assets/logo.svg';

interface University {
  id: number;
  name: string;
  code: string;
  city: string | null;
  logoUrl: string | null;
}

export default function SelectUniversityPage() {
  const navigate  = useNavigate();
  const dispatch  = useAppDispatch();
  const [search,      setSearch]      = useState('');
  const [selectedId,  setSelectedId]  = useState<number | null>(null);
  const [errorMsg,    setErrorMsg]    = useState('');

  // Fetch list of universities (public endpoint)
  const { data, isLoading } = useQuery({
    queryKey: ['universities-public'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: University[] }>('/universities');
      return res.data.data as University[];
    },
  });

  const universities: University[] = data ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return universities;
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.code.toLowerCase().includes(q) ||
        (u.city ?? '').toLowerCase().includes(q),
    );
  }, [universities, search]);

  const mutation = useMutation({
    mutationFn: (id: number) => authService.selectUniversity(id),
    onSuccess: (user) => {
      dispatch(setUser(user as any));
      navigate('/dashboard', { replace: true });
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.message ?? 'Une erreur est survenue. Veuillez réessayer.',
      );
    },
  });

  const handleSubmit = () => {
    if (!selectedId) return;
    setErrorMsg('');
    mutation.mutate(selectedId);
  };

  const selectedUniversity = universities.find((u) => u.id === selectedId);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #1E1B4B 100%)',
      }}
    >
      {/* Background decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-2xl"
      >
        {/* Header branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logoSrc} alt="ARCANA TECH" className="w-10 h-10" />
            <span className="text-white text-xl font-bold tracking-widest">ARCANA TECH</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Choisissez votre université
          </h1>
          <p className="text-slate-400 text-sm">
            Sélectionnez l'établissement auquel vous êtes rattaché pour accéder au tableau de bord.
          </p>
        </div>

        {/* Card container */}
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code ou ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
              }}
            />
          </div>

          {/* University list */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune université trouvée</p>
              </div>
            ) : (
              filtered.map((u) => {
                const isSelected = selectedId === u.id;
                return (
                  <motion.button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedId(u.id)}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: isSelected
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'rgba(30, 41, 59, 0.5)',
                      border: isSelected
                        ? '1px solid rgba(99, 102, 241, 0.6)'
                        : '1px solid rgba(99, 102, 241, 0.1)',
                    }}
                  >
                    {/* Logo / Icon */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: isSelected
                          ? 'rgba(99, 102, 241, 0.3)'
                          : 'rgba(99, 102, 241, 0.1)',
                      }}
                    >
                      {u.logoUrl ? (
                        <img
                          src={u.logoUrl}
                          alt={u.name}
                          className="w-8 h-8 object-contain rounded"
                        />
                      ) : (
                        <Building2
                          className="w-5 h-5"
                          style={{ color: isSelected ? '#818cf8' : '#64748b' }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold text-sm truncate"
                          style={{ color: isSelected ? '#e0e7ff' : '#cbd5e1' }}
                        >
                          {u.name}
                        </span>
                        <span
                          className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                          }}
                        >
                          {u.code}
                        </span>
                      </div>
                      {u.city && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-500">{u.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Check indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-4 px-4 py-3 rounded-xl text-sm text-red-400"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.15)' }}>
            {selectedUniversity && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-400 mb-3 text-center"
              >
                Université sélectionnée :{' '}
                <span className="text-indigo-300 font-medium">{selectedUniversity.name}</span>
              </motion.p>
            )}
            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedId || mutation.isPending}
              whileHover={{ scale: selectedId && !mutation.isPending ? 1.01 : 1 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{
                background:
                  selectedId && !mutation.isPending
                    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                    : 'rgba(99, 102, 241, 0.2)',
                color: selectedId ? '#fff' : '#64748b',
                cursor: selectedId && !mutation.isPending ? 'pointer' : 'not-allowed',
                boxShadow:
                  selectedId && !mutation.isPending
                    ? '0 4px 24px rgba(99, 102, 241, 0.35)'
                    : 'none',
              }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Accéder au tableau de bord
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} ARCANA TECH — Tous droits réservés
        </p>
      </motion.div>
    </div>
  );
}
