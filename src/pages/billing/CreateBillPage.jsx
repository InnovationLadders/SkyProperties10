import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { createBill } from '../../utils/billingService';
import { sendBillNotification } from '../../utils/notificationService';
import { BILL_TYPES, USER_ROLES, CURRENCY, NOTIFICATION_TYPES } from '../../utils/constants';

export const CreateBillPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);

  const [formData, setFormData] = useState({
    recipientType: '',
    recipientId: '',
    recipientName: '',
    billType: BILL_TYPES.RENT,
    amount: '',
    currency: CURRENCY.USD,
    dueDate: '',
    description: '',
    notes: '',
    propertyId: '',
    unitId: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (formData.recipientType) {
      fetchRecipients(formData.recipientType);
    }
  }, [formData.recipientType]);

  useEffect(() => {
    if (formData.propertyId) {
      fetchUnits(formData.propertyId);
    }
  }, [formData.propertyId]);

  const fetchProperties = async () => {
    try {
      const propertiesSnapshot = await getDocs(collection(db, 'properties'));
      const propertiesData = propertiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchUnits = async (propertyId) => {
    try {
      const unitsQuery = query(collection(db, 'units'), where('propertyId', '==', propertyId));
      const unitsSnapshot = await getDocs(unitsQuery);
      const unitsData = unitsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnits(unitsData);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const fetchRecipients = async (recipientType) => {
    try {
      let roleFilter = '';
      if (recipientType === 'unitOwner') roleFilter = USER_ROLES.UNIT_OWNER;
      if (recipientType === 'tenant') roleFilter = USER_ROLES.TENANT;
      if (recipientType === 'serviceProvider') roleFilter = USER_ROLES.SERVICE_PROVIDER;

      const usersQuery = query(collection(db, 'users'), where('role', '==', roleFilter));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecipients(usersData);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedRecipient = recipients.find((r) => r.id === formData.recipientId);

      const billData = {
        ...formData,
        amount: parseFloat(formData.amount),
        recipientName: selectedRecipient?.displayName || selectedRecipient?.email || 'Unknown',
        recipientEmail: selectedRecipient?.email,
        issuedBy: userProfile.uid,
        issuedByName: userProfile.displayName || userProfile.email,
      };

      const newBill = await createBill(billData);

      await sendBillNotification(
        formData.recipientId,
        NOTIFICATION_TYPES.BILL_ISSUED,
        {
          billId: newBill.id,
          amount: formData.amount,
          currency: formData.currency,
          dueDate: new Date(formData.dueDate).toLocaleDateString(),
          billType: formData.billType,
        },
        'en'
      );

      alert(t('billing.billCreated'));
      navigate('/billing/manage');
    } catch (error) {
      console.error('Error creating bill:', error);
      alert(t('billing.errorCreatingBill'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canCreateBill = userProfile?.role === USER_ROLES.ADMIN || userProfile?.role === USER_ROLES.PROPERTY_MANAGER;

  if (!canCreateBill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('common.error')}: Access denied</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/billing/manage')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold mb-2">{t('billing.createBill')}</h1>
          <p className="text-muted-foreground">{t('billing.issueBill')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('billing.recipient')}</CardTitle>
                <CardDescription>{t('billing.selectRecipient')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipientType">{t('billing.recipientType')}</Label>
                  <select
                    id="recipientType"
                    value={formData.recipientType}
                    onChange={(e) => handleChange('recipientType', e.target.value)}
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">{t('billing.selectRecipientType')}</option>
                    <option value="unitOwner">{t('billing.recipientTypes.unitOwner')}</option>
                    <option value="tenant">{t('billing.recipientTypes.tenant')}</option>
                    <option value="serviceProvider">{t('billing.recipientTypes.serviceProvider')}</option>
                  </select>
                </div>

                {formData.recipientType && (
                  <div>
                    <Label htmlFor="recipientId">{t('billing.recipient')}</Label>
                    <select
                      id="recipientId"
                      value={formData.recipientId}
                      onChange={(e) => handleChange('recipientId', e.target.value)}
                      className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">{t('billing.selectRecipient')}</option>
                      {recipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.displayName || recipient.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('billing.billDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="billType">{t('billing.billType')}</Label>
                  <select
                    id="billType"
                    value={formData.billType}
                    onChange={(e) => handleChange('billType', e.target.value)}
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {Object.values(BILL_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {t(`billing.types.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">{t('billing.billAmount')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleChange('amount', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">{t('billing.currency')}</Label>
                    <select
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      {Object.values(CURRENCY).map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="dueDate">{t('billing.dueDate')}</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">{t('billing.description')}</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder={t('billing.descriptionPlaceholder')}
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">{t('billing.notes')} ({t('billing.optional')})</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder={t('billing.notesPlaceholder')}
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('billing.property')} & {t('billing.unit')}</CardTitle>
                <CardDescription>({t('billing.optional')})</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="propertyId">{t('billing.property')}</Label>
                  <select
                    id="propertyId"
                    value={formData.propertyId}
                    onChange={(e) => handleChange('propertyId', e.target.value)}
                    className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('billing.selectProperty')}</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.propertyId && (
                  <div>
                    <Label htmlFor="unitId">{t('billing.unit')}</Label>
                    <select
                      id="unitId"
                      value={formData.unitId}
                      onChange={(e) => handleChange('unitId', e.target.value)}
                      className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">{t('billing.selectUnit')}</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unitNumber} - {unit.type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/billing/manage')}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  t('common.loading')
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t('billing.issueBill')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
