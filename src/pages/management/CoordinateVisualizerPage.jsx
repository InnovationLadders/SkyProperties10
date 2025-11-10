import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BuildingModel3D } from '../../components/property/BuildingModel3D';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { ArrowLeft, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import { coordinateCalculator } from '../../utils/coordinateCalculator';

export const CoordinateVisualizerPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validationResults, setValidationResults] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchUnitsForProperty(selectedProperty.id);
    }
  }, [selectedProperty]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const propertiesSnapshot = await getDocs(collection(db, 'properties'));
      const propertiesData = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(propertiesData);

      if (propertiesData.length > 0) {
        setSelectedProperty(propertiesData[0]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitsForProperty = async (propertyId) => {
    try {
      const unitsQuery = query(
        collection(db, 'units'),
        where('propertyId', '==', propertyId)
      );
      const unitsSnapshot = await getDocs(unitsQuery);
      const unitsData = unitsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnits(unitsData);
      validateUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const validateUnits = (unitsData) => {
    const results = [];
    const coordinatesMap = new Map();

    unitsData.forEach((unit) => {
      const validation = {
        unitId: unit.id,
        unitNumber: unit.unitNumber,
        issues: [],
        warnings: [],
      };

      if (!unit.coordinates) {
        validation.issues.push('No coordinates set');
      } else {
        const coordValidation = coordinateCalculator.validateCoordinate(unit.coordinates);
        if (!coordValidation.valid) {
          validation.issues.push(coordValidation.message);
        }

        const coordKey = unit.coordinates.join(',');
        if (coordinatesMap.has(coordKey)) {
          const overlappingUnit = coordinatesMap.get(coordKey);
          validation.warnings.push(`Overlaps with unit ${overlappingUnit}`);
        } else {
          coordinatesMap.set(coordKey, unit.unitNumber);
        }

        for (const [coord, unitNum] of coordinatesMap.entries()) {
          if (unitNum !== unit.unitNumber) {
            const otherCoord = coord.split(',').map(Number);
            if (coordinateCalculator.checkOverlap(unit.coordinates, otherCoord, 0.5)) {
              validation.warnings.push(`Close to unit ${unitNum}`);
            }
          }
        }

        if (unit.floor) {
          const expectedY = coordinateCalculator.calculateFloorY(unit.floor);
          const actualY = unit.coordinates[1];
          const yDiff = Math.abs(expectedY - actualY);

          if (yDiff > 1.5) {
            validation.warnings.push(
              `Y coordinate (${actualY.toFixed(1)}) may not match floor ${unit.floor} (expected ~${expectedY.toFixed(1)})`
            );
          }
        }
      }

      if (validation.issues.length > 0 || validation.warnings.length > 0) {
        results.push(validation);
      }
    });

    setValidationResults(results);
  };

  const hotspots = units
    .filter((unit) => unit.coordinates)
    .map((unit) => ({
      position: unit.coordinates,
      type: unit.status === 'available' && unit.listingType === 'sale'
        ? (unit.viewType === 'external' ? 'saleExternal' : 'saleInternal')
        : (unit.viewType === 'external' ? 'rentExternal' : 'rentInternal'),
      label: unit.unitNumber,
      unit: unit,
    }));

  const unitsWithoutCoordinates = units.filter((unit) => !unit.coordinates);
  const unitsWithIssues = validationResults.filter((r) => r.issues.length > 0);
  const unitsWithWarnings = validationResults.filter(
    (r) => r.issues.length === 0 && r.warnings.length > 0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/units')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Units
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Coordinate Visualizer</h1>
          <p className="text-muted-foreground">
            View and validate unit positions on 3D building models
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Property Model</CardTitle>
                    <CardDescription>
                      {selectedProperty?.name || 'Select a property'}
                    </CardDescription>
                  </div>
                  <select
                    value={selectedProperty?.id || ''}
                    onChange={(e) => {
                      const property = properties.find((p) => p.id === e.target.value);
                      setSelectedProperty(property);
                    }}
                    className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] bg-gray-100 rounded-lg overflow-hidden">
                  <BuildingModel3D
                    modelUrl={selectedProperty?.modelUrl}
                    hotspots={hotspots}
                    onHotspotClick={(hotspot) => {
                      navigate(`/units/edit/${hotspot.unit.id}`);
                    }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>Total Units: {units.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>With Coordinates: {hotspots.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Validation Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {unitsWithoutCoordinates.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-md">
                    <h4 className="font-semibold text-sm text-red-900 mb-2">
                      Units Without Coordinates ({unitsWithoutCoordinates.length})
                    </h4>
                    <ul className="space-y-1 text-xs">
                      {unitsWithoutCoordinates.slice(0, 5).map((unit) => (
                        <li key={unit.id} className="flex items-center justify-between">
                          <span>Unit {unit.unitNumber}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/units/edit/${unit.id}`)}
                            className="h-6 text-xs"
                          >
                            Edit
                          </Button>
                        </li>
                      ))}
                      {unitsWithoutCoordinates.length > 5 && (
                        <li className="text-muted-foreground">
                          +{unitsWithoutCoordinates.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {unitsWithIssues.length > 0 && (
                  <div className="p-3 bg-red-50 rounded-md">
                    <h4 className="font-semibold text-sm text-red-900 mb-2">
                      Critical Issues ({unitsWithIssues.length})
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {unitsWithIssues.map((result) => (
                        <li key={result.unitId} className="space-y-1">
                          <div className="font-medium">Unit {result.unitNumber}</div>
                          <ul className="pl-4 space-y-1">
                            {result.issues.map((issue, idx) => (
                              <li key={idx} className="text-red-700">
                                • {issue}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {unitsWithWarnings.length > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-md">
                    <h4 className="font-semibold text-sm text-yellow-900 mb-2">
                      Warnings ({unitsWithWarnings.length})
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {unitsWithWarnings.slice(0, 5).map((result) => (
                        <li key={result.unitId} className="space-y-1">
                          <div className="font-medium">Unit {result.unitNumber}</div>
                          <ul className="pl-4 space-y-1">
                            {result.warnings.map((warning, idx) => (
                              <li key={idx} className="text-yellow-700">
                                • {warning}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                      {unitsWithWarnings.length > 5 && (
                        <li className="text-muted-foreground">
                          +{unitsWithWarnings.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {unitsWithoutCoordinates.length === 0 &&
                  unitsWithIssues.length === 0 &&
                  unitsWithWarnings.length === 0 && (
                    <div className="p-6 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-2" />
                      <p className="text-sm font-medium">All units validated</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No issues found with unit coordinates
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Reference</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div>
                  <strong>Coordinate System:</strong>
                </div>
                <ul className="space-y-1 pl-4">
                  <li>• X: Left (negative) to Right (positive)</li>
                  <li>• Y: Bottom (negative) to Top (positive)</li>
                  <li>• Z: Back (negative) to Front (positive)</li>
                </ul>
                <div className="pt-2">
                  <strong>Floor Heights:</strong>
                </div>
                <ul className="space-y-1 pl-4">
                  <li>• Each floor: 2 units apart</li>
                  <li>• Base height: 1 unit</li>
                  <li>• Floor 1 Y: ~1.0</li>
                  <li>• Floor 2 Y: ~3.0</li>
                  <li>• Floor 3 Y: ~5.0</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
