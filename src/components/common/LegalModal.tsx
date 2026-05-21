import { useEffect, useCallback } from 'react';
import { X, Shield, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Types ─────────────────────────────────────────────────── */
export type LegalType = 'terms' | 'privacy' | null;

/* ── Content ───────────────────────────────────────────────── */
const legalContent: Record<
  'terms' | 'privacy',
  {
    icon: typeof Shield;
    title: string;
    lastUpdate: string;
    sections: { heading: string; text: string }[];
  }
> = {
  terms: {
    icon: FileText,
    title: "Conditions Générales d'Utilisation",
    lastUpdate: '1er mars 2026',
    sections: [
      {
        heading: '1. Objet',
        text: "Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme ARCANA TECH, un système de contrôle d'accès et de gestion universitaire développé pour les établissements d'enseignement supérieur.",
      },
      {
        heading: '2. Accès à la plateforme',
        text: "L'accès à l'espace d'administration est réservé au personnel autorisé de l'établissement. Chaque utilisateur dispose d'identifiants personnels et s'engage à ne pas les communiquer à des tiers. L'établissement est responsable de la gestion des droits d'accès attribués à ses agents.",
      },
      {
        heading: '3. Utilisation des services',
        text: "L'utilisateur s'engage à utiliser la plateforme conformément à sa destination, à savoir la gestion des accès, le suivi de la présence, la gestion des emplois du temps et l'administration des données étudiantes. Toute utilisation frauduleuse ou abusive pourra entraîner la suspension immédiate du compte.",
      },
      {
        heading: '4. Propriété intellectuelle',
        text: "L'ensemble des éléments de la plateforme ARCANA TECH (logiciel, interface, algorithmes, documentation) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, modification ou distribution non autorisée est strictement interdite.",
      },
      {
        heading: '5. Disponibilité du service',
        text: "ARCANA TECH s'efforce d'assurer une disponibilité maximale de la plateforme. Toutefois, des interruptions planifiées pour maintenance ou des incidents techniques peuvent survenir. L'utilisateur sera informé dans la mesure du possible de toute interruption programmée.",
      },
      {
        heading: '6. Responsabilité',
        text: "ARCANA TECH ne saurait être tenu responsable des dommages indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la plateforme. L'utilisateur est responsable de la véracité et de l'exactitude des données qu'il saisit dans le système.",
      },
      {
        heading: '7. Modification des CGU',
        text: "ARCANA TECH se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle. La poursuite de l'utilisation de la plateforme après modification vaut acceptation des nouvelles conditions.",
      },
    ],
  },
  privacy: {
    icon: Shield,
    title: 'Politique de Confidentialité',
    lastUpdate: '1er mars 2026',
    sections: [
      {
        heading: '1. Collecte des données',
        text: "Dans le cadre de son fonctionnement, ARCANA TECH collecte des données personnelles relatives aux étudiants (nom, prénom, email, numéro étudiant, photo, identifiant RFID), au personnel administratif (nom, prénom, email, rôle) ainsi que des données d'accès (horodatages d'entrée et de sortie, localisation des bornes).",
      },
      {
        heading: '2. Finalité du traitement',
        text: "Les données collectées sont traitées aux fins suivantes : gestion des accès aux locaux universitaires, suivi de la présence et de la ponctualité, établissement de statistiques anonymisées, gestion administrative des étudiants et du personnel, et sécurisation des infrastructures de l'établissement.",
      },
      {
        heading: '3. Base légale',
        text: "Le traitement des données repose sur l'exécution de la mission de service public de l'établissement d'enseignement, le respect des obligations légales en matière de sécurité, et le consentement de l'utilisateur pour les données facultatives (photo de profil).",
      },
      {
        heading: '4. Durée de conservation',
        text: "Les données personnelles sont conservées pendant la durée de la scolarité de l'étudiant ou du contrat de l'agent administratif, augmentée d'une période d'archivage de 2 ans. Les logs d'accès sont conservés pendant 12 mois glissants.",
      },
      {
        heading: '5. Sécurité des données',
        text: "ARCANA TECH met en œuvre des mesures techniques et organisationnelles appropriées pour protéger les données : chiffrement des communications (TLS), authentification forte (OAuth 2.0), contrôle d'accès basé sur les rôles, journalisation des actions administratives et sauvegardes régulières.",
      },
      {
        heading: '6. Droits des personnes',
        text: "Conformément à la réglementation en vigueur, toute personne dispose d'un droit d'accès, de rectification, de suppression, de limitation du traitement et de portabilité de ses données. Ces droits peuvent être exercés en contactant l'administrateur de l'établissement ou le délégué à la protection des données.",
      },
      {
        heading: '7. Partage des données',
        text: "Les données collectées ne sont partagées avec aucun tiers en dehors de l'établissement. Elles sont hébergées sur des serveurs sécurisés et ne font l'objet d'aucun transfert en dehors du territoire national sans le consentement explicite de l'utilisateur.",
      },
    ],
  },
};

/* ── Component ─────────────────────────────────────────────── */
export const LegalModal = ({
  type,
  onClose,
}: {
  type: 'terms' | 'privacy';
  onClose: () => void;
}) => {
  const content = legalContent[type];
  const Icon = content.icon;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-5 shrink-0"
          style={{
            borderBottom: '1px solid var(--border-color)',
            background:
              'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, transparent 100%)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.05))',
              border: '1px solid rgba(0,212,255,0.2)',
            }}
          >
            <Icon size={20} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-bold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {content.title}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--text-muted)' }}
            >
              Dernière mise à jour : {content.lastUpdate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6 custom-scrollbar">
          {content.sections.map((section, i) => (
            <motion.div
              key={section.heading}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <ChevronRight
                  size={14}
                  style={{ color: 'var(--accent)' }}
                />
                <h3
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {section.heading}
                </h3>
              </div>
              <p
                className="text-sm leading-relaxed pl-5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {section.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ARCANA TECH &copy; {new Date().getFullYear()}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
            style={{
              background: 'var(--accent-gradient)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            J'ai compris
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
