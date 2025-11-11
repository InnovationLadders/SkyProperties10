import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { BillCard } from '../../components/billing/BillCard';
import { BillingStats } from '../../components/billing/BillingStats';
import { useAuth } from '../../contexts/AuthContext';
import { getAllBills, getBillingStatistics } from '../../utils/billingService';
import { BILL_STATUS, BILL_TYPES } from '../../utils/constants';

export const MyBillsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billsData, statsData] = await Promise.all([
        getAllBills({ recipientId: currentUser.uid }),
        getBillingStatistics(currentUser.uid),
      ]);
      setBills(billsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewBill = (bill) => {
    navigate(`/billing/${bill.id}`);
  };

  const handlePayBill = (bill) => {
    navigate(`/billing/payment/${bill.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('billing.myBills')}</h1>
          <p className="text-muted-foreground">{t('billing.viewAllBills')}</p>
        </div>

        {stats && (
          <div className="mb-8">
            <BillingStats stats={stats} />
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder={t('billing.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t('billing.allStatuses')}</option>
            {Object.values(BILL_STATUS).map((status) => (
              <option key={status} value={status}>
                {t(`billing.statuses.${status}`)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-xl font-semibold mb-2">{t('billing.noBillsFound')}</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' ? t('common.filter') : t('billing.noBillsYet')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onViewClick={handleViewBill}
                onPayClick={handlePayBill}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
