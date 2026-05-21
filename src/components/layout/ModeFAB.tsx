import { motion } from 'framer-motion';
import { Sparkles, GraduationCap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleUiMode, type UiMode } from '@/store/slices/uiSlice';

const labels: Record<UiMode, { title: string; sub: string }> = {
  focus: { title: 'Mode Focus', sub: 'Cours · planning · données' },
  campus: { title: 'Mode Campus', sub: 'RFID · flux · temps réel' },
};

export const ModeFAB = () => {
  const mode = useAppSelector((s) => s.ui.uiMode);
  const dispatch = useAppDispatch();
  const isCampus = mode === 'campus';
  const next = labels[isCampus ? 'focus' : 'campus'];

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2 pointer-events-none">
      <motion.button
        type="button"
        layoutId="mode-fab"
        onClick={() => dispatch(toggleUiMode())}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        title={`Basculer vers ${next.title}`}
        className="pointer-events-auto flex items-center gap-3 rounded-full pl-4 pr-2 py-2.5 border border-white/25 text-left max-w-[min(100vw-2rem,320px)]"
        style={{
          background: isCampus
            ? 'linear-gradient(145deg, #10B981 0%, #06B6D4 38%, #EC4899 100%)'
            : 'linear-gradient(145deg, #0EA5A4 0%, #14B8A6 42%, #D946EF 100%)',
          boxShadow: isCampus
            ? '0 18px 50px rgba(16,185,129,0.44), 0 0 0 1px rgba(255,255,255,0.15) inset, 0 1px 0 rgba(255,255,255,0.25) inset'
            : '0 18px 50px rgba(14,165,164,0.42), 0 0 0 1px rgba(255,255,255,0.15) inset, 0 1px 0 rgba(255,255,255,0.25) inset',
        }}
      >
        <motion.div
          key={mode}
          initial={{ rotate: -12, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md"
        >
          {isCampus ? <Sparkles className="h-5 w-5 text-white" /> : <GraduationCap className="h-5 w-5 text-white" />}
        </motion.div>
        <div className="pr-2 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{labels[mode].title}</p>
          <p className="text-[13px] font-bold text-white truncate">{labels[mode].sub}</p>
        </div>
        <span className="text-[10px] font-medium text-white/80 px-2 py-1 rounded-full bg-black/15 shrink-0">
          {isCampus ? '●' : '○'} tap
        </span>
      </motion.button>
    </div>
  );
};
