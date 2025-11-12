import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileText, Filter, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { PermitStatusBadge } from '../../components/permits/PermitStatusBadge';
import { AccessTypeBadge } from '../../components/permits/AccessTypeBadge';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPermits } from '../../utils/permitsService';
import { PERMIT_STATUS, USER_ROLES } from '../../utils/constants';

const ManagePermitsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [permits, setPermits] = useState([]);
  const [filteredPermits, setFilteredPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (userProfile?.role === USER_ROLES.ADMIN || userProfile?.role === USER_ROLES.PROPERTY_MANAGER) {
      fetchPermits();
    } else {
      navigate('/permits');
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    filterPermits();
    calculateStats();
  }, [permits, searchTerm, statusFilter]);

  const fetchPermits = async () => {
    try {
      setLoading(true);
      const fetchedPermits = await getAllPermits();
      setPermits(fetchedPermits);
    } catch (error) {
      console.error('Error fetching permits:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPermits = () => {
    let filtered = [...permits];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (permit) =>
          permit.userName?.toLowerCase().includes(search) ||
          permit.userEmail?.toLowerCase().includes(search) ||
          permit.propertyName?.toLowerCase().includes(search) ||
          permit.unitNumber?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((permit) => permit.status === statusFilter);
    }

    setFilteredPermits(filtered);
  };

  const calculateStats = () => {
    setStats({
      total: permits.length,
      pending: permits.filter(p => p.status === PERMIT_STATUS.PENDING).length,
      approved: permits.filter(p => p.status === PERMIT_STATUS.APPROVED).length,
      rejected: permits.filter(p => p.status === PERMIT_STATUS.REJECTED).length,
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t('common.unknown');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8" />
          {t('permit.managePermits')}
        </h1>
        <p className="text-gray-600 mt-2">{t('permit.viewAllPermits')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">{t('permit.totalPermits')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">{t('permit.pendingPermits')}</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">{t('permit.statuses.approved')}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">{t('permit.statuses.rejected')}</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t('permit.searchPermits')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">{t('permit.allStatuses')}</option>
          <option value={PERMIT_STATUS.PENDING}>{t('permit.statuses.pending')}</option>
          <option value={PERMIT_STATUS.APPROVED}>{t('permit.statuses.approved')}</option>
          <option value={PERMIT_STATUS.REJECTED}>{t('permit.statuses.rejected')}</option>
          <option value={PERMIT_STATUS.ACTIVE}>{t('permit.statuses.active')}</option>
          <option value={PERMIT_STATUS.EXPIRED}>{t('permit.statuses.expired')}</option>
          <option value={PERMIT_STATUS.REVOKED}>{t('permit.statuses.revoked')}</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      ) : filteredPermits.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('permit.requestedBy')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('permit.property')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('permit.accessTypes')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('permit.duration')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('permit.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPermits.map((permit) => (
                    <tr key={permit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {permit.userName || t('common.unknown')}
                          </p>
                          <p className="text-sm text-gray-500">{permit.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {permit.propertyName || t('common.unknown')}
                          </p>
                          {permit.unitNumber && (
                            <p className="text-sm text-gray-500">
                              {t('unit.unitNumber')}: {permit.unitNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {permit.accessTypes?.map((type, index) => (
                            <AccessTypeBadge key={index} type={type} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <p>{formatDate(permit.startDate)}</p>
                          <p>{formatDate(permit.endDate)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PermitStatusBadge status={permit.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/permits/${permit.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('common.view')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('permit.noPermitsFound')}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all'
                ? t('unit.tryAdjustingFilters')
                : t('permit.noPermitsYet')}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ManagePermitsPage;
