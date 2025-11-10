import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Box, useGLTF, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Target, Copy, Crosshair } from 'lucide-react';

const CoordinateMarker = ({ position, label }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      {label && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

const ClickableModel = ({ modelUrl, onCoordinateClick, currentCoordinate, debugMode }) => {
  const meshRef = useRef();
  const { camera, raycaster, mouse, scene } = useThree();

  const handleClick = (event) => {
    event.stopPropagation();

    if (event.point) {
      const clickedPoint = event.point;
      onCoordinateClick([
        Math.round(clickedPoint.x * 10) / 10,
        Math.round(clickedPoint.y * 10) / 10,
        Math.round(clickedPoint.z * 10) / 10,
      ]);
    }
  };

  if (modelUrl) {
    try {
      const { scene: modelScene } = useGLTF(modelUrl);
      return (
        <group ref={meshRef} onClick={handleClick}>
          <primitive object={modelScene.clone()} />
        </group>
      );
    } catch (error) {
      return <PlaceholderBuilding onClick={handleClick} />;
    }
  }

  return <PlaceholderBuilding onClick={handleClick} />;
};

const PlaceholderBuilding = ({ onClick }) => {
  return (
    <mesh position={[0, 4, 0]} onClick={onClick}>
      <boxGeometry args={[4, 8, 3]} />
      <meshStandardMaterial color="#708238" opacity={0.3} transparent />
    </mesh>
  );
};

const AxisHelper = () => {
  const axisLength = 10;

  return (
    <group>
      <Line
        points={[[-axisLength, 0, 0], [axisLength, 0, 0]]}
        color="#ef4444"
        lineWidth={2}
      />
      <Line
        points={[[0, -1, 0], [0, axisLength, 0]]}
        color="#22c55e"
        lineWidth={2}
      />
      <Line
        points={[[0, 0, -axisLength], [0, 0, axisLength]]}
        color="#3b82f6"
        lineWidth={2}
      />
      <Text position={[axisLength + 0.5, 0, 0]} fontSize={0.5} color="#ef4444">
        X
      </Text>
      <Text position={[0, axisLength + 0.5, 0]} fontSize={0.5} color="#22c55e">
        Y
      </Text>
      <Text position={[0, 0, axisLength + 0.5]} fontSize={0.5} color="#3b82f6">
        Z
      </Text>
    </group>
  );
};

const FloorGrid = ({ floors = 10, floorHeight = 2 }) => {
  const grids = [];
  for (let i = 0; i <= floors; i++) {
    const y = i * floorHeight;
    grids.push(
      <gridHelper
        key={i}
        args={[20, 20, '#cccccc', '#eeeeee']}
        position={[0, y, 0]}
      />
    );
  }
  return <group>{grids}</group>;
};

export const CoordinatePicker3D = ({
  modelUrl,
  currentCoordinate = [0, 0, 0],
  onCoordinateChange,
  unitLabel,
}) => {
  const [localCoordinate, setLocalCoordinate] = useState(currentCoordinate);
  const [debugMode, setDebugMode] = useState(true);
  const [showFloorGrids, setShowFloorGrids] = useState(true);

  useEffect(() => {
    setLocalCoordinate(currentCoordinate);
  }, [currentCoordinate]);

  const handleCoordinateClick = (newCoordinate) => {
    setLocalCoordinate(newCoordinate);
    onCoordinateChange(newCoordinate);
  };

  const handleManualChange = (axis, value) => {
    const newCoord = [...localCoordinate];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newCoord[axisIndex] = parseFloat(value) || 0;
    setLocalCoordinate(newCoord);
    onCoordinateChange(newCoord);
  };

  const copyCoordinates = () => {
    const coordString = `[${localCoordinate.join(', ')}]`;
    navigator.clipboard.writeText(coordString);
  };

  const calculateFloorPosition = (floorNumber) => {
    const floorHeight = 2;
    const baseHeight = 1;
    const y = (floorNumber - 1) * floorHeight + baseHeight;
    return [localCoordinate[0], y, localCoordinate[2]];
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Interactive Coordinate Picker</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFloorGrids(!showFloorGrids)}
            >
              {showFloorGrids ? 'Hide' : 'Show'} Grids
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyCoordinates}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Click on the 3D model to place the hotspot marker at that position
        </p>

        <div className="h-[400px] bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden">
          <Canvas>
            <PerspectiveCamera makeDefault position={[12, 8, 12]} />
            <OrbitControls
              enablePan={true}
              enableRotate={true}
              enableZoom={true}
              minDistance={5}
              maxDistance={30}
            />

            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.3} />

            <ClickableModel
              modelUrl={modelUrl}
              onCoordinateClick={handleCoordinateClick}
              currentCoordinate={localCoordinate}
              debugMode={debugMode}
            />

            {localCoordinate && (
              <CoordinateMarker
                position={localCoordinate}
                label={unitLabel}
              />
            )}

            {debugMode && <AxisHelper />}
            {showFloorGrids && <FloorGrid floors={10} floorHeight={2} />}
          </Canvas>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            X Position
          </Label>
          <Input
            type="number"
            step="0.1"
            value={localCoordinate[0]}
            onChange={(e) => handleManualChange('x', e.target.value)}
            className="text-center text-sm"
          />
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleManualChange('x', localCoordinate[0] - 0.5)}
            >
              -0.5
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleManualChange('x', localCoordinate[0] + 0.5)}
            >
              +0.5
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Y Position
          </Label>
          <Input
            type="number"
            step="0.1"
            value={localCoordinate[1]}
            onChange={(e) => handleManualChange('y', e.target.value)}
            className="text-center text-sm"
          />
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleManualChange('y', localCoordinate[1] - 0.5)}
            >
              -0.5
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleManualChange('y', localCoordinate[1] + 0.5)}
            >
              +0.5
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            Z Position
          </Label>
          <Input
            type="number"
            step="0.1"
            value={localCoordinate[2]}
            onChange={(e) => handleManualChange('z', e.target.value)}
            className="text-center text-sm"
          />
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleManualChange('z', localCoordinate[2] - 0.5)}
            >
              -0.5
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => handleManualChange('z', localCoordinate[2] + 0.5)}
            >
              +0.5
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 text-xs space-y-2">
        <div className="font-medium flex items-center gap-2">
          <Crosshair className="h-3 w-3" />
          Quick Tips
        </div>
        <ul className="space-y-1 text-muted-foreground pl-5 list-disc">
          <li>Click directly on the building to place the hotspot</li>
          <li>Use the +/- buttons for fine adjustments</li>
          <li>Red (X): Left to Right, Green (Y): Bottom to Top, Blue (Z): Back to Front</li>
          <li>Floor grids are spaced 2 units apart vertically</li>
        </ul>
      </div>
    </div>
  );
};
