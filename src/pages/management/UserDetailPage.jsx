import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, Calendar, Edit, Trash2, MapPin, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MainLayout } from '../../components/layout/MainLayout';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import RoleBadge from '../../components/management/RoleBadge';
import EditUserModal from '../../components/management/EditUserModal';
import UnitAssignmentModal from '../../components/management/UnitAssignmentModal';
import { getUserById, deleteUser } from '../../utils/userService';
import { USER_ROLES } from '../../utils/constants';

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await getUserById(userId);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      alert(t('user.fetchError'));
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      t('user.deleteConfirm', { name: user.displayName || user.email })
    );

    if (!confirmed) return;

    try {
      await deleteUser(userId);
      alert(t('user.deleteSuccess'));
      navigate('/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(t('user.deleteError'));
    }
  };

  const handleManageAssignments = () => {
    setShowAssignmentModal(true);
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    fetchUser();
  };

  const handleAssignmentChanged = () => {
    fetchUser();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t('common.unknown');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const canManageUser = () => {
    if (currentUser.role === USER_ROLES.ADMIN) return true;
    if (currentUser.role === USER_ROLES.PROPERTY_MANAGER && user?.role !== USER_ROLES.ADMIN) return true;
    return false;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('user.userNotFound')}
            </h3>
            <Button onClick={() => navigate('/users')} className="mt-4">
              {t('user.backToUsers')}
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/users')}
          className="mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('user.backToUsers')}
        </Button>

        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar
                src={user.photoURL}
                name={user.displayName || user.email}
                size="xl"
                className="mx-auto md:mx-0"
              />

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.displayName || t('user.noName')}
                  </h1>
                  <RoleBadge role={user.role} />
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-5 h-5" />
                    <span>{user.email}</span>
                  </div>

                  {user.phoneNumber && (
                    <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="w-5 h-5" />
                      <span>{user.phoneNumber}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {t('user.memberSince')} {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>

                {canManageUser() && (
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Button onClick={handleEdit} variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      {t('user.editUser')}
                    </Button>
                    <Button onClick={handleManageAssignments} variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('user.manageAssignments')}
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('user.deleteUser')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('user.assignedUnits')}
              </h2>
              {canManageUser() && (
                <Button size="sm" onClick={handleManageAssignments}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('user.manage')}
                </Button>
              )}
            </div>

            {!user.assignedUnits || user.assignedUnits.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  {t('user.noUnitsAssigned')}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {t('user.noUnitsAssignedDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.assignedUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {t('unit.unit')} {unit.unitNumber}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('unit.floor')} {unit.floor}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          unit.assignmentType === 'owner'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : unit.assignmentType === 'tenant'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}
                      >
                        {unit.assignmentType === 'owner'
                          ? t('user.owner')
                          : unit.assignmentType === 'tenant'
                          ? t('user.tenant')
                          : t('user.both')}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('unit.type')}: {unit.type || t('common.unknown')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('unit.status')}: {t(`unit.status.${unit.status}`) || unit.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {showEditModal && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={user}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {showAssignmentModal && (
        <UnitAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => setShowAssignmentModal(false)}
          user={user}
          onAssignmentChanged={handleAssignmentChanged}
        />
      )}
    </MainLayout>
  );
};

export default UserDetailPage;
