import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Search, User, UserCheck, UserX } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { assignUnitToUser, unassignUnitFromUser, getUsersByRole } from '../../utils/userService';
import { USER_ROLES } from '../../utils/constants';

const UnitAssignmentModal = ({ isOpen, onClose, user, onAssignmentChanged }) => {
  const { t } = useTranslation();

  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    filterUnits();
  }, [units, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const unitsRef = collection(db, 'units');
      const unitsSnapshot = await getDocs(unitsRef);
      const unitsData = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const propertiesRef = collection(db, 'properties');
      const propertiesSnapshot = await getDocs(propertiesRef);
      const propertiesMap = {};
      propertiesSnapshot.docs.forEach(doc => {
        propertiesMap[doc.id] = doc.data();
      });

      const enrichedUnits = unitsData.map(unit => ({
        ...unit,
        propertyName: propertiesMap[unit.propertyId]?.name || t('common.unknown')
      }));

      setUnits(enrichedUnits);

      const [owners, tenants] = await Promise.all([
        getUsersByRole(USER_ROLES.UNIT_OWNER),
        getUsersByRole(USER_ROLES.TENANT)
      ]);

      setAvailableUsers([...owners, ...tenants]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(t('user.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const filterUnits = () => {
    let filtered = [...units];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        unit =>
          unit.unitNumber?.toLowerCase().includes(search) ||
          unit.floor?.toString().includes(search) ||
          unit.propertyName?.toLowerCase().includes(search)
      );
    }

    setFilteredUnits(filtered);
  };

  const handleAssignOwner = async (unit) => {
    const ownerUsers = availableUsers.filter(u => u.role === USER_ROLES.UNIT_OWNER);

    if (ownerUsers.length === 0) {
      alert(t('user.noOwnersAvailable'));
      return;
    }

    const selectedUserId = prompt(
      `${t('user.selectOwner')}:\n\n${ownerUsers.map((u, i) => `${i + 1}. ${u.displayName} (${u.email})`).join('\n')}\n\n${t('user.enterNumber')}`
    );

    if (!selectedUserId) return;

    const index = parseInt(selectedUserId) - 1;
    if (index < 0 || index >= ownerUsers.length) {
      alert(t('user.invalidSelection'));
      return;
    }

    try {
      await assignUnitToUser(unit.id, ownerUsers[index].id, 'owner');
      alert(t('user.assignmentSuccess'));
      await fetchData();
      if (onAssignmentChanged) onAssignmentChanged();
    } catch (error) {
      console.error('Error assigning owner:', error);
      alert(t('user.assignmentError'));
    }
  };

  const handleAssignTenant = async (unit) => {
    const tenantUsers = availableUsers.filter(u => u.role === USER_ROLES.TENANT);

    if (tenantUsers.length === 0) {
      alert(t('user.noTenantsAvailable'));
      return;
    }

    const selectedUserId = prompt(
      `${t('user.selectTenant')}:\n\n${tenantUsers.map((u, i) => `${i + 1}. ${u.displayName} (${u.email})`).join('\n')}\n\n${t('user.enterNumber')}`
    );

    if (!selectedUserId) return;

    const index = parseInt(selectedUserId) - 1;
    if (index < 0 || index >= tenantUsers.length) {
      alert(t('user.invalidSelection'));
      return;
    }

    try {
      await assignUnitToUser(unit.id, tenantUsers[index].id, 'tenant');
      alert(t('user.assignmentSuccess'));
      await fetchData();
      if (onAssignmentChanged) onAssignmentChanged();
    } catch (error) {
      console.error('Error assigning tenant:', error);
      alert(t('user.assignmentError'));
    }
  };

  const handleUnassignOwner = async (unit) => {
    const confirmed = window.confirm(t('user.unassignOwnerConfirm'));
    if (!confirmed) return;

    try {
      await unassignUnitFromUser(unit.id, 'owner');
      alert(t('user.unassignSuccess'));
      await fetchData();
      if (onAssignmentChanged) onAssignmentChanged();
    } catch (error) {
      console.error('Error unassigning owner:', error);
      alert(t('user.unassignError'));
    }
  };

  const handleUnassignTenant = async (unit) => {
    const confirmed = window.confirm(t('user.unassignTenantConfirm'));
    if (!confirmed) return;

    try {
      await unassignUnitFromUser(unit.id, 'tenant');
      alert(t('user.unassignSuccess'));
      await fetchData();
      if (onAssignmentChanged) onAssignmentChanged();
    } catch (error) {
      console.error('Error unassigning tenant:', error);
      alert(t('user.unassignError'));
    }
  };

  const getUserName = (userId) => {
    const user = availableUsers.find(u => u.id === userId);
    return user ? user.displayName || user.email : t('user.noAssignment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('user.manageAssignments')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('user.searchUnits')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {t('user.noUnitsFound')}
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('unit.unit')} {unit.unitNumber}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {unit.propertyName} - {t('unit.floor')} {unit.floor}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        {t(`unit.status.${unit.status}`)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('user.owner')}
                      </Label>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {unit.ownerId ? getUserName(unit.ownerId) : t('user.noOwner')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {unit.ownerId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignOwner(unit)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAssignOwner(unit)}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              {t('user.assign')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-gray-500 dark:text-gray-400">
                        {t('user.tenant')}
                      </Label>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {unit.tenantId ? getUserName(unit.tenantId) : t('user.noTenant')}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {unit.tenantId ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignTenant(unit)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAssignTenant(unit)}
                              disabled={unit.status === 'sold'}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              {t('user.assign')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              {t('common.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitAssignmentModal;
