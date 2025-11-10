import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BuildingModel3D } from '../../components/property/BuildingModel3D';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Building2, MapPin, X, DollarSign, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PropertyHomePage = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPropertyData();
  }, [propertyId]);

  const fetchPropertyData = async () => {
    setLoading(true);
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (propertyDoc.exists()) {
        setProperty({ id: propertyDoc.id, ...propertyDoc.data() });
      }

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
    } catch (error) {
      console.error('Error fetching property data:', error);
    } finally {
      setLoading(false);
    }
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

  const handleHotspotClick = (hotspot) => {
    setSelectedUnit(hotspot.unit);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-center">Property not found</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{property.address}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[600px] bg-gray-100 dark:bg-gray-800">
                  <BuildingModel3D
                    modelUrl={property.modelUrl}
                    hotspots={hotspots}
                    onHotspotClick={handleHotspotClick}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Available Units</CardTitle>
                <CardDescription>
                  {units.length} units total, {units.filter(u => u.status === 'available').length} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {units.map((unit) => (
                    <motion.div
                      key={unit.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedUnit(unit)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">Unit {unit.unitNumber}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            unit.status === 'available'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {unit.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center">
                          <Ruler className="h-3 w-3 mr-1" />
                          {unit.size} sqm
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          ${unit.price?.toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedUnit ? (
                <motion.div
                  key={selectedUnit.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="sticky top-20">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Unit {selectedUnit.unitNumber}</CardTitle>
                          <CardDescription>Floor {selectedUnit.floor}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUnit(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Building2 className="h-16 w-16 text-muted-foreground" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span className="font-medium">{selectedUnit.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size</span>
                          <span className="font-medium">{selectedUnit.size} sqm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price</span>
                          <span className="font-medium text-primary">
                            ${selectedUnit.price?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span
                            className={`font-medium ${
                              selectedUnit.status === 'available'
                                ? 'text-green-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {selectedUnit.status}
                          </span>
                        </div>
                      </div>

                      {selectedUnit.description && (
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedUnit.description}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 pt-4">
                        <Button className="w-full" size="lg">
                          Contact for Sale
                        </Button>
                        <Button className="w-full" variant="outline" size="lg">
                          Schedule Viewing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Click on a unit hotspot or card to view details
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">For Sale (External)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm">For Sale (Internal)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">For Rent (External)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">For Rent (Internal)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
