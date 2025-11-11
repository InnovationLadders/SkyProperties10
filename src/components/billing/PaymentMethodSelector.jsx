import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2, Banknote } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Label } from '../ui/Label';
import { PAYMENT_METHODS } from '../../utils/constants';

export const PaymentMethodSelector = ({ selectedMethod, onMethodChange }) => {
  const { t } = useTranslation();

  const paymentMethods = [
    {
      id: PAYMENT_METHODS.VISA,
      name: t('billingSettings.visa'),
      icon: CreditCard,
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20',
    },
    {
      id: PAYMENT_METHODS.MASTERCARD,
      name: t('billingSettings.mastercard'),
      icon: CreditCard,
      color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20',
    },
    {
      id: PAYMENT_METHODS.MADA,
      name: t('billingSettings.mada'),
      icon: CreditCard,
      color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20',
    },
    {
      id: PAYMENT_METHODS.BANK_TRANSFER,
      name: t('billingSettings.bankTransfer'),
      icon: Building2,
      color: 'bg-green-50 border-green-200 dark:bg-green-900/20',
    },
    {
      id: PAYMENT_METHODS.CASH,
      name: t('billingSettings.cash'),
      icon: Banknote,
      color: 'bg-gray-50 border-gray-200 dark:bg-gray-900/20',
    },
  ];

  return (
    <div className="space-y-4">
      <Label>{t('paymentGateway.selectPaymentMethod')}</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-primary shadow-md'
                  : 'hover:shadow-md'
              } ${method.color}`}
              onClick={() => onMethodChange(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-background'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{method.name}</p>
                  </div>
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-primary-foreground"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
