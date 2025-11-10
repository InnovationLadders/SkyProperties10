import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save } from 'lucide-react';
import { UNIT_STATUS } from '../../utils/constants';

export const UnitFormPage = () => {
  const navigate = useNavigate();
  const { unitId } = useParams();
  const isEditMode = !!unitId;

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
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
    coordinates: null,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProperties();
    if (isEditMode) {
      fetchUnit();
    }
  }, [unitId]);

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

  const fetchUnit = async () => {
    try {
      const unitDoc = await getDoc(doc(db, 'units', unitId));
      if (unitDoc.exists()) {
        setFormData(unitDoc.data());
      }
    } catch (error) {
      console.error('Error fetching unit:', error);
      setError('Failed to load unit');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'size' || name === 'price' ? parseFloat(value) || 0 : value,
    }));
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
      </div>
    </div>
  );
};
