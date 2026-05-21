import { useState, useCallback, useEffect } from 'react';
import { consumeFreshLogin } from '@/lib/loginFlag';

const completedKey = (userId?: string | number) =>
  userId ? `onboarding_completed_${userId}` : null;

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans UniAccess !',
    description:
      "Découvrez votre espace d'administration pour gérer le contrôle d'accès de votre établissement.",
    targetSelector: '[data-onboarding="dashboard-title"]',
    placement: 'bottom',
  },
  {
    id: 'stats',
    title: 'Tableau de bord',
    description:
      'Suivez en temps réel la ponctualité, les présences et les statistiques clés de votre établissement.',
    targetSelector: '[data-onboarding="stat-cards"]',
    placement: 'bottom',
  },
  {
    id: 'sidebar-students',
    title: 'Gestion des étudiants',
    description:
      'Consultez la liste des étudiants, gérez leurs cartes RFID et suivez leur assiduité.',
    targetSelector: '[data-onboarding="sidebar-students"]',
    placement: 'right',
  },
  {
    id: 'sidebar-rfid',
    title: 'Accès RFID en temps réel',
    description:
      "Visualisez les événements d'accès en direct : entrées, sorties, tentatives refusées.",
    targetSelector: '[data-onboarding="sidebar-rfid"]',
    placement: 'right',
  },
  {
    id: 'sidebar-stats',
    title: 'Rapports et statistiques',
    description:
      'Générez des rapports détaillés sur la ponctualité, les retards et la fréquentation.',
    targetSelector: '[data-onboarding="sidebar-stats"]',
    placement: 'right',
  },
  {
    id: 'sidebar-config',
    title: 'Configuration du système',
    description:
      'Personnalisez les marges de retard, les alertes, le thème et les fonctionnalités activées.',
    targetSelector: '[data-onboarding="sidebar-config"]',
    placement: 'right',
  },
];

export function useOnboarding(userId?: string | number) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // consumeFreshLogin() est one-shot : retourne true une seule fois après login,
    // false sur tous les appels suivants (refresh, re-render, StrictMode double-invoke).
    const freshLogin = consumeFreshLogin();
    if (!freshLogin) return;

    const key = completedKey(userId);
    const alreadyDone = key ? localStorage.getItem(key) !== null : true;

    if (!alreadyDone) {
      setIsActive(true);
    }
  }, [userId]);

  const markDone = useCallback(() => {
    const key = completedKey(userId);
    if (key) localStorage.setItem(key, 'true');
  }, [userId]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= ONBOARDING_STEPS.length - 1) {
        markDone();
        setIsActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, [markDone]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipOnboarding = useCallback(() => {
    markDone();
    setIsActive(false);
    setCurrentStep(0);
  }, [markDone]);

  const restartOnboarding = useCallback(() => {
    const key = completedKey(userId);
    if (key) localStorage.removeItem(key);
    setIsActive(true);
    setCurrentStep(0);
  }, [userId]);

  return {
    isActive,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    step: ONBOARDING_STEPS[currentStep],
    nextStep,
    prevStep,
    skipOnboarding,
    restartOnboarding,
  };
}
