import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { BillCard } from '../../components/billing/BillCard';
import { BillingStats } from '../../components/billing/BillingStats';
import { useAuth } from '../../contexts/AuthContext';
import { getAllBills, getBillingStatistics } from '../../utils/billingService';
import { BILL_STATUS, BILL_TYPES, USER_ROLES } from '../../utils/constants';

export const BillsManagementPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billsData, statsData] = await Promise.all([
        getAllBills(),
        getBillingStatistics(),
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
      bill.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesType = typeFilter === 'all' || bill.billType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleViewBill = (bill) => {
    navigate(`/billing/${bill.id}`);
  };

  const handlePayBill = (bill) => {
    navigate(`/billing/payment/${bill.id}`);
  };

  const canManageBills = userProfile?.role === USER_ROLES.ADMIN || userProfile?.role === USER_ROLES.PROPERTY_MANAGER;

  if (!canManageBills) {
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('billing.manageBills')}</h1>
              <p className="text-muted-foreground">{t('billing.viewAllBills')}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/billing/settings')}>
                {t('navbar.settings')}
              </Button>
              <Button onClick={() => navigate('/billing/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('billing.createBill')}
              </Button>
            </div>
          </div>
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

          <div className="flex gap-2">
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

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('billing.allTypes')}</option>
              {Object.values(BILL_TYPES).map((type) => (
                <option key={type} value={type}>
                  {t(`billing.types.${type}`)}
                </option>
              ))}
            </select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {t('billing.exportBills')}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <p className="text-muted-foreground mb-6">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? t('common.filter')
                  : t('billing.getStarted')}
              </p>
              {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
                <Button onClick={() => navigate('/billing/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('billing.createBill')}
                </Button>
              )}
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
