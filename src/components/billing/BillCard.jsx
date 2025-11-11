import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, User, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { BILL_STATUS } from '../../utils/constants';

export const BillCard = ({ bill, onViewClick, onPayClick, showActions = true }) => {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case BILL_STATUS.PAID:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case BILL_STATUS.UNPAID:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case BILL_STATUS.OVERDUE:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case BILL_STATUS.PENDING:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case BILL_STATUS.CANCELLED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case BILL_STATUS.REFUNDED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {formatCurrency(bill.amount, bill.currency)}
              </CardTitle>
              <CardDescription className="mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  {t(`billing.types.${bill.billType}`)}
                </div>
              </CardDescription>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(bill.status)}`}>
              {t(`billing.statuses.${bill.status}`)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t('billing.dueDate')}
              </div>
              <span className="font-medium">{formatDate(bill.dueDate)}</span>
            </div>

            {bill.recipientName && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  {t('billing.recipient')}
                </div>
                <span className="font-medium">{bill.recipientName}</span>
              </div>
            )}

            {bill.issueDate && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {t('billing.issueDate')}
                </div>
                <span className="font-medium">{formatDate(bill.issueDate)}</span>
              </div>
            )}

            {bill.description && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground line-clamp-2">{bill.description}</p>
              </div>
            )}

            {showActions && (
              <div className="flex gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => onViewClick(bill)} className="flex-1">
                  {t('billing.viewBill')}
                </Button>
                {bill.status === BILL_STATUS.UNPAID || bill.status === BILL_STATUS.OVERDUE ? (
                  <Button size="sm" onClick={() => onPayClick(bill)} className="flex-1">
                    {t('billing.payNow')}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
