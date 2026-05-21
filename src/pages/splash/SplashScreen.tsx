import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Shield } from 'lucide-react';

// ─── Modèle Bâtiment Universitaire ────────────────────────────────────────────
function BuildingWireframe({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null!);

  // Rotation douce
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
  });

  const laserMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#00d4ff'),
    transparent: true,
    opacity: Math.min(1, progress * 2),
  });

  const glowMat = new THREE.LineBasicMaterial({
    color: new THREE.Color('#60efff'),
    transparent: true,
    opacity: Math.min(0.3, progress * 0.6),
    linewidth: 2,
  });

  // ── Géométrie bâtiment principal ──────────────────────────────────
  const buildingGeo = new THREE.BoxGeometry(2, 3, 1.5);
  const buildingEdges = new THREE.EdgesGeometry(buildingGeo);

  // ── Aile gauche ───────────────────────────────────────────────────
  const wingLGeo = new THREE.BoxGeometry(0.8, 2, 1.5);
  const wingLEdges = new THREE.EdgesGeometry(wingLGeo);

  // ── Aile droite ───────────────────────────────────────────────────
  const wingRGeo = new THREE.BoxGeometry(0.8, 2, 1.5);
  const wingREdges = new THREE.EdgesGeometry(wingRGeo);

  // ── Toit triangulaire ─────────────────────────────────────────────
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.2, 0);
  roofShape.lineTo(0, 0.8);
  roofShape.lineTo(1.2, 0);
  roofShape.lineTo(-1.2, 0);
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, { depth: 1.5, bevelEnabled: false });
  const roofEdges = new THREE.EdgesGeometry(roofGeo);

  // ── Colonnades ────────────────────────────────────────────────────
  const colGeo = new THREE.CylinderGeometry(0.06, 0.06, 2, 6);
  const colEdges = new THREE.EdgesGeometry(colGeo);
  const colPositions = [-0.6, 0, 0.6];

  // ── Fenêtres ──────────────────────────────────────────────────────
  const winGeo = new THREE.BoxGeometry(0.25, 0.35, 0.05);
  const winEdges = new THREE.EdgesGeometry(winGeo);
  const windowPositions = [
    [-0.5, 0.6], [0, 0.6], [0.5, 0.6],
    [-0.5, 0],   [0, 0],   [0.5, 0],
    [-0.5, -0.6],[0, -0.6],[0.5, -0.6],
  ];

  // ── Dôme central ─────────────────────────────────────────────────
  const domeGeo = new THREE.SphereGeometry(0.35, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeEdges = new THREE.EdgesGeometry(domeGeo);

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Corps principal */}
      <lineSegments geometry={buildingEdges} material={laserMat} position={[0, 0, 0]} />
      <lineSegments geometry={buildingEdges} material={glowMat} position={[0, 0, 0]} />

      {/* Aile gauche */}
      {progress > 0.2 && (
        <>
          <lineSegments geometry={wingLEdges} material={laserMat} position={[-1.4, -0.5, 0]} />
          <lineSegments geometry={wingLEdges} material={glowMat} position={[-1.4, -0.5, 0]} />
        </>
      )}

      {/* Aile droite */}
      {progress > 0.3 && (
        <>
          <lineSegments geometry={wingREdges} material={laserMat} position={[1.4, -0.5, 0]} />
          <lineSegments geometry={wingREdges} material={glowMat} position={[1.4, -0.5, 0]} />
        </>
      )}

      {/* Toit */}
      {progress > 0.4 && (
        <>
          <lineSegments geometry={roofEdges} material={laserMat} position={[-1.2, 1.5, -0.75]} />
          <lineSegments geometry={roofEdges} material={glowMat} position={[-1.2, 1.5, -0.75]} />
        </>
      )}

      {/* Dôme */}
      {progress > 0.55 && (
        <>
          <lineSegments geometry={domeEdges} material={laserMat} position={[0, 2, 0]} />
          <lineSegments geometry={domeEdges} material={glowMat} position={[0, 2, 0]} />
        </>
      )}

      {/* Colonnades */}
      {progress > 0.65 &&
        colPositions.map((x, i) => (
          <group key={i}>
            <lineSegments geometry={colEdges} material={laserMat} position={[x, -0.5, 0.78]} />
            <lineSegments geometry={colEdges} material={glowMat} position={[x, -0.5, 0.78]} />
          </group>
        ))}

      {/* Fenêtres */}
      {progress > 0.75 &&
        windowPositions.map(([wx, wy], i) => (
          <group key={i}>
            <lineSegments geometry={winEdges} material={laserMat} position={[wx, wy, 0.78]} />
            <lineSegments geometry={winEdges} material={glowMat} position={[wx, wy, 0.78]} />
          </group>
        ))}

      {/* Particules lumineuses flottantes */}
      {progress > 0.5 && <FloatingParticles />}
    </group>
  );
}

// ─── Particules lumineuses ─────────────────────────────────────────────────────
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null!);

  const particlesGeo = new THREE.BufferGeometry();
  const count = 60;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={pointsRef} geometry={particlesGeo}>
      <pointsMaterial color="#00d4ff" size={0.03} transparent opacity={0.6} />
    </points>
  );
}

// ─── Composant principal SplashScreen ─────────────────────────────────────────
interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [showText, setShowText] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Animation du tracé : 0 → 1 en 3 secondes
    const startTime = Date.now();
    const duration = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p >= 1) {
        clearInterval(interval);
        // Apparition du texte à 100%
        setTimeout(() => setShowText(true), 200);
        // Fondu sortie après 4.5s
        setTimeout(() => setFadeOut(true), 1500);
        // Navigate après 5s
        setTimeout(() => onComplete(), 2000);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#020B18] flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Glow central */}
          <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          {/* Canvas 3D */}
          <div className="w-full h-96 relative">
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 1.5, 6]} fov={45} />
              <ambientLight intensity={0.1} />
              <pointLight position={[5, 5, 5]} color="#00d4ff" intensity={2} />
              <pointLight position={[-5, -3, -5]} color="#3b82f6" intensity={1} />
              <BuildingWireframe progress={progress} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>

            {/* Laser scan line effect */}
            <motion.div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none"
              initial={{ top: '0%', opacity: 0 }}
              animate={{
                top: [`${0}%`, `${100}%`],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 3,
                ease: 'linear',
                times: [0, 0.05, 0.95, 1],
              }}
            />
          </div>

          {/* Texte */}
          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-center mt-4 relative z-10"
              >
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Shield size={22} className="text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-white tracking-wider">
                    Uni<span className="text-cyan-400">Access</span>
                  </h1>
                </div>
                <p className="text-slate-400 text-sm tracking-widest uppercase">
                  Système de contrôle d'accès intelligent
                </p>

                {/* Loading bar */}
                <div className="mt-6 w-64 mx-auto h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-slate-600 text-xs mt-2 tracking-widest">INITIALISATION...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <p className="text-cyan-400/40 text-xs font-mono">
              {Math.round(progress * 100)}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
