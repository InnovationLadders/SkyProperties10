import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, CreditCard, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { getBillById, getPaymentsByBillId, deleteBill } from '../../utils/billingService';
import { BILL_STATUS, USER_ROLES } from '../../utils/constants';

export const BillDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { billId } = useParams();
  const { userProfile } = useAuth();
  const [bill, setBill] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (billId) {
      fetchBillDetails();
    }
  }, [billId]);

  const fetchBillDetails = async () => {
    setLoading(true);
    try {
      const [billData, paymentsData] = await Promise.all([
        getBillById(billId),
        getPaymentsByBillId(billId),
      ]);
      setBill(billData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching bill details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(t('billing.confirmDelete'))) {
      try {
        await deleteBill(billId);
        alert(t('billing.billDeleted'));
        navigate('/billing/manage');
      } catch (error) {
        console.error('Error deleting bill:', error);
        alert(t('billing.errorLoadingBills'));
      }
    }
  };

  const handlePayNow = () => {
    navigate(`/billing/payment/${billId}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case BILL_STATUS.PAID:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case BILL_STATUS.UNPAID:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case BILL_STATUS.OVERDUE:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const canManageBill = userProfile?.role === USER_ROLES.ADMIN || userProfile?.role === USER_ROLES.PROPERTY_MANAGER;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('billing.noBillsFound')}</p>
            <Button onClick={() => navigate('/billing/my-bills')} className="mt-4">
              {t('common.back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(canManageBill ? '/billing/manage' : '/billing/my-bills')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('billing.billDetails')}</h1>
              <p className="text-muted-foreground">
                {t('billing.billNumber')}: {bill.id}
              </p>
            </div>
            <span className={`text-sm px-4 py-2 rounded-full font-medium ${getStatusColor(bill.status)}`}>
              {t(`billing.statuses.${bill.status}`)}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('billing.billDetails')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('billing.billType')}</p>
                  <p className="font-medium">{t(`billing.types.${bill.billType}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('billing.billAmount')}</p>
                  <p className="font-medium text-xl">{formatCurrency(bill.amount, bill.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('billing.issueDate')}</p>
                  <p className="font-medium">{formatDate(bill.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('billing.dueDate')}</p>
                  <p className="font-medium">{formatDate(bill.dueDate)}</p>
                </div>
              </div>

              {bill.description && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">{t('billing.description')}</p>
                  <p>{bill.description}</p>
                </div>
              )}

              {bill.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">{t('billing.notes')}</p>
                  <p>{bill.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('billing.recipient')} & {t('billing.issuedBy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('billing.issuedTo')}</p>
                  <p className="font-medium">{bill.recipientName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(`billing.recipientTypes.${bill.recipientType}`)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('billing.issuedBy')}</p>
                  <p className="font-medium">{bill.issuedByName}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('billing.paymentHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.paymentDate)} - {payment.paymentMethod}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.transactionId}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            {(bill.status === BILL_STATUS.UNPAID || bill.status === BILL_STATUS.OVERDUE) && (
              <Button onClick={handlePayNow} className="flex-1">
                <CreditCard className="h-4 w-4 mr-2" />
                {t('billing.payNow')}
              </Button>
            )}
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {t('billing.downloadInvoice')}
            </Button>
            {canManageBill && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('billing.deleteBill')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
