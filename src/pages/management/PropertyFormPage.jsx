import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, Upload } from 'lucide-react';

export const PropertyFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { propertyId } = useParams();
  const isEditMode = !!propertyId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    totalUnits: 0,
    availableUnits: 0,
  });
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [glbFile, setGlbFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchProperty();
    }
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (propertyDoc.exists()) {
        setFormData(propertyDoc.data());
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      setError('Failed to load property');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalUnits' || name === 'availableUnits' ? parseInt(value) || 0 : value,
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGlbChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.glb')) {
        setGlbFile(file);
      } else {
        alert('Please select a valid GLB file');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploading(true);

    try {
      let imageUrl = formData.imageUrl || '';
      let modelUrl = formData.modelUrl || '';

      if (imageFile) {
        const imageRef = ref(storage, `properties/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      if (glbFile) {
        const glbRef = ref(storage, `properties/${Date.now()}_${glbFile.name}`);
        await uploadBytes(glbRef, glbFile);
        modelUrl = await getDownloadURL(glbRef);
      }

      const propertyData = {
        ...formData,
        imageUrl,
        modelUrl,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'properties', propertyId), propertyData);
      } else {
        const newDocRef = doc(collection(db, 'properties'));
        await setDoc(newDocRef, {
          ...propertyData,
          createdAt: serverTimestamp(),
        });
      }

      navigate('/properties');
    } catch (error) {
      console.error('Error saving property:', error);
      setError('Failed to save property');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Property' : 'Create New Property'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Skyline Towers"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 123 Main St, City, Country"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                  placeholder="Describe the property..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalUnits">Total Units</Label>
                  <Input
                    id="totalUnits"
                    name="totalUnits"
                    type="number"
                    value={formData.totalUnits}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableUnits">Available Units</Label>
                  <Input
                    id="availableUnits"
                    name="availableUnits"
                    type="number"
                    value={formData.availableUnits}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Property Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {(imagePreview || formData.imageUrl) && (
                  <div className="mt-2">
                    <img
                      src={imagePreview || formData.imageUrl}
                      alt="Property preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {imageFile ? 'New image selected' : 'Current image'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="glbFile">3D Model File (GLB)</Label>
                <Input
                  id="glbFile"
                  type="file"
                  accept=".glb"
                  onChange={handleGlbChange}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a GLB 3D model file for this property
                </p>
                {glbFile && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    New model selected: {glbFile.name} ({(glbFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                {formData.modelUrl && !glbFile && (
                  <p className="text-sm text-muted-foreground">Current 3D model uploaded</p>
                )}
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading files...' : loading ? 'Saving...' : isEditMode ? 'Update Property' : 'Create Property'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/properties')}
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
