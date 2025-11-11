import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { TICKET_STATUS } from '../../utils/constants';

export const CreateTicketPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyId: '',
    unitNumber: '',
    category: 'general',
    priority: 'medium',
    status: TICKET_STATUS.OPEN,
  });
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const imageRef = ref(storage, `tickets/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newDocRef = doc(collection(db, 'tickets'));
      await setDoc(newDocRef, {
        ...formData,
        imageUrl,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate('/tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('ticket.backToTickets')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('ticket.createMaintenance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('ticket.ticketTitle')} *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder={t('ticket.briefDescription')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('ticket.description')} *</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full min-h-[120px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                  placeholder={t('ticket.detailedDescription')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">{t('property.propertyName')} *</Label>
                  <select
                    id="propertyId"
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">{t('ticket.selectProperty')}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitNumber">{t('unit.unitNumber')}</Label>
                  <Input
                    id="unitNumber"
                    name="unitNumber"
                    value={formData.unitNumber}
                    onChange={handleChange}
                    placeholder={t('ticket.unitNumberPlaceholder')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('ticket.category')} *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="general">{t('ticket.categories.general')}</option>
                    <option value="plumbing">{t('ticket.categories.plumbing')}</option>
                    <option value="electrical">{t('ticket.categories.electrical')}</option>
                    <option value="hvac">{t('ticket.categories.hvac')}</option>
                    <option value="appliance">{t('ticket.categories.appliance')}</option>
                    <option value="structural">{t('ticket.categories.structural')}</option>
                    <option value="other">{t('ticket.categories.other')}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">{t('ticket.priority')} *</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="low">{t('ticket.priorities.low')}</option>
                    <option value="medium">{t('ticket.priorities.medium')}</option>
                    <option value="high">{t('ticket.priorities.high')}</option>
                    <option value="urgent">{t('ticket.priorities.urgent')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">{t('ticket.attachImage')}</Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                <p className="text-sm text-muted-foreground">
                  {t('ticket.uploadPhoto')}
                </p>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? t('ticket.creating') : t('ticket.createTicket')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/tickets')}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
