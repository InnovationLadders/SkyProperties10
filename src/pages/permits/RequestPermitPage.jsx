import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createPermitRequest } from '../../utils/permitsService';
import { PERMIT_TYPES } from '../../utils/constants';

export const RequestPermitPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyName: '',
    unitId: '',
    unitNumber: '',
    accessTypes: [],
    startDate: '',
    endDate: '',
    governmentId: '',
    passportNumber: '',
    carPlateNumber: '',
    mobileNumber: userProfile?.phoneNumber || '',
    purpose: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (formData.propertyId) {
      fetchUnits(formData.propertyId);
    } else {
      setUnits([]);
      setFormData((prev) => ({ ...prev, unitId: '', unitNumber: '' }));
    }
  }, [formData.propertyId]);

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
      setError(t('permit.fetchPropertiesError'));
    }
  };

  const fetchUnits = async (propertyId) => {
    try {
      const q = query(
        collection(db, 'units'),
        where('propertyId', '==', propertyId)
      );
      const snapshot = await getDocs(q);
      const unitsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
      setError(t('permit.fetchUnitsError'));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'propertyId') {
      const selectedProperty = properties.find((p) => p.id === value);
      setFormData((prev) => ({
        ...prev,
        propertyId: value,
        propertyName: selectedProperty?.name || '',
      }));
    }

    if (name === 'unitId') {
      const selectedUnit = units.find((u) => u.id === value);
      setFormData((prev) => ({
        ...prev,
        unitId: value,
        unitNumber: selectedUnit?.unitNumber || '',
      }));
    }
  };

  const handleAccessTypeChange = (accessType) => {
    setFormData((prev) => ({
      ...prev,
      accessTypes: prev.accessTypes.includes(accessType)
        ? prev.accessTypes.filter((type) => type !== accessType)
        : [...prev.accessTypes, accessType],
    }));
  };

  const validateForm = () => {
    if (!formData.propertyId) {
      setError(t('permit.validation.propertyRequired'));
      return false;
    }
    if (formData.accessTypes.length === 0) {
      setError(t('permit.validation.accessTypeRequired'));
      return false;
    }
    if (!formData.startDate) {
      setError(t('permit.validation.startDateRequired'));
      return false;
    }
    if (!formData.endDate) {
      setError(t('permit.validation.endDateRequired'));
      return false;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError(t('permit.validation.invalidDateRange'));
      return false;
    }
    if (!formData.governmentId && !formData.passportNumber) {
      setError(t('permit.validation.identificationRequired'));
      return false;
    }
    if (!formData.mobileNumber) {
      setError(t('permit.validation.mobileRequired'));
      return false;
    }
    if (!formData.purpose) {
      setError(t('permit.validation.purposeRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await createPermitRequest(formData, userProfile);
      setSuccess(t('permit.requestSuccess'));
      setTimeout(() => {
        navigate('/permits');
      }, 2000);
    } catch (error) {
      console.error('Error creating permit request:', error);
      setError(t('permit.requestError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/permits')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('permit.backToPermits')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="w-6 h-6" />
              {t('permit.requestPermit')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="propertyId" required>
                    {t('permit.form.property')}
                  </Label>
                  <select
                    id="propertyId"
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">{t('permit.form.selectProperty')}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="unitId">
                    {t('permit.form.unit')}
                  </Label>
                  <select
                    id="unitId"
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={!formData.propertyId}
                  >
                    <option value="">{t('permit.form.selectUnit')}</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label required>{t('permit.form.accessTypes')}</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.accessTypes.includes(PERMIT_TYPES.MAIN_BUILDING)}
                        onChange={() => handleAccessTypeChange(PERMIT_TYPES.MAIN_BUILDING)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        {t('permit.accessTypes.mainBuilding')}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.accessTypes.includes(PERMIT_TYPES.PARKING)}
                        onChange={() => handleAccessTypeChange(PERMIT_TYPES.PARKING)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        {t('permit.accessTypes.parking')}
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.accessTypes.includes(PERMIT_TYPES.UTILITY)}
                        onChange={() => handleAccessTypeChange(PERMIT_TYPES.UTILITY)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">
                        {t('permit.accessTypes.utility')}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" required>
                      {t('permit.form.startDate')}
                    </Label>
                    <Input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate" required>
                      {t('permit.form.endDate')}
                    </Label>
                    <Input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="governmentId">
                      {t('permit.form.governmentId')}
                    </Label>
                    <Input
                      type="text"
                      id="governmentId"
                      name="governmentId"
                      value={formData.governmentId}
                      onChange={handleChange}
                      placeholder={t('permit.form.governmentIdPlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="passportNumber">
                      {t('permit.form.passportNumber')}
                    </Label>
                    <Input
                      type="text"
                      id="passportNumber"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleChange}
                      placeholder={t('permit.form.passportNumberPlaceholder')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="carPlateNumber">
                      {t('permit.form.carPlateNumber')}
                    </Label>
                    <Input
                      type="text"
                      id="carPlateNumber"
                      name="carPlateNumber"
                      value={formData.carPlateNumber}
                      onChange={handleChange}
                      placeholder={t('permit.form.carPlateNumberPlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="mobileNumber" required>
                      {t('permit.form.mobileNumber')}
                    </Label>
                    <Input
                      type="tel"
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                      placeholder={t('permit.form.mobileNumberPlaceholder')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="purpose" required>
                    {t('permit.form.purpose')}
                  </Label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('permit.form.purposePlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/permits')}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? t('common.submitting') : t('permit.submitRequest')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestPermitPage;
