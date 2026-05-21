import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { useOnboarding, ONBOARDING_STEPS } from '@/hooks/useOnboarding';
import { useAppSelector } from '@/store';

function Tooltip({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: {
  step: (typeof ONBOARDING_STEPS)[number];
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  useEffect(() => {
    const target = document.querySelector(step.targetSelector);
    if (!target || !tooltipRef.current) return;

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 14;

    let top = 0;
    let left = 0;

    switch (step.placement) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'top':
        top = rect.top - tooltipRect.height - gap;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + gap;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - gap;
        break;
    }

    // Clamp within viewport
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipRect.width - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tooltipRect.height - 12));

    setPos({ top, left });
  }, [step]);

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[10001] w-80 rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-2"
      style={{
        top: pos.top,
        left: pos.left,
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(99,102,241,0.15)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 p-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
      >
        <X size={14} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Step counter */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full badge-accent">
          <Sparkles size={10} />
          {currentStep + 1}/{totalSteps}
        </div>
      </div>

      {/* Content */}
      <h4 className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {step.title}
      </h4>
      <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
        {step.description}
      </p>

      {/* Progress bar */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i <= currentStep ? '#6366F1' : 'var(--bg-muted)',
            }}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-xs font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          Passer la visite
        </button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <ChevronLeft size={12} /> Précédent
            </button>
          )}
          <button
            onClick={onNext}
            className="flex items-center gap-1 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all btn-accent"
          >
            {isLast ? 'Terminer' : 'Suivant'} {!isLast && <ChevronRight size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTour() {
  const { user } = useAppSelector((state) => state.auth);
  const { pathname } = useLocation();

  const isDashboard = pathname === '/' || pathname === '/dashboard';

  const { isActive, currentStep, totalSteps, step, nextStep, prevStep, skipOnboarding } =
    useOnboarding(user?.id);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !step || !isDashboard) return;

    const target = document.querySelector(step.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      setHighlight(rect);
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      setHighlight(null);
    }
  }, [isActive, step, isDashboard]);

  // N'affiche rien si le tour est inactif OU si on n'est pas sur le dashboard
  if (!isActive || !step || !isDashboard) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9999]" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />

      {/* Spotlight cutout */}
      {highlight && (
        <div
          className="fixed z-[10000] rounded-xl pointer-events-none"
          style={{
            top: highlight.top - 6,
            left: highlight.left - 6,
            width: highlight.width + 12,
            height: highlight.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            border: '2px solid rgba(99,102,241,0.5)',
          }}
        />
      )}

      {/* Tooltip */}
      <Tooltip
        step={step}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipOnboarding}
      />
    </>,
    document.body,
  );
}
