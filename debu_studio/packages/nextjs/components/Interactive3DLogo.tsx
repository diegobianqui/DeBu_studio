"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ModelMesh = ({ targetRotation, theme }: { targetRotation: React.MutableRefObject<{ x: number; y: number }>; theme?: string }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  // Dark mode: cyan, Light mode: dark blue/purple
  const darkColor = "#27C8F5";
  const lightColor = "#1E3A5F";
  const color = theme === "light" ? lightColor : darkColor;

  const darkEmissive = "#1BA8D5";
  const lightEmissive = "#162D47";
  const emissive = theme === "light" ? lightEmissive : darkEmissive;

  // Load GLB model
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load("/base.glb", (gltf) => {
      let geo: THREE.BufferGeometry | null = null;

      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh && !geo) {
          geo = (child.geometry as THREE.BufferGeometry).clone();
          geo.center();
          geo.scale(3.2, 3.2, 3.2); // 20% smaller (4 * 0.8 = 3.2)
        }
      });

      if (geo) {
        setGeometry(geo);
      }
    });
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      // Smoothly interpolate to target rotation
      meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.15;
      meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.15;
    }
  });

  if (!geometry) return null;

  return (
    <group ref={meshRef}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhongMaterial color={color} emissive={emissive} emissiveIntensity={0.3} shininess={100} />
      </mesh>
    </group>
  );
};

export const Interactive3DLogo = ({ size = 200 }: { size?: number }) => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  const returnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate rotation based on mouse position relative to center
    const deltaX = (mouseY - centerY) / centerY * 0.5; // Vertical mouse movement rotates around X
    const deltaY = (mouseX - centerX) / centerX * 0.5; // Horizontal mouse movement rotates around Y

    targetRotation.current = { x: deltaX, y: deltaY };

    // Clear any existing timeout
    if (returnTimeoutRef.current) {
      clearTimeout(returnTimeoutRef.current);
    }

    // Set timeout to return to original position
    returnTimeoutRef.current = setTimeout(() => {
      targetRotation.current = { x: 0, y: 0 };
    }, 500);
  };

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ width: size, height: size }}
      onMouseMove={handleMouseMove}
    >
      <Canvas 
        className="w-full h-full" 
        style={{ cursor: "grab" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ModelMesh targetRotation={targetRotation} theme={theme} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
      </Canvas>
    </div>
  );
};

export default Interactive3DLogo;
