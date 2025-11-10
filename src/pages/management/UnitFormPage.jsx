import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, Calculator, Wand2, Images } from 'lucide-react';
import { UNIT_STATUS, USER_ROLES } from '../../utils/constants';
import { CoordinatePicker3D } from '../../components/property/CoordinatePicker3D';
import { coordinateCalculator } from '../../utils/coordinateCalculator';
import { MediaUploader } from '../../components/property/MediaUploader';
import { MediaGallery } from '../../components/property/MediaGallery';
import { MediaViewer } from '../../components/property/MediaViewer';
import { useAuth } from '../../contexts/AuthContext';
import { deleteUnitMedia, setPrimaryMedia, updateMediaMetadata } from '../../utils/mediaUpload';

export const UnitFormPage = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  const { currentUser, userProfile, hasRole } = useAuth();
  const isEditMode = !!unitId;

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    propertyId: '',
    unitNumber: '',
    floor: '',
    type: '',
    size: 0,
    price: 0,
    status: UNIT_STATUS.AVAILABLE,
    listingType: 'sale',
    viewType: 'external',
    description: '',
    coordinates: [0, 0, 0],
    ownerId: '',
    media: [],
  });
  const [error, setError] = useState('');
  const [coordinatesEnabled, setCoordinatesEnabled] = useState(false);
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);

  useEffect(() => {
    fetchProperties();
    fetchUsers();
    if (isEditMode) {
      fetchUnit();
    }
  }, [unitId]);

  useEffect(() => {
    if (formData.propertyId && properties.length > 0) {
      const property = properties.find((p) => p.id === formData.propertyId);
      setSelectedProperty(property);
    }
  }, [formData.propertyId, properties]);

  const fetchProperties = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'properties'));
      const propertiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', [USER_ROLES.UNIT_OWNER, USER_ROLES.ADMIN])
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUnit = async () => {
    try {
      const unitDoc = await getDoc(doc(db, 'units', unitId));
      if (unitDoc.exists()) {
        const data = unitDoc.data();
        setFormData(data);
        if (data.coordinates && Array.isArray(data.coordinates)) {
          setCoordinatesEnabled(true);
        }
      }
    } catch (error) {
      console.error('Error fetching unit:', error);
      setError('Failed to load unit');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'propertyId') {
      const property = properties.find((p) => p.id === value);
      setSelectedProperty(property);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'size' || name === 'price' ? parseFloat(value) || 0 : value,
    }));

    if (name === 'floor' && coordinatesEnabled) {
      autoCalculateCoordinates(formData.unitNumber, value);
    }
  };

  const autoCalculateCoordinates = (unitNumber, floor) => {
    if (!unitNumber || !floor) return;

    const calculatedCoords = coordinateCalculator.calculateUnitPosition(
      floor,
      unitNumber
    );

    setFormData((prev) => ({
      ...prev,
      coordinates: calculatedCoords,
    }));
  };

  const handleCoordinateChange = (axis, value) => {
    const newCoordinates = [...formData.coordinates];
    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newCoordinates[axisIndex] = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      coordinates: newCoordinates,
    }));
  };

  const toggleCoordinates = () => {
    setCoordinatesEnabled(!coordinatesEnabled);
    if (!coordinatesEnabled) {
      setFormData((prev) => ({
        ...prev,
        coordinates: [0, 0, 0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        coordinates: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const unitData = {
        ...formData,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'units', unitId), unitData);
      } else {
        const newDocRef = doc(collection(db, 'units'));
        await setDoc(newDocRef, {
          ...unitData,
          createdAt: serverTimestamp(),
        });
      }

      navigate('/units');
    } catch (error) {
      console.error('Error saving unit:', error);
      setError('Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploadComplete = (mediaData) => {
    setFormData((prev) => ({
      ...prev,
      media: [...(prev.media || []), mediaData],
    }));
  };

  const handleDeleteMedia = async (mediaItem) => {
    try {
      await deleteUnitMedia(unitId, mediaItem);
      setFormData((prev) => ({
        ...prev,
        media: prev.media.filter((item) => item.id !== mediaItem.id),
      }));
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const handleSetPrimaryMedia = async (mediaItem) => {
    try {
      await setPrimaryMedia(unitId, formData.media, mediaItem.id);
      setFormData((prev) => ({
        ...prev,
        media: prev.media.map((item) => ({
          ...item,
          isPrimary: item.id === mediaItem.id,
        })),
      }));
    } catch (error) {
      console.error('Error setting primary media:', error);
      alert('Failed to set primary media');
    }
  };

  const handleEditCaption = async (mediaItem, newCaption) => {
    try {
      const updatedMedia = { ...mediaItem, caption: newCaption };
      await updateMediaMetadata(unitId, mediaItem, updatedMedia);
      setFormData((prev) => ({
        ...prev,
        media: prev.media.map((item) =>
          item.id === mediaItem.id ? updatedMedia : item
        ),
      }));
    } catch (error) {
      console.error('Error updating caption:', error);
      alert('Failed to update caption');
    }
  };

  const handleMediaClick = (mediaItem) => {
    const index = formData.media.findIndex((item) => item.id === mediaItem.id);
    setMediaViewerIndex(index);
    setShowMediaViewer(true);
  };

  const canEditMedia = () => {
    if (!currentUser || !userProfile) return false;
    if (hasRole(USER_ROLES.ADMIN)) return true;
    if (hasRole(USER_ROLES.PROPERTY_MANAGER)) return true;
    if (hasRole(USER_ROLES.UNIT_OWNER) && formData.ownerId === currentUser.uid) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/units')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Units
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Unit' : 'Create New Unit'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property *</Label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitNumber">Unit Number *</Label>
                  <Input
                    id="unitNumber"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    required
                    placeholder="e.g., A101"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">Floor *</Label>
                  <Input
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Unit Type</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="apartment">Apartment</option>
                    <option value="studio">Studio</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="office">Office</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value={UNIT_STATUS.AVAILABLE}>Available</option>
                    <option value={UNIT_STATUS.RESERVED}>Reserved</option>
                    <option value={UNIT_STATUS.SOLD}>Sold</option>
                    <option value={UNIT_STATUS.RENTED}>Rented</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sqm) *</Label>
                  <Input
                    id="size"
                    name="size"
                    type="number"
                    value={formData.size}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="listingType">Listing Type</Label>
                  <select
                    id="listingType"
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="viewType">View Type</Label>
                  <select
                    id="viewType"
                    name="viewType"
                    value={formData.viewType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="external">External View</option>
                    <option value="internal">Internal View</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                  placeholder="Describe the unit..."
                />
              </div>

              {hasRole(USER_ROLES.ADMIN) && (
                <div className="space-y-2">
                  <Label htmlFor="ownerId">Unit Owner</Label>
                  <select
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">No owner assigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Assign an owner to this unit for access control
                  </p>
                </div>
              )}

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">3D Model Hotspot Position</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set the coordinates for this unit on the 3D building model
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coordinatesEnabled}
                      onChange={toggleCoordinates}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Enable</span>
                  </label>
                </div>

                {coordinatesEnabled && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCoordinatePicker(!showCoordinatePicker)}
                        className="flex-1"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {showCoordinatePicker ? 'Hide' : 'Show'} Interactive Picker
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => autoCalculateCoordinates(formData.unitNumber, formData.floor)}
                        disabled={!formData.floor || !formData.unitNumber}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        Auto Calculate
                      </Button>
                    </div>

                    {showCoordinatePicker && (
                      <>
                        {!formData.propertyId ? (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                            Please select a property first to use the 3D coordinate picker.
                          </div>
                        ) : !selectedProperty?.modelUrl ? (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                            The selected property does not have a 3D model uploaded. Please upload a GLB model file to the property first.
                          </div>
                        ) : (
                          <CoordinatePicker3D
                            modelUrl={selectedProperty.modelUrl}
                            currentCoordinate={formData.coordinates}
                            onCoordinateChange={(newCoords) => {
                              setFormData((prev) => ({
                                ...prev,
                                coordinates: newCoords,
                              }));
                            }}
                            unitLabel={formData.unitNumber || 'Unit'}
                          />
                        )}
                      </>
                    )}

                    <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="coordX" className="text-sm font-medium">
                          X Position
                        </Label>
                        <Input
                          id="coordX"
                          type="number"
                          step="0.1"
                          value={formData.coordinates?.[0] || 0}
                          onChange={(e) => handleCoordinateChange('x', e.target.value)}
                          className="text-center"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Left (-) / Right (+)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coordY" className="text-sm font-medium">
                          Y Position
                        </Label>
                        <Input
                          id="coordY"
                          type="number"
                          step="0.1"
                          value={formData.coordinates?.[1] || 0}
                          onChange={(e) => handleCoordinateChange('y', e.target.value)}
                          className="text-center"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Down (-) / Up (+)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coordZ" className="text-sm font-medium">
                          Z Position
                        </Label>
                        <Input
                          id="coordZ"
                          type="number"
                          step="0.1"
                          value={formData.coordinates?.[2] || 0}
                          onChange={(e) => handleCoordinateChange('z', e.target.value)}
                          className="text-center"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          Back (-) / Front (+)
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                      <strong>Current Position:</strong> {coordinateCalculator.formatCoordinate(formData.coordinates)}
                      {formData.floor && (
                        <div className="mt-1">
                          Floor {formData.floor} typical Y range: {coordinateCalculator.calculateFloorY(formData.floor).toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isEditMode && unitId && (
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Images className="h-5 w-5" />
                        Unit Media
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload images and videos to showcase this unit
                      </p>
                    </div>
                    {formData.media && formData.media.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {formData.media.filter(m => m.type === 'image').length} photos •{' '}
                        {formData.media.filter(m => m.type === 'video').length} videos
                      </span>
                    )}
                  </div>

                  {canEditMedia() ? (
                    <>
                      <MediaUploader
                        unitId={unitId}
                        userId={currentUser?.uid}
                        onUploadComplete={handleMediaUploadComplete}
                        disabled={!unitId}
                      />

                      {formData.media && formData.media.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-sm font-medium mb-3">Uploaded Media</h3>
                          <MediaGallery
                            media={formData.media}
                            onDelete={handleDeleteMedia}
                            onSetPrimary={handleSetPrimaryMedia}
                            onEditCaption={handleEditCaption}
                            onMediaClick={handleMediaClick}
                            canEdit={true}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        You don't have permission to manage media for this unit
                      </p>
                      {formData.media && formData.media.length > 0 && (
                        <div className="mt-4">
                          <MediaGallery
                            media={formData.media}
                            onMediaClick={handleMediaClick}
                            canEdit={false}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isEditMode && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> You can upload images and videos after creating the unit.
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : isEditMode ? 'Update Unit' : 'Create Unit'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/units')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <MediaViewer
          media={formData.media || []}
          initialIndex={mediaViewerIndex}
          isOpen={showMediaViewer}
          onClose={() => setShowMediaViewer(false)}
        />
      </div>
    </div>
  );
};
