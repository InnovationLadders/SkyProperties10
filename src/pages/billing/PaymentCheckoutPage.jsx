import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { PaymentMethodSelector } from '../../components/billing/PaymentMethodSelector';
import { useAuth } from '../../contexts/AuthContext';
import { getBillById, recordPayment, updateBillStatus } from '../../utils/billingService';
import { sendBillNotification } from '../../utils/notificationService';
import { PAYMENT_METHODS, NOTIFICATION_TYPES, BILL_STATUS } from '../../utils/constants';

export const PaymentCheckoutPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { billId } = useParams();
  const { currentUser } = useAuth();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.VISA);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    if (billId) {
      fetchBill();
    }
  }, [billId]);

  const fetchBill = async () => {
    setLoading(true);
    try {
      const billData = await getBillById(billId);
      setBill(billData);
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const simulatePaymentGateway = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1;
        const txId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        resolve({ success, transactionId: txId });
      }, 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const paymentResult = await simulatePaymentGateway();

      if (paymentResult.success) {
        await recordPayment(billId, {
          amount: bill.amount,
          currency: bill.currency,
          paymentMethod: paymentMethod,
          transactionId: paymentResult.transactionId,
          paidBy: currentUser.uid,
        });

        await sendBillNotification(
          bill.recipientId,
          NOTIFICATION_TYPES.PAYMENT_CONFIRMED,
          {
            billId: bill.id,
            amount: bill.amount,
            currency: bill.currency,
            transactionId: paymentResult.transactionId,
            billType: bill.billType,
          },
          'en'
        );

        setTransactionId(paymentResult.transactionId);
        setPaymentSuccess(true);
      } else {
        await sendBillNotification(
          bill.recipientId,
          NOTIFICATION_TYPES.PAYMENT_FAILED,
          {
            billId: bill.id,
            amount: bill.amount,
            currency: bill.currency,
            billType: bill.billType,
          },
          'en'
        );

        alert(t('paymentGateway.paymentFailed'));
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(t('paymentGateway.errorProcessing'));
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

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

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-2xl">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('paymentGateway.paymentSuccess')}</h2>
            <p className="text-muted-foreground mb-6">{t('paymentGateway.thankYou')}</p>
            <div className="space-y-2 mb-8 p-6 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('billing.billAmount')}</span>
                <span className="font-medium">{formatCurrency(bill.amount, bill.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paymentGateway.transactionId')}</span>
                <span className="font-medium font-mono text-sm">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('billing.paymentMethod')}</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t('paymentGateway.receiptSent')}</p>
            <div className="flex gap-4">
              <Button onClick={() => navigate('/billing/my-bills')} className="flex-1">
                {t('paymentGateway.returnToBills')}
              </Button>
              <Button variant="outline" className="flex-1">
                {t('billing.downloadInvoice')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(`/billing/${billId}`)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold mb-2">{t('paymentGateway.checkout')}</h1>
          <p className="text-muted-foreground">{t('paymentGateway.securePayment')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('paymentGateway.selectPaymentMethod')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                  />
                </CardContent>
              </Card>

              {(paymentMethod === PAYMENT_METHODS.VISA ||
                paymentMethod === PAYMENT_METHODS.MASTERCARD ||
                paymentMethod === PAYMENT_METHODS.MADA) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('paymentGateway.paymentDetails')}</CardTitle>
                    <CardDescription>{t('paymentGateway.securePayment')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">{t('paymentGateway.cardNumber')}</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        value={cardDetails.cardNumber}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, cardNumber: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardHolderName">{t('paymentGateway.cardHolderName')}</Label>
                      <Input
                        id="cardHolderName"
                        type="text"
                        placeholder="John Doe"
                        value={cardDetails.cardHolderName}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, cardHolderName: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">{t('paymentGateway.expiryDate')}</Label>
                        <Input
                          id="expiryDate"
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          value={cardDetails.expiryDate}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, expiryDate: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">{t('paymentGateway.cvv')}</Label>
                        <Input
                          id="cvv"
                          type="text"
                          placeholder="123"
                          maxLength="4"
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, cvv: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button type="submit" disabled={processing} className="w-full" size="lg">
                {processing
                  ? t('paymentGateway.processing')
                  : `${t('paymentGateway.processPayment')} - ${formatCurrency(
                      bill.amount,
                      bill.currency
                    )}`}
              </Button>
            </form>
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>{t('billing.billDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('billing.billType')}</span>
                  <span className="font-medium">{t(`billing.types.${bill.billType}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('billing.billNumber')}</span>
                  <span className="font-medium text-sm">{bill.id.slice(0, 8)}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('billing.totalAmount')}</span>
                    <span>{formatCurrency(bill.amount, bill.currency)}</span>
                  </div>
                </div>
                {bill.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{bill.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
