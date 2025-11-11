import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Box, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '../ui/Button';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

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

const CameraController = ({ onControlsRef }) => {
  const { camera, controls } = useThree();
  const controlsRef = useRef();

  useFrame(() => {
    if (controlsRef.current && onControlsRef) {
      onControlsRef(controlsRef.current, camera);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableRotate={true}
      enableZoom={true}
      minDistance={5}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2}
    />
  );
};

export const BuildingModel3D = ({ modelUrl, hotspots = [], onHotspotClick }) => {
  const [modelError, setModelError] = useState(false);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);

  const handleControlsRef = (controls, camera) => {
    controlsRef.current = controls;
    cameraRef.current = camera;
  };

  const panCamera = (direction) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const panAmount = 1.5;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const target = controls.target.clone();

    switch (direction) {
      case 'up':
        camera.position.y += panAmount;
        target.y += panAmount;
        break;
      case 'down':
        camera.position.y -= panAmount;
        target.y -= panAmount;
        break;
      case 'left':
        const leftVector = new THREE.Vector3();
        camera.getWorldDirection(leftVector);
        leftVector.cross(camera.up).normalize().multiplyScalar(panAmount);
        camera.position.sub(leftVector);
        target.sub(leftVector);
        break;
      case 'right':
        const rightVector = new THREE.Vector3();
        camera.getWorldDirection(rightVector);
        rightVector.cross(camera.up).normalize().multiplyScalar(panAmount);
        camera.position.add(rightVector);
        target.add(rightVector);
        break;
    }

    controls.target.copy(target);
    controls.update();
  };

  const rotateCamera = (direction) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const center = controls.target.clone();
    const angle = direction === 'left' ? Math.PI / 8 : -Math.PI / 8;

    const offset = camera.position.clone().sub(center);
    const radius = offset.length();
    const currentAngle = Math.atan2(offset.z, offset.x);
    const newAngle = currentAngle + angle;

    camera.position.x = center.x + radius * Math.cos(newAngle);
    camera.position.z = center.z + radius * Math.sin(newAngle);

    camera.lookAt(center);
    controls.update();
  };

  const zoomCamera = (direction) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const center = controls.target.clone();
    const zoomAmount = 1.5;

    const offset = camera.position.clone().sub(center);
    const currentDistance = offset.length();

    if (direction === 'in') {
      const newDistance = Math.max(currentDistance - zoomAmount, 5);
      offset.normalize().multiplyScalar(newDistance);
    } else {
      const newDistance = Math.min(currentDistance + zoomAmount, 20);
      offset.normalize().multiplyScalar(newDistance);
    }

    camera.position.copy(center.clone().add(offset));
    controls.update();
  };

  return (
    <div className="w-full h-full relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[8, 5, 8]} />
        <CameraController onControlsRef={handleControlsRef} />

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

      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2 border border-gray-200">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-gray-700 text-center mb-1">Camera Controls</div>

          <div className="grid grid-cols-3 gap-1">
            <div></div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => panCamera('up')}
              title="Pan Up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <div></div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => panCamera('left')}
              title="Pan Left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => panCamera('down')}
              title="Pan Down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => panCamera('right')}
              title="Pan Right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-1">
            <div className="text-xs text-gray-600 text-center mb-1">Rotate</div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-1"
                onClick={() => rotateCamera('left')}
                title="Rotate Left"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-1"
                onClick={() => rotateCamera('right')}
                title="Rotate Right"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-1">
            <div className="text-xs text-gray-600 text-center mb-1">Zoom</div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-1"
                onClick={() => zoomCamera('in')}
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 flex-1"
                onClick={() => zoomCamera('out')}
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
