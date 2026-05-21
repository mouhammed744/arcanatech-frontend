import { useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { User, Lock, Mail, Shield, ArrowRight, ShieldCheck, ShieldOff, Camera, Trash2, Loader2, Building2, MapPin } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppSelector, useAppDispatch } from '@/store';
import { setUser } from '@/store/slices/authSlice';
import { authService } from '@/services/auth.service';

export const ProfilePage = () => {
  usePageTitle('Mon profil');
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 2 Mo.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format accepté : JPG, PNG ou WebP.');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const { avatar } = await authService.uploadAvatar(file);
      if (user) {
        dispatch(setUser({ ...user, avatar }));
      }
    } catch {
      setError('Erreur lors de l\'upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user, dispatch]);

  const handleDeleteAvatar = useCallback(async () => {
    setUploading(true);
    setError('');
    try {
      await authService.deleteAvatar();
      if (user) {
        dispatch(setUser({ ...user, avatar: undefined }));
      }
    } catch {
      setError('Erreur lors de la suppression.');
    } finally {
      setUploading(false);
    }
  }, [user, dispatch]);

  return (
    <div>
      <PageHeader
        title="Mon profil"
        breadcrumbs={[{ label: 'Tableau de bord', to: '/dashboard' }, { label: 'Mon profil' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Avatar avec upload */}
            <div className="relative group mb-4">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden"
                style={{ background: user?.avatar ? 'transparent' : 'var(--accent-gradient)', boxShadow: 'var(--shadow-accent)' }}
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</>
                )}
              </div>

              {/* Overlay au hover */}
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 size={22} className="text-white animate-spin" />
                ) : (
                  <Camera size={22} className="text-white" />
                )}
              </button>

              {/* Bouton supprimer */}
              {user?.avatar && !uploading && (
                <button
                  onClick={handleDeleteAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Supprimer la photo"
                >
                  <Trash2 size={13} />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 mb-2">{error}</p>
            )}

            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
              Cliquez sur la photo pour la modifier
            </p>

            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {user?.firstName} {user?.lastName}
            </h2>
            <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium mt-2 capitalize badge-accent">
              <Shield size={12} /> {user?.role}
            </span>
          </div>
          <div className="mt-6 space-y-3 pt-6" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>ID: {String(user?.id ?? '').slice(0, 8)}</span>
            </div>
            {user?.university && (
              <div className="flex items-start gap-3 text-sm pt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
                <Building2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                <div>
                  <span className="font-medium block" style={{ color: 'var(--text-secondary)' }}>
                    {user.university.name}
                  </span>
                  {user.university.city && (
                    <span className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <MapPin size={11} />
                      {user.university.city}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Prénom</label>
                <input
                  type="text"
                  value={user?.firstName ?? ''}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Nom</label>
                <input
                  type="text"
                  value={user?.lastName ?? ''}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                  }}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                  }}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Université</label>
                <div
                  className="w-full px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
                  style={{
                    border: '1px solid var(--border-input)',
                    backgroundColor: 'var(--bg-input)',
                  }}
                >
                  <Building2 size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  {user?.university ? (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {user.university.name}
                      {user.university.city && (
                        <span style={{ color: 'var(--text-muted)' }}> — {user.university.city}</span>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Non renseignée</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security section */}
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Sécurité du compte</h3>

            <div className="space-y-4">
              {/* Change password link */}
              <Link
                to="/profile/change-password"
                className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-[var(--bg-card-hover)] group"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10">
                    <Lock size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Mot de passe</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Modifier votre mot de passe de connexion</p>
                  </div>
                </div>
                <ArrowRight size={18} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* 2FA status */}
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{ border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
                    <ShieldCheck size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Authentification à deux facteurs</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ajoutez une couche de sécurité supplémentaire</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium bg-slate-500/10">
                  <ShieldOff size={12} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Désactivé</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
