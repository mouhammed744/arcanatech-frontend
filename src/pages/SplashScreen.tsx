import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import logoImg from '@/assets/logo.jpg';

/* ═══════════════════════════════════════════════
   3D ANIMATED SPLASH SCREEN — ARCANA TECH
   - 3D background: particles, orbit rings, stars
   - Logo: CSS 3D-animated with glow + float
   - Cyan/teal color theme matching the logo
   ═══════════════════════════════════════════════ */

// ─── Floating particles (cyan-themed) ───
function Particles({ count = 100 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 16,
        z: (Math.random() - 0.5) * 12,
        speed: 0.15 + Math.random() * 0.35,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.offset) * 0.5,
        p.y + Math.cos(t * p.speed + p.offset) * 0.5,
        p.z
      );
      const s = 0.025 + Math.sin(t * 2 + p.offset) * 0.012;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#00E5FF" transparent opacity={0.45} />
    </instancedMesh>
  );
}

// ─── Orbit ring ───
function OrbitRing({ radius = 3, speed = 0.5, color = '#00BCD4', tilt = 0 }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    ref.current.rotation.z = state.clock.getElapsedTime() * speed;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 16, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} />
    </mesh>
  );
}

// ─── Camera drift ───
function CameraRig() {
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.08) * 0.2;
    camera.position.y = Math.sin(t * 0.1) * 0.15;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Main Splash Screen ───
export const SplashScreen = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        const increment = prev < 60 ? 1.8 : prev < 85 ? 1.2 : 0.8;
        return Math.min(prev + increment, 100);
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => navigate('/login', { replace: true }), 800);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [progress, navigate]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] overflow-hidden"
        initial={{ opacity: 1 }}
        animate={{ opacity: fadeOut ? 0 : 1 }}
        transition={{ duration: 0.8 }}
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0A1A2E 0%, #060E1A 50%, #040810 100%)',
        }}
      >
        {/* 3D Background Canvas */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 40 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={null}>
              <Particles />
              <OrbitRing radius={3.5} speed={0.2} color="#00E5FF" tilt={0.4} />
              <OrbitRing radius={4.2} speed={-0.15} color="#0097A7" tilt={-0.25} />
              <OrbitRing radius={5} speed={0.1} color="#37474F" tilt={0.15} />
              <Stars radius={60} depth={50} count={1500} factor={2.5} saturation={0.2} fade speed={0.6} />
              <CameraRig />
            </Suspense>
          </Canvas>
        </div>

        {/* Centered logo with 3D perspective animation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotateX: 30, rotateY: -60 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, rotateY: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
          >
            {/* Outer glow pulse */}
            <div
              className="absolute -inset-16 rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(0,229,255,0.25) 0%, rgba(0,188,212,0.1) 40%, transparent 70%)',
                animation: 'glowPulse 3s ease-in-out infinite',
              }}
            />

            {/* Inner glow ring */}
            <div
              className="absolute -inset-6 rounded-full blur-xl"
              style={{
                background: 'radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 60%)',
                animation: 'glowPulse 3s ease-in-out infinite 0.5s',
              }}
            />

            {/* 3D Logo image — floats, rotates in 3D, with cyan neon glow */}
            <motion.div
              className="relative z-10"
              style={{
                width: 280,
                height: 280,
                transformStyle: 'preserve-3d',
                WebkitMaskImage: 'radial-gradient(ellipse 58% 55% at 50% 45%, black 45%, transparent 78%)',
                maskImage: 'radial-gradient(ellipse 58% 55% at 50% 45%, black 45%, transparent 78%)',
              }}
              animate={{
                y: [0, -12, 0],
                rotateY: [0, 8, 0, -8, 0],
                rotateX: [0, -3, 0, 3, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{
                y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
                rotateY: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
                rotateX: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <img
                src={logoImg}
                alt="ARCANA TECH"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  mixBlendMode: 'screen',
                  filter: 'contrast(1.5) brightness(1.2) drop-shadow(0 0 40px rgba(0,229,255,0.5)) drop-shadow(0 0 80px rgba(0,229,255,0.25))',
                }}
              />
            </motion.div>

            {/* Reflection/floor glow */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-48 h-6 rounded-full blur-2xl"
              style={{
                background: 'radial-gradient(ellipse, rgba(0,229,255,0.2) 0%, transparent 70%)',
                animation: 'glowPulse 3s ease-in-out infinite 1s',
              }}
            />
          </motion.div>

          {/* CSS keyframes for glow */}
          <style>{`
            @keyframes glowPulse {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
          `}</style>
        </div>

        {/* Bottom overlay: title + progress */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 pointer-events-none">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl font-extrabold text-white mb-2 tracking-tight">
              ARCANA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
                TECH
              </span>
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">
              Système de contrôle d'accès intelligent
            </p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-72"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">Chargement</span>
              <span className="text-xs text-slate-500 font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #00BCD4, #00E5FF, #B2EBF2)',
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-xs text-slate-700 mt-6"
          >
            &copy; {new Date().getFullYear()} ARCANA TECH — Tous droits réservés
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
