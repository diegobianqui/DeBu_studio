"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useGLTF } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Cache the Ethereum geometry globally
let cachedEthereumGeometry: THREE.BufferGeometry | null = null;

interface FloatingEthLogoProps {
  position: [number, number, number];
  speed: number;
  scale: number;
}

interface FloatingModelProps {
  position: [number, number, number];
  speed: number;
  scale: number;
  modelGeometry: THREE.BufferGeometry | null;
}

// Component to load and render the OBJ model
const FloatingOBJModel = ({ position, speed, scale, modelGeometry, theme }: FloatingModelProps & { theme?: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());

  // Dark mode: cyan, Light mode: dark blue/purple
  const darkColor = "#27C8F5";
  const lightColor = "#1E3A5F";
  const color = theme === "light" ? lightColor : darkColor;

  const darkEmissive = "#1BA8D5";
  const lightEmissive = "#162D47";
  const emissive = theme === "light" ? lightEmissive : darkEmissive;

  useFrame(() => {
    if (meshRef.current) {
      const elapsed = (Date.now() - startTime.current) * 0.001;
      meshRef.current.rotation.x += speed * 0.01;
      meshRef.current.rotation.y += speed * 0.008;
      meshRef.current.rotation.z += speed * 0.005;
      meshRef.current.position.y = position[1] + Math.sin(elapsed * speed) * 0.5;
    }
  });

  if (!modelGeometry) return null;

  return (
    <mesh 
      ref={meshRef} 
      position={position}
      scale={scale}
      geometry={modelGeometry}
      castShadow
      receiveShadow
    >
      <meshPhongMaterial 
        color={color}
        emissive={emissive}
        emissiveIntensity={0.3}
        shininess={100}
      />
    </mesh>
  );
};

// Create the exact Ethereum shape from the CodePen (cached)
const getEthereumGeometry = () => {
  if (cachedEthereumGeometry) return cachedEthereumGeometry;

  const makePart = (pts: number[][]) => {
    const g = new THREE.BufferGeometry().setFromPoints(
      pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );
    const index = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1];
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  };

  const gPartTop = makePart([
    [0, 1, 1], // pinnacle
    [0, -1, 0],
    [2, 0, 0],
    [0, 4, 0],
    [-2, 0, 0],
  ]);

  const gPartBottom = makePart([
    [0, -1.125, 0.5], // pinnacle
    [0, -3, 0],
    [2, 0, 0],
    [0, -1, 0],
    [-2, 0, 0],
  ]);
  gPartBottom.translate(0, -0.5, 0);

  // Manually merge geometries without BufferGeometryUtils
  const gFrontMerged = gPartTop.clone();
  const gPartBottomClone = gPartBottom.clone();
  
  // Combine geometries by merging their positions and indices
  const positions1 = gFrontMerged.attributes.position.array as Float32Array;
  const positions2 = gPartBottomClone.attributes.position.array as Float32Array;
  const indices1 = gFrontMerged.index?.array as Uint16Array | Uint32Array | null;
  const indices2 = gPartBottomClone.index?.array as Uint16Array | Uint32Array | null;

  const mergedPositions = new Float32Array(positions1.length + positions2.length);
  mergedPositions.set(positions1);
  mergedPositions.set(positions2, positions1.length);

  const offset = positions1.length / 3;
  const mergedIndices = indices1 && indices2 
    ? new Uint32Array([
        ...Array.from(indices1),
        ...Array.from(indices2).map(i => i + offset)
      ])
    : undefined;

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(mergedPositions, 3));
  if (mergedIndices) {
    g.setIndex(new THREE.BufferAttribute(mergedIndices, 1));
  }
  g.computeVertexNormals();

  // Create back face (mirrored)
  const gBack = g.clone();
  gBack.scale(-1, 1, 1);

  // Merge front and back
  const positions3 = g.attributes.position.array as Float32Array;
  const positionsBack = gBack.attributes.position.array as Float32Array;
  const indicesG = g.index?.array as Uint16Array | Uint32Array | null;
  const indicesBack = gBack.index?.array as Uint16Array | Uint32Array | null;

  const finalPositions = new Float32Array(positions3.length + positionsBack.length);
  finalPositions.set(positions3);
  finalPositions.set(positionsBack, positions3.length);

  const offsetBack = positions3.length / 3;
  const finalIndices = indicesG && indicesBack
    ? new Uint32Array([
        ...Array.from(indicesG),
        ...Array.from(indicesBack).map(i => i + offsetBack)
      ])
    : undefined;

  const finalGeometry = new THREE.BufferGeometry();
  finalGeometry.setAttribute("position", new THREE.BufferAttribute(finalPositions, 3));
  if (finalIndices) {
    finalGeometry.setIndex(new THREE.BufferAttribute(finalIndices, 1));
  }
  finalGeometry.computeVertexNormals();

  cachedEthereumGeometry = finalGeometry;
  return finalGeometry;
};

// Optimized floating Ethereum logo component
const OptimizedEthLogo = ({ position, speed, scale, material }: FloatingEthLogoProps & { material: THREE.Material }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (meshRef.current) {
      const elapsed = (Date.now() - startTime.current) * 0.001;
      meshRef.current.rotation.x += speed * 0.01;
      meshRef.current.rotation.y += speed * 0.008;
      meshRef.current.rotation.z += speed * 0.005;
      meshRef.current.position.y = position[1] + Math.sin(elapsed * speed) * 0.5;
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      scale={[scale * 0.175, scale * 0.175, scale * 0.175]} 
      geometry={getEthereumGeometry()}
      material={material}
      castShadow
    />
  );
};

const Scene3D = ({ theme }: { theme?: string }) => {
  const [modelGeometry, setModelGeometry] = useState<THREE.BufferGeometry | null>(null);
  
  // Create reusable materials based on theme
  const ethMaterials = useMemo(() => {
    const blueShades = theme === "light"
      ? ["#3D5A7F", "#4A6B94", "#5775A8", "#647FBD", "#7189D1", "#7E93E6", "#8B9DFA"]
      : ["#87CEEB", "#5DB4E8", "#4A9FD8", "#3A8FD0", "#2A7EC8", "#1A6EBF", "#0A5EB7"];
    
    return blueShades.map((color, idx) => {
      const emissive = blueShades[(idx + 2) % blueShades.length];
      return new THREE.MeshPhongMaterial({
        color,
        emissive,
        emissiveIntensity: 0.2,
        shininess: 100,
      });
    });
  }, [theme]);

  // Load GLB model on mount
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load('/base.glb', (gltf) => {
      let geometry: THREE.BufferGeometry | null = null;
      
      gltf.scene.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && !geometry) {
          geometry = (child.geometry as THREE.BufferGeometry).clone();
          geometry.center();
          geometry.scale(0.5, 0.5, 0.5);
        }
      });
      
      if (geometry) {
        setModelGeometry(geometry);
      }
    });
  }, []);

  const logos = [];

  // Create 3D grid pattern with improved distribution
  for (let x = -5; x <= 5; x += 3.3) {
    for (let y = -5; y <= 5; y += 3.3) {
      for (let z = -3; z <= 0; z += 1.5) {
        logos.push({
          id: `${x}-${y}-${z}`,
          position: [x, y, z] as [number, number, number],
          speed: Math.random() * 0.5 + 0.2,
          scale: Math.random() * 0.5 + 0.3,
          materialIdx: Math.floor(Math.random() * ethMaterials.length),
        });
      }
    }
  }

  // Dark mode: dark background, Light mode: light background
  const bgColor = theme === "light" ? "#F5F5F5" : "#0f172a";

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={75} />

      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, -10, 5]} intensity={0.6} color={theme === "light" ? "#3D5A7F" : "#627EEA"} />

      <color attach="background" args={[bgColor]} />

      {logos.map((logo, index) => 
        index % 2 === 0 ? (
          <OptimizedEthLogo
            key={logo.id}
            position={logo.position}
            speed={logo.speed}
            scale={logo.scale}
            material={ethMaterials[logo.materialIdx]}
          />
        ) : (
          <FloatingOBJModel
            key={logo.id}
            position={logo.position}
            speed={logo.speed}
            scale={logo.scale}
            modelGeometry={modelGeometry}
            theme={theme}
          />
        )
      )}
    </>
  );
};

export const Ethereum3DBackground = () => {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 w-full h-screen pointer-events-none">
      <Canvas>
        <Scene3D theme={theme} />
      </Canvas>
    </div>
  );
};


