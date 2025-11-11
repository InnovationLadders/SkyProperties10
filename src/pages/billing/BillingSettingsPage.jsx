import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES, CURRENCY } from '../../utils/constants';

export const BillingSettingsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    paymentGateway: {
      enabled: true,
      testMode: true,
      apiKey: '',
      secretKey: '',
    },
    notifications: {
      smsEnabled: false,
      whatsappEnabled: false,
      emailEnabled: true,
    },
    lateFees: {
      enabled: false,
      percentage: 5,
      gracePeriodDays: 3,
    },
    currency: {
      default: CURRENCY.USD,
    },
    tax: {
      enabled: false,
      percentage: 0,
      label: 'VAT',
    },
    defaultTerms: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'billing'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'billing'), {
        ...settings,
        updatedAt: new Date(),
        updatedBy: userProfile.uid,
      });
      alert(t('billingSettings.settingsSaved'));
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('billingSettings.errorSavingSettings'));
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const canManageSettings = userProfile?.role === USER_ROLES.ADMIN;

  if (!canManageSettings) {
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
          <h1 className="text-3xl font-bold mb-2">{t('billingSettings.title')}</h1>
          <p className="text-muted-foreground">{t('billingSettings.description')}</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('billingSettings.gatewaySettings')}</CardTitle>
              <CardDescription>{t('billingSettings.paymentGateway')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('billingSettings.enabled')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('billingSettings.paymentGateway')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.paymentGateway.enabled}
                  onChange={(e) =>
                    updateSettings('paymentGateway', 'enabled', e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('billingSettings.testMode')}</Label>
                  <p className="text-sm text-muted-foreground">Use test environment</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.paymentGateway.testMode}
                  onChange={(e) =>
                    updateSettings('paymentGateway', 'testMode', e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </div>

              <div>
                <Label htmlFor="apiKey">{t('billingSettings.apiKey')}</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={settings.paymentGateway.apiKey}
                  onChange={(e) => updateSettings('paymentGateway', 'apiKey', e.target.value)}
                  placeholder="Enter API key"
                />
              </div>

              <div>
                <Label htmlFor="secretKey">{t('billingSettings.secretKey')}</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={settings.paymentGateway.secretKey}
                  onChange={(e) =>
                    updateSettings('paymentGateway', 'secretKey', e.target.value)
                  }
                  placeholder="Enter secret key"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('billingSettings.notificationSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('billingSettings.enableSMS')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS notifications to recipients
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.smsEnabled}
                  onChange={(e) =>
                    updateSettings('notifications', 'smsEnabled', e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('billingSettings.enableWhatsApp')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Send WhatsApp notifications to recipients
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.whatsappEnabled}
                  onChange={(e) =>
                    updateSettings('notifications', 'whatsappEnabled', e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('billingSettings.enableEmail')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to recipients
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailEnabled}
                  onChange={(e) =>
                    updateSettings('notifications', 'emailEnabled', e.target.checked)
                  }
                  className="h-5 w-5"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('billingSettings.lateFeeSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('billingSettings.enableLateFees')}</Label>
                  <p className="text-sm text-muted-foreground">
                    Apply late fees for overdue bills
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.lateFees.enabled}
                  onChange={(e) => updateSettings('lateFees', 'enabled', e.target.checked)}
                  className="h-5 w-5"
                />
              </div>

              {settings.lateFees.enabled && (
                <>
                  <div>
                    <Label htmlFor="lateFeePercentage">
                      {t('billingSettings.lateFeePercentage')}
                    </Label>
                    <Input
                      id="lateFeePercentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.lateFees.percentage}
                      onChange={(e) =>
                        updateSettings('lateFees', 'percentage', parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="gracePeriodDays">
                      {t('billingSettings.gracePeriodDays')}
                    </Label>
                    <Input
                      id="gracePeriodDays"
                      type="number"
                      min="0"
                      value={settings.lateFees.gracePeriodDays}
                      onChange={(e) =>
                        updateSettings('lateFees', 'gracePeriodDays', parseInt(e.target.value))
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('billingSettings.currencySettings')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="defaultCurrency">{t('billingSettings.defaultCurrency')}</Label>
              <select
                id="defaultCurrency"
                value={settings.currency.default}
                onChange={(e) => updateSettings('currency', 'default', e.target.value)}
                className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.values(CURRENCY).map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('billingSettings.termsAndConditions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="defaultTerms">{t('billingSettings.defaultTerms')}</Label>
              <textarea
                id="defaultTerms"
                value={settings.defaultTerms}
                onChange={(e) => setSettings({ ...settings, defaultTerms: e.target.value })}
                placeholder={t('billingSettings.termsPlaceholder')}
                className="w-full mt-1 px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px]"
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/billing/manage')}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {loading ? t('billingSettings.saving') : t('billingSettings.saveSettings')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
