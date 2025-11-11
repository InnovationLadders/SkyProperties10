import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BuildingModel3D } from '../../components/property/BuildingModel3D';
import { ContactModal } from '../../components/property/ContactModal';
import { MediaViewer } from '../../components/property/MediaViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Building2, MapPin, X, DollarSign, Ruler, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const PropertyHomePage = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const unitDetailsRef = useRef(null);

  useEffect(() => {
    setCurrentMediaIndex(0);
    if (selectedUnit && unitDetailsRef.current) {
      unitDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedUnit]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
            <div className="mb-3 px-1">
              <p className="text-sm text-muted-foreground">
                Click on a unit hotspot in the 3D model to view details
              </p>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[600px] bg-gray-100 relative">
                  <BuildingModel3D
                    modelUrl={property.modelUrl}
                    hotspots={hotspots}
                    onHotspotClick={handleHotspotClick}
                  />
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
                    <h4 className="text-xs font-semibold mb-2 text-gray-700">Legend</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-xs text-gray-700">For Sale (External)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-700">For Sale (Internal)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-xs text-gray-700">For Rent (External)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-xs text-gray-700">For Rent (Internal)</span>
                      </div>
                    </div>
                  </div>
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
                      className="border rounded-lg cursor-pointer hover:border-primary transition-colors overflow-hidden"
                      onClick={() => setSelectedUnit(unit)}
                    >
                      {unit.media && unit.media.length > 0 ? (
                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                          <img
                            src={(unit.media.find(m => m.isPrimary) || unit.media[0]).url}
                            alt={`Unit ${unit.unitNumber}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                unit.listingType === 'sale'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-500 text-white'
                              }`}
                            >
                              {unit.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${
                                unit.listingType === 'sale'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-blue-500 text-white'
                              }`}
                            >
                              {unit.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-semibold text-lg">Unit {unit.unitNumber}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              unit.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {unit.status}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center">
                              <Ruler className="h-3 w-3 mr-1" />
                              {unit.size} sqm
                            </span>
                            <span className="font-medium">Floor {unit.floor}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center font-semibold text-primary">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${unit.price?.toLocaleString()}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              unit.viewType === 'external'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {unit.viewType === 'external' ? 'External' : 'Internal'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1" ref={unitDetailsRef}>
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
                      {selectedUnit.media && selectedUnit.media.length > 0 ? (
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                          <div
                            className="w-full h-full cursor-pointer"
                            onClick={() => {
                              setMediaViewerIndex(currentMediaIndex);
                              setShowMediaViewer(true);
                            }}
                          >
                            {selectedUnit.media[currentMediaIndex].type === 'image' ? (
                              <img
                                src={selectedUnit.media[currentMediaIndex].url}
                                alt={selectedUnit.media[currentMediaIndex].caption || 'Unit media'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="relative w-full h-full">
                                <img
                                  src={selectedUnit.media[currentMediaIndex].thumbnailUrl}
                                  alt="Video thumbnail"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                                    <Play className="h-8 w-8 text-gray-800 ml-1" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedUnit.media.length > 1 && (
                            <>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentMediaIndex((prev) =>
                                    prev > 0 ? prev - 1 : selectedUnit.media.length - 1
                                  );
                                }}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentMediaIndex((prev) =>
                                    prev < selectedUnit.media.length - 1 ? prev + 1 : 0
                                  );
                                }}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>

                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                {selectedUnit.media.map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentMediaIndex(index);
                                    }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                      index === currentMediaIndex
                                        ? 'bg-white w-4'
                                        : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>

                              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                {currentMediaIndex + 1} / {selectedUnit.media.length}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          <Building2 className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Listing Type</span>
                          <span className={`font-medium px-2 py-1 rounded text-sm ${
                            selectedUnit.listingType === 'sale'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {selectedUnit.listingType === 'sale' ? 'For Sale' : 'For Rent'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">View Type</span>
                          <span className={`font-medium px-2 py-1 rounded text-sm ${
                            selectedUnit.viewType === 'external'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {selectedUnit.viewType === 'external' ? 'External View' : 'Internal View'}
                          </span>
                        </div>
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

                      <div className="pt-4">
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={() => setShowContactModal(true)}
                        >
                          Request Contact
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
                        Select a unit to view details
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        property={property}
        unit={selectedUnit}
      />

      <MediaViewer
        media={selectedUnit?.media || []}
        initialIndex={mediaViewerIndex}
        isOpen={showMediaViewer}
        onClose={() => setShowMediaViewer(false)}
      />
    </div>
  );
};
