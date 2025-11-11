import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
            {t('unit.backToUnits')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? t('unit.editUnit') : t('unit.createUnit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="propertyId">{t('unit.property')} *</Label>
                <select
                  id="propertyId"
                  name="propertyId"
                  value={formData.propertyId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">{t('unit.selectProperty')}</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitNumber">{t('unit.unitNumber')} *</Label>
                  <Input
                    id="unitNumber"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    required
                    placeholder={t('unit.unitNumberPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor">{t('unit.floor')} *</Label>
                  <Input
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    required
                    placeholder={t('unit.floorPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t('unit.unitType')}</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">{t('unit.selectType')}</option>
                    <option value="apartment">{t('unit.apartment')}</option>
                    <option value="studio">{t('unit.studio')}</option>
                    <option value="penthouse">{t('unit.penthouse')}</option>
                    <option value="office">{t('unit.office')}</option>
                    <option value="retail">{t('unit.retail')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t('unit.status')} *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value={UNIT_STATUS.AVAILABLE}>{t('unit.available')}</option>
                    <option value={UNIT_STATUS.RESERVED}>{t('unit.reserved')}</option>
                    <option value={UNIT_STATUS.SOLD}>{t('unit.sold')}</option>
                    <option value={UNIT_STATUS.RENTED}>{t('unit.rented')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">{t('unit.sizeSqm')} *</Label>
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
                  <Label htmlFor="price">{t('unit.priceUsd')} *</Label>
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
                  <Label htmlFor="listingType">{t('unit.listingType')}</Label>
                  <select
                    id="listingType"
                    name="listingType"
                    value={formData.listingType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="sale">{t('unit.forSale')}</option>
                    <option value="rent">{t('unit.forRent')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="viewType">{t('unit.viewType')}</Label>
                  <select
                    id="viewType"
                    name="viewType"
                    value={formData.viewType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="external">{t('unit.externalView')}</option>
                    <option value="internal">{t('unit.internalView')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('property.description')}</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                  placeholder={t('unit.descriptionPlaceholder')}
                />
              </div>

              {hasRole(USER_ROLES.ADMIN) && (
                <div className="space-y-2">
                  <Label htmlFor="ownerId">{t('unit.unitOwner')}</Label>
                  <select
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">{t('unit.noOwnerAssigned')}</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.displayName || user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {t('unit.ownerHelp')}
                  </p>
                </div>
              )}

              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">{t('unit.hotspotPosition')}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('unit.hotspotDescription')}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coordinatesEnabled}
                      onChange={toggleCoordinates}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">{t('unit.enable')}</span>
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
                        {showCoordinatePicker ? t('unit.hideInteractivePicker') : t('unit.showInteractivePicker')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => autoCalculateCoordinates(formData.unitNumber, formData.floor)}
                        disabled={!formData.floor || !formData.unitNumber}
                      >
                        <Calculator className="h-4 w-4 mr-2" />
                        {t('unit.autoCalculate')}
                      </Button>
                    </div>

                    {showCoordinatePicker && (
                      <>
                        {!formData.propertyId ? (
                          <div className="p-4 bg-yellow-50 rounded-md text-sm text-yellow-800">
                            {t('unit.selectPropertyFirst')}
                          </div>
                        ) : !selectedProperty?.modelUrl ? (
                          <div className="p-4 bg-yellow-50 rounded-md text-sm text-yellow-800">
                            {t('unit.noModelAvailable')}
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
                          {t('unit.xPosition')}
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
                          {t('unit.leftRight')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coordY" className="text-sm font-medium">
                          {t('unit.yPosition')}
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
                          {t('unit.downUp')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coordZ" className="text-sm font-medium">
                          {t('unit.zPosition')}
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
                          {t('unit.backFront')}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
                      <strong>{t('unit.currentPosition')}:</strong> {coordinateCalculator.formatCoordinate(formData.coordinates)}
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
                        {t('unit.unitMedia')}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('unit.unitMediaDescription')}
                      </p>
                    </div>
                    {formData.media && formData.media.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {formData.media.filter(m => m.type === 'image').length} {t('unit.photos')} •{' '}
                        {formData.media.filter(m => m.type === 'video').length} {t('unit.videos')}
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
                          <h3 className="text-sm font-medium mb-3">{t('unit.uploadedMedia')}</h3>
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
                        {t('unit.noPermissionMedia')}
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
                <div className="p-4 bg-blue-50 rounded-md text-sm text-blue-800">
                  <strong>{t('unit.note')}:</strong> {t('unit.mediaUploadNote')}
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? t('unit.saving') : isEditMode ? t('unit.updateUnit') : t('unit.createUnitButton')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/units')}
                  disabled={loading}
                >
                  {t('common.cancel')}
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
