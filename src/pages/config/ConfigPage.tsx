import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Loader2, Clock, Bell, QrCode, Sun, Moon, Palette, ShieldCheck, Smartphone, Mail } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PageHeader } from '@/components/common/PageHeader';
import { configService } from '@/services/config.service';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleTheme, setAccentColor, setUiDensity } from '@/store/slices/uiSlice';
import type { AppConfig } from '@/types';

const accentOptions = [
  { value: 'indigo' as const, color: '#6366F1', label: 'Indigo' },
  { value: 'blue' as const, color: '#2563EB', label: 'Bleu' },
  { value: 'sky' as const, color: '#0EA5E9', label: 'Ciel' },
  { value: 'emerald' as const, color: '#10B981', label: 'Émeraude' },
  { value: 'amber' as const, color: '#F59E0B', label: 'Ambre' },
];

const densityOptions = [
  { value: 'compact' as const, label: 'Compact' },
  { value: 'normal' as const, label: 'Normal' },
  { value: 'comfortable' as const, label: 'Confortable' },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={enabled}
      className="w-12 h-7 rounded-full relative flex-shrink-0 transition-all duration-300"
      style={{
        background: enabled
          ? 'var(--accent-gradient)'
          : 'var(--bg-elevated)',
        border: '1px solid ' + (enabled ? 'transparent' : 'var(--border-color)'),
        boxShadow: enabled
          ? '0 4px 14px rgba(var(--accent-rgb),0.38), inset 0 1px 0 rgba(255,255,255,0.15)'
          : 'inset 0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-out"
        style={{
          left: enabled ? 'calc(100% - 24px)' : '4px',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      />
    </button>
  );
}

function ConfigCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card p-6 hover-lift">
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, iconBg, iconStyle, title, desc }: { icon: any; iconBg: string; iconStyle?: React.CSSProperties; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`} style={iconStyle}>
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
      </div>
    </div>
  );
}

export const ConfigPage = () => {
  usePageTitle('Configuration');
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { theme, accentColor, uiDensity } = useAppSelector((state) => state.ui);

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: configService.getConfig,
  });

  const [form, setForm] = useState<Partial<AppConfig>>({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'email' | 'both'>('totp');

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AppConfig>) => configService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const updateField = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Configuration"
        breadcrumbs={[{ label: 'Tableau de bord', to: '/dashboard' }, { label: 'Configuration' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConfigCard>
          <CardHeader icon={Clock} iconBg="bg-amber-500/10 text-amber-600" title="Marge de retard globale" desc="Tolérance avant de marquer un retard" />
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={30}
              value={form.globalLateMarginMinutes ?? 15}
              onChange={(e) => updateField('globalLateMarginMinutes', Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div
              className="flex items-center gap-1 px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)' }}
            >
              <input
                type="number"
                min={0}
                max={60}
                value={form.globalLateMarginMinutes ?? 15}
                onChange={(e) => updateField('globalLateMarginMinutes', Number(e.target.value))}
                className="w-12 text-center text-sm font-semibold bg-transparent focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>min</span>
            </div>
          </div>
        </ConfigCard>

        <ConfigCard>
          <CardHeader icon={Bell} iconBg="bg-rose-500/10 text-rose-600" title="Seuil d'alertes" desc="Notification si X retards en Y jours" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Nombre de retards</label>
              <input
                type="number"
                min={1}
                value={form.alertThresholdCount ?? 3}
                onChange={(e) => updateField('alertThresholdCount', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:outline-none"
                style={{
                  border: '1px solid var(--border-input)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>En combien de jours</label>
              <input
                type="number"
                min={1}
                value={form.alertThresholdDays ?? 7}
                onChange={(e) => updateField('alertThresholdDays', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:outline-none"
                style={{
                  border: '1px solid var(--border-input)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </ConfigCard>

        <ConfigCard>
          <CardHeader icon={Settings} iconBg="bg-sky-500/10 text-sky-600" title="Email administrateur" desc="Reçoit les alertes et rapports" />
          <input
            type="email"
            value={form.adminEmail ?? ''}
            onChange={(e) => updateField('adminEmail', e.target.value)}
            placeholder="admin@universite.bj"
            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:outline-none"
            style={{
              border: '1px solid var(--border-input)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
            }}
          />
        </ConfigCard>

        <ConfigCard>
          <CardHeader icon={QrCode} iconBg="bg-violet-500/10 text-violet-600" title="Fonctionnalités" desc="Activer/désactiver les modules" />
          <div className="space-y-4">
            {[
              { key: 'enableQrCode' as const, label: 'QR Code temporaire', desc: 'Permet aux étudiants de générer un QR code de secours' },
              { key: 'enableNfc' as const, label: 'Support NFC mobile', desc: 'Utiliser le téléphone comme badge NFC' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
                <Toggle enabled={!!form[key]} onChange={() => updateField(key, !form[key])} />
              </div>
            ))}
          </div>
        </ConfigCard>

        <ConfigCard>
          <CardHeader icon={ShieldCheck} iconBg="bg-emerald-500/10 text-emerald-600" title="Authentification à deux facteurs" desc="Sécurité renforcée pour tous les comptes" />
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Activer la 2FA</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exiger la vérification en deux étapes</p>
              </div>
              <Toggle enabled={twoFactorEnabled} onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} />
            </div>

            {twoFactorEnabled && (
              <div className="pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>MÉTHODE DE VÉRIFICATION</p>
                <div className="space-y-2">
                  {[
                    { value: 'totp' as const, label: 'Application TOTP', desc: 'Google Authenticator, Authy...', icon: Smartphone },
                    { value: 'email' as const, label: 'Code par email', desc: 'Envoyer un code à chaque connexion', icon: Mail },
                    { value: 'both' as const, label: 'Les deux', desc: 'TOTP + Email comme fallback', icon: ShieldCheck },
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTwoFactorMethod(value)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors"
                      style={{
                        border: twoFactorMethod === value ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                        backgroundColor: twoFactorMethod === value ? 'var(--accent-muted)' : 'transparent',
                      }}
                    >
                      <Icon size={18} style={{ color: twoFactorMethod === value ? 'var(--accent)' : 'var(--text-muted)' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ConfigCard>

        <ConfigCard>
          <CardHeader icon={Palette} iconBg="" iconStyle={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }} title="Apparence" desc="Personnalisez l'interface" />
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--text-muted)' }} /> : <Sun size={18} style={{ color: 'var(--text-muted)' }} />}
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Mode sombre</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {theme === 'dark' ? 'Interface sombre activée' : 'Interface claire activée'}
                  </p>
                </div>
              </div>
              <Toggle enabled={theme === 'dark'} onChange={() => dispatch(toggleTheme())} />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-4">
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Couleur d'accent</p>
              <div className="flex gap-3">
                {accentOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => dispatch(setAccentColor(opt.value))}
                    className="group flex flex-col items-center gap-1.5"
                    title={opt.label}
                  >
                    <div
                      className={`w-8 h-8 rounded-full transition-all ${
                        accentColor === opt.value ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: opt.color,
                        ['--tw-ring-color' as string]: accentColor === opt.value ? opt.color : undefined,
                      } as React.CSSProperties}
                    />
                    <span className="text-[10px]" style={{ color: accentColor === opt.value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-4">
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Densité de l'interface</p>
              <div className="flex gap-2">
                {densityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => dispatch(setUiDensity(opt.value))}
                    className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                    style={{
                      backgroundColor: uiDensity === opt.value ? 'var(--accent-muted)' : 'transparent',
                      color: uiDensity === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                      border: uiDensity === opt.value ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ConfigCard>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl disabled:opacity-50 btn-accent"
        >
          {updateMutation.isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Sauvegarde...</>
          ) : (
            <><Save size={16} /> Sauvegarder</>
          )}
        </button>
      </div>

      {updateMutation.isSuccess && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-xl font-medium text-sm shadow-xl animate-soft-fade"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff',
            boxShadow: '0 14px 40px rgba(16,185,129,0.35)',
          }}
        >
          Configuration enregistree
        </div>
      )}
    </div>
  );
};
