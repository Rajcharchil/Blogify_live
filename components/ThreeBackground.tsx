'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Particle field component
function ParticleField() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 5000;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorPalette = [
      new THREE.Color('#00d4ff'), // cyan
      new THREE.Color('#7c3aed'), // violet
      new THREE.Color('#06b6d4'), // teal
      new THREE.Color('#818cf8'), // indigo
      new THREE.Color('#34d399'), // emerald
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.04;
    meshRef.current.rotation.y = t * 0.06;
    meshRef.current.rotation.z = t * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// Floating geometric shapes
function FloatingOrbs() {
  const orbsRef = useRef<THREE.Group>(null);

  const orbs = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10 - 5,
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.7,
      speed: 0.2 + Math.random() * 0.5,
      offset: (i / 6) * Math.PI * 2,
      color: ['#7c3aed', '#06b6d4', '#34d399', '#818cf8', '#00d4ff', '#a78bfa'][i],
    }));
  }, []);

  useFrame((state) => {
    if (!orbsRef.current) return;
    const t = state.clock.getElapsedTime();
    orbsRef.current.children.forEach((child, i) => {
      const orb = orbs[i];
      child.position.y = orb.position[1] + Math.sin(t * orb.speed + orb.offset) * 1.5;
      child.position.x = orb.position[0] + Math.cos(t * orb.speed * 0.7 + orb.offset) * 0.8;
    });
  });

  return (
    <group ref={orbsRef}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position} scale={orb.scale}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial
            color={orb.color}
            transparent
            opacity={0.15}
            roughness={0.1}
            metalness={0.8}
            wireframe={Math.random() > 0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// Glowing ring
function Ring() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime();
    ringRef.current.rotation.x = t * 0.3;
    ringRef.current.rotation.z = t * 0.2;
    ringRef.current.position.z = -5 + Math.sin(t * 0.5) * 2;
  });

  return (
    <mesh ref={ringRef} position={[0, 0, -5]}>
      <torusGeometry args={[4, 0.05, 16, 100]} />
      <meshStandardMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={2} transparent opacity={0.6} />
    </mesh>
  );
}

function Ring2() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = state.clock.getElapsedTime();
    ringRef.current.rotation.y = t * 0.4;
    ringRef.current.rotation.x = Math.PI / 4;
  });

  return (
    <mesh ref={ringRef} position={[6, 2, -8]}>
      <torusGeometry args={[3, 0.03, 16, 100]} />
      <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} transparent opacity={0.4} />
    </mesh>
  );
}

// Camera movement on mouse
function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    camera.position.x += (mouse.current.x * 2 - camera.position.x) * 0.03;
    camera.position.y += (-mouse.current.y * 1.5 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#7c3aed" />
        <pointLight position={[-10, -10, 5]} intensity={1.5} color="#06b6d4" />
        <CameraController />
        <ParticleField />
        <FloatingOrbs />
        <Ring />
        <Ring2 />
      </Canvas>
    </div>
  );
}
