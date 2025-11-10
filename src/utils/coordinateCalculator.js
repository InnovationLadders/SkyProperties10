export const coordinateCalculator = {
  floorHeight: 2,
  baseHeight: 1,

  calculateFloorY(floorNumber) {
    const floor = parseInt(floorNumber) || 1;
    return (floor - 1) * this.floorHeight + this.baseHeight;
  },

  calculateUnitPosition(floorNumber, unitNumber, propertyConfig = {}) {
    const {
      buildingWidth = 4,
      buildingDepth = 3,
      unitsPerFloor = 4,
    } = propertyConfig;

    const floor = parseInt(floorNumber) || 1;
    const y = this.calculateFloorY(floor);

    const unitNumStr = String(unitNumber).toUpperCase();
    let x = 0;
    let z = 0;

    if (unitNumStr.includes('A') || unitNumStr.includes('W')) {
      x = -buildingWidth / 3;
    } else if (unitNumStr.includes('B') || unitNumStr.includes('E')) {
      x = buildingWidth / 3;
    } else if (unitNumStr.includes('C') || unitNumStr.includes('N')) {
      x = 0;
    } else if (unitNumStr.includes('D') || unitNumStr.includes('S')) {
      x = 0;
    }

    if (unitNumStr.match(/[A-D]/)) {
      z = 0;
    } else if (unitNumStr.includes('N')) {
      z = buildingDepth / 3;
    } else if (unitNumStr.includes('S')) {
      z = -buildingDepth / 3;
    }

    return [
      Math.round(x * 10) / 10,
      Math.round(y * 10) / 10,
      Math.round(z * 10) / 10,
    ];
  },

  validateCoordinate(coordinate, bounds = { min: -10, max: 10 }) {
    if (!Array.isArray(coordinate) || coordinate.length !== 3) {
      return { valid: false, message: 'Coordinate must be an array of 3 numbers' };
    }

    const [x, y, z] = coordinate;

    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      return { valid: false, message: 'All coordinates must be numbers' };
    }

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      return { valid: false, message: 'Coordinates cannot be NaN' };
    }

    if (x < bounds.min || x > bounds.max ||
        y < bounds.min || y > bounds.max ||
        z < bounds.min || z > bounds.max) {
      return {
        valid: false,
        message: `Coordinates must be between ${bounds.min} and ${bounds.max}`,
      };
    }

    return { valid: true };
  },

  checkOverlap(coordinate1, coordinate2, threshold = 0.5) {
    if (!coordinate1 || !coordinate2) return false;

    const distance = Math.sqrt(
      Math.pow(coordinate1[0] - coordinate2[0], 2) +
      Math.pow(coordinate1[1] - coordinate2[1], 2) +
      Math.pow(coordinate1[2] - coordinate2[2], 2)
    );

    return distance < threshold;
  },

  findNearestValidPosition(coordinate, occupiedPositions, minDistance = 0.5) {
    let [x, y, z] = coordinate;
    let attempts = 0;
    const maxAttempts = 20;
    const step = 0.3;

    while (attempts < maxAttempts) {
      let overlapping = false;

      for (const occupied of occupiedPositions) {
        if (this.checkOverlap([x, y, z], occupied, minDistance)) {
          overlapping = true;
          break;
        }
      }

      if (!overlapping) {
        return [
          Math.round(x * 10) / 10,
          Math.round(y * 10) / 10,
          Math.round(z * 10) / 10,
        ];
      }

      x += step * (attempts % 2 === 0 ? 1 : -1);
      z += step * Math.floor(attempts / 2) % 2 === 0 ? 1 : -1;
      attempts++;
    }

    return coordinate;
  },

  snapToGrid(coordinate, gridSize = 0.5) {
    return coordinate.map(value => {
      return Math.round(value / gridSize) * gridSize;
    });
  },

  getFloorRange(floorNumber) {
    const y = this.calculateFloorY(floorNumber);
    return {
      min: y - this.floorHeight / 2,
      max: y + this.floorHeight / 2,
    };
  },

  formatCoordinate(coordinate) {
    if (!coordinate || !Array.isArray(coordinate)) return '[0, 0, 0]';
    return `[${coordinate.map(v => v.toFixed(1)).join(', ')}]`;
  },

  parseCoordinate(coordString) {
    try {
      const cleaned = coordString.replace(/[\[\]]/g, '').trim();
      const parts = cleaned.split(',').map(s => parseFloat(s.trim()));

      if (parts.length === 3 && parts.every(n => !isNaN(n))) {
        return parts;
      }
    } catch (error) {
      console.error('Error parsing coordinate:', error);
    }
    return null;
  },
};
