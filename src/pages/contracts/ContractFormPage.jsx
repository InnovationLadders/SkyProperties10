import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, Upload, FileText, X } from 'lucide-react';
import { CONTRACT_TYPES, CONTRACT_STATUS, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

export const ContractFormPage = () => {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const { hasRole } = useAuth();
  const isEditMode = !!contractId;

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [formData, setFormData] = useState({
    tenantId: '',
    tenantName: '',
    tenantEmail: '',
    propertyId: '',
    unitId: '',
    unitNumber: '',
    type: CONTRACT_TYPES.RENT,
    status: CONTRACT_STATUS.DRAFT,
    startDate: '',
    endDate: '',
    rentAmount: 0,
    depositAmount: 0,
    paymentFrequency: 'monthly',
    terms: '',
    documentUrl: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasRole([USER_ROLES.ADMIN, USER_ROLES.PROPERTY_MANAGER])) {
      navigate('/contracts');
      return;
    }
    fetchData();
    if (isEditMode) {
      fetchContract();
    }
  }, [contractId]);

  useEffect(() => {
    if (formData.propertyId) {
      const unitsForProperty = units.filter(unit => unit.propertyId === formData.propertyId);
      setFilteredUnits(unitsForProperty);
    } else {
      setFilteredUnits([]);
    }
  }, [formData.propertyId, units]);

  const fetchData = async () => {
    try {
      const [propertiesSnapshot, unitsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, 'properties')),
        getDocs(collection(db, 'units')),
        getDocs(query(collection(db, 'users'), where('role', '==', USER_ROLES.TENANT))),
      ]);

      const propertiesData = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const unitsData = unitsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const tenantsData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProperties(propertiesData);
      setUnits(unitsData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load form data');
    }
  };

  const fetchContract = async () => {
    try {
      const contractDoc = await getDoc(doc(db, 'contracts', contractId));
      if (contractDoc.exists()) {
        const data = contractDoc.data();
        setFormData({
          ...data,
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        });
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError('Failed to load contract');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'rentAmount' || name === 'depositAmount') {
      processedValue = parseFloat(value) || 0;
    }

    if (name === 'tenantId') {
      const selectedTenant = tenants.find(t => t.id === value);
      setFormData((prev) => ({
        ...prev,
        tenantId: value,
        tenantName: selectedTenant?.displayName || selectedTenant?.email || '',
        tenantEmail: selectedTenant?.email || '',
      }));
      return;
    }

    if (name === 'unitId') {
      const selectedUnit = filteredUnits.find(u => u.id === value);
      setFormData((prev) => ({
        ...prev,
        unitId: value,
        unitNumber: selectedUnit?.unitNumber || '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setDocumentFile(file);
      setError('');
    }
  };

  const removeDocument = () => {
    setDocumentFile(null);
  };

  const validateForm = () => {
    if (!formData.tenantId || !formData.propertyId) {
      setError('Please select a tenant and property');
      return false;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Please select start and end dates');
      return false;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return false;
    }

    if (formData.rentAmount <= 0) {
      setError('Rent amount must be greater than 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let documentUrl = formData.documentUrl || '';

      if (documentFile) {
        const documentRef = ref(storage, `contracts/${Date.now()}_${documentFile.name}`);
        await uploadBytes(documentRef, documentFile);
        documentUrl = await getDownloadURL(documentRef);
      }

      const contractData = {
        ...formData,
        documentUrl,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        await updateDoc(doc(db, 'contracts', contractId), contractData);
      } else {
        const newDocRef = doc(collection(db, 'contracts'));
        await setDoc(newDocRef, {
          ...contractData,
          createdAt: serverTimestamp(),
        });
      }

      navigate('/contracts');
    } catch (error) {
      console.error('Error saving contract:', error);
      setError('Failed to save contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/contracts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? t('contract.editContract') : t('contract.createNewContract')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant *</Label>
                <select
                  id="tenantId"
                  name="tenantId"
                  value={formData.tenantId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select a tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.displayName || tenant.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="unitId">Unit</Label>
                  <select
                    id="unitId"
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    disabled={!formData.propertyId}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50"
                  >
                    <option value="">Select a unit (optional)</option>
                    {filteredUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber} - Floor {unit.floor}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Contract Type *</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value={CONTRACT_TYPES.RENT}>Rent</option>
                    <option value={CONTRACT_TYPES.OPERATIONS}>Operations</option>
                    <option value={CONTRACT_TYPES.MAINTENANCE}>Maintenance</option>
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
                    <option value={CONTRACT_STATUS.DRAFT}>Draft</option>
                    <option value={CONTRACT_STATUS.ACTIVE}>Active</option>
                    <option value={CONTRACT_STATUS.EXPIRING}>Expiring</option>
                    <option value={CONTRACT_STATUS.EXPIRED}>Expired</option>
                    <option value={CONTRACT_STATUS.TERMINATED}>Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount">Rent Amount ($) *</Label>
                  <Input
                    id="rentAmount"
                    name="rentAmount"
                    type="number"
                    value={formData.rentAmount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount ($)</Label>
                  <Input
                    id="depositAmount"
                    name="depositAmount"
                    type="number"
                    value={formData.depositAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                  <select
                    id="paymentFrequency"
                    name="paymentFrequency"
                    value={formData.paymentFrequency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms and Notes</Label>
                <textarea
                  id="terms"
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  className="w-full min-h-[120px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                  placeholder="Enter contract terms, conditions, and additional notes..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Contract Document (PDF)</Label>
                {formData.documentUrl && !documentFile && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm flex-1">Current document uploaded</span>
                    <a
                      href={formData.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </a>
                  </div>
                )}
                {documentFile && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm flex-1">{documentFile.name}</span>
                    <button
                      type="button"
                      onClick={removeDocument}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Input
                    id="document"
                    name="document"
                    type="file"
                    accept="application/pdf"
                    onChange={handleDocumentChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('document').click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {documentFile || formData.documentUrl ? 'Change Document' : 'Upload Document'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    PDF only, max 10MB
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? t('contract.saving') : isEditMode ? t('contract.updateContract') : t('contract.createContract')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/contracts')}
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
