import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Box, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const Hotspot = ({ position, type, onClick, label }) => {
  const [hovered, setHovered] = useState(false);

  const getColor = () => {
    if (type === 'saleExternal') return '#22c55e';
    if (type === 'saleInternal') return '#22c55e';
    if (type === 'rentExternal') return '#3b82f6';
    if (type === 'rentInternal') return '#3b82f6';
    return '#6b7280';
  };

  const getShape = () => {
    return type?.includes('External') ? 'box' : 'sphere';
  };

  return (
    <group position={position}>
      {getShape() === 'box' ? (
        <Box
          args={[0.3, 0.3, 0.3]}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshStandardMaterial
            color={getColor()}
            emissive={getColor()}
            emissiveIntensity={hovered ? 0.5 : 0.2}
            transparent
            opacity={0.8}
          />
        </Box>
      ) : (
        <mesh
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={getColor()}
            emissive={getColor()}
            emissiveIntensity={hovered ? 0.5 : 0.2}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};

const LoadedModel = ({ modelUrl, hotspots, onHotspotClick }) => {
  const { scene } = useGLTF(modelUrl);
  const modelRef = useRef();

  return (
    <group ref={modelRef}>
      <primitive object={scene} />
      {hotspots?.map((hotspot, index) => (
        <Hotspot
          key={index}
          position={hotspot.position}
          type={hotspot.type}
          label={hotspot.label}
          onClick={() => onHotspotClick(hotspot)}
        />
      ))}
    </group>
  );
};

const PlaceholderBuilding = ({ hotspots, onHotspotClick }) => {
  const meshRef = useRef();

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[4, 8, 3]} />
        <meshStandardMaterial color="#708238" opacity={0.3} transparent />
      </mesh>

      {hotspots?.map((hotspot, index) => (
        <Hotspot
          key={index}
          position={hotspot.position}
          type={hotspot.type}
          label={hotspot.label}
          onClick={() => onHotspotClick(hotspot)}
        />
      ))}
    </group>
  );
};

const LoadingFallback = () => {
  return (
    <mesh>
      <boxGeometry args={[4, 8, 3]} />
      <meshStandardMaterial color="#999999" opacity={0.5} transparent wireframe />
    </mesh>
  );
};

export const BuildingModel3D = ({ modelUrl, hotspots = [], onHotspotClick }) => {
  const [modelError, setModelError] = useState(false);

  return (
    <div className="w-full h-full relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[8, 5, 8]} />
        <OrbitControls
          enablePan={false}
          enableRotate={true}
          enableZoom={true}
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        {modelUrl && !modelError ? (
          <Suspense fallback={<LoadingFallback />}>
            <LoadedModel
              modelUrl={modelUrl}
              hotspots={hotspots}
              onHotspotClick={onHotspotClick}
            />
          </Suspense>
        ) : (
          <PlaceholderBuilding hotspots={hotspots} onHotspotClick={onHotspotClick} />
        )}

        <gridHelper args={[20, 20, '#cccccc', '#eeeeee']} />
      </Canvas>
      {modelError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md text-sm">
          Failed to load 3D model. Showing placeholder.
        </div>
      )}
    </div>
  );
};
