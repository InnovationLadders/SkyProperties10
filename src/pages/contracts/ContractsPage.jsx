import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, FileText, Search } from 'lucide-react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { CONTRACT_STATUS, USER_ROLES } from '../../utils/constants';

export const ContractsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userProfile, hasRole } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [properties, setProperties] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let contractsQuery = query(collection(db, 'contracts'), orderBy('createdAt', 'desc'));

      if (userProfile?.role === USER_ROLES.TENANT) {
        contractsQuery = query(
          collection(db, 'contracts'),
          where('tenantId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      }

      const [contractsSnapshot, propertiesSnapshot] = await Promise.all([
        getDocs(contractsQuery),
        getDocs(collection(db, 'properties')),
      ]);

      const contractsData = contractsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const propertiesData = {};
      propertiesSnapshot.docs.forEach((doc) => {
        propertiesData[doc.id] = doc.data();
      });

      setContracts(contractsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.tenantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    properties[contract.propertyId]?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case CONTRACT_STATUS.ACTIVE:
        return 'bg-green-100 text-green-800';
      case CONTRACT_STATUS.EXPIRING:
        return 'bg-yellow-100 text-yellow-800';
      case CONTRACT_STATUS.EXPIRED:
        return 'bg-red-100 text-red-800';
      case CONTRACT_STATUS.DRAFT:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('contract.contracts')}</h1>
            <p className="text-muted-foreground">{t('contract.manageContracts')}</p>
          </div>
          {hasRole([USER_ROLES.ADMIN, USER_ROLES.PROPERTY_MANAGER]) && (
            <Button onClick={() => navigate('/contracts/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('contract.createContract')}
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder={t('contract.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('contract.noContractsFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? t('contract.tryAdjustingSearch') : t('contract.createFirstContract')}
              </p>
              {!searchTerm && hasRole([USER_ROLES.ADMIN, USER_ROLES.PROPERTY_MANAGER]) && (
                <Button onClick={() => navigate('/contracts/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('contract.createContract')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract, index) => (
              <motion.div
                key={contract.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/contracts/${contract.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{contract.tenantName || t('contract.unnamedContract')}</CardTitle>
                        <CardDescription className="mt-2">
                          {properties[contract.propertyId]?.name || t('ticket.unknownProperty')}
                          {contract.unitNumber && ` - ${t('unit.unitNumber')} ${contract.unitNumber}`}
                        </CardDescription>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(contract.status)}`}>
                        {t(`contract.statuses.${contract.status}`)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t('contract.startDate')}</p>
                        <p className="font-medium">
                          {contract.startDate
                            ? new Date(contract.startDate).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('contract.endDate')}</p>
                        <p className="font-medium">
                          {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('contract.rentAmount')}</p>
                        <p className="font-medium text-primary">
                          ${contract.rentAmount?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t('contract.type')}</p>
                        <p className="font-medium capitalize">{contract.type || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
