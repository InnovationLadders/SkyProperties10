import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon, Search, Plus, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MainLayout } from '../../components/layout/MainLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import UserCard from '../../components/management/UserCard';
import CreateUserModal from '../../components/management/CreateUserModal';
import EditUserModal from '../../components/management/EditUserModal';
import { getAllUsers, getPropertyManagerUsers, deleteUser } from '../../utils/userService';
import { USER_ROLES } from '../../utils/constants';

console.log('[UsersPage] Module loaded successfully');

const UsersPage = () => {
  console.log('[UsersPage] Component rendering started');
  const { t } = useTranslation();
  const { currentUser, userProfile } = useAuth();
  console.log('[UsersPage] Auth context values:', {
    currentUser: currentUser ? { uid: currentUser.uid, email: currentUser.email } : null,
    userProfile: userProfile ? { uid: userProfile.uid, role: userProfile.role } : null
  });

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    console.log('[UsersPage] useEffect for fetchUsers triggered', { userProfile: userProfile ? 'exists' : 'null' });
    if (userProfile) {
      console.log('[UsersPage] Calling fetchUsers with role:', userProfile.role);
      fetchUsers();
    } else {
      console.log('[UsersPage] userProfile is null, skipping fetchUsers');
    }
  }, [userProfile]);

  useEffect(() => {
    console.log('[UsersPage] useEffect for filterUsers triggered', {
      usersCount: users.length,
      searchTerm,
      roleFilter
    });
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      console.log('[UsersPage] fetchUsers - Starting, role:', userProfile.role);
      setLoading(true);
      let fetchedUsers = [];

      if (userProfile.role === USER_ROLES.ADMIN) {
        console.log('[UsersPage] fetchUsers - User is ADMIN, fetching all users');
        fetchedUsers = await getAllUsers();
        console.log('[UsersPage] fetchUsers - Retrieved users:', fetchedUsers.length);
      } else if (userProfile.role === USER_ROLES.PROPERTY_MANAGER) {
        console.log('[UsersPage] fetchUsers - User is PROPERTY_MANAGER, fetching managed users');
        fetchedUsers = await getPropertyManagerUsers(userProfile.uid);
        console.log('[UsersPage] fetchUsers - Retrieved users:', fetchedUsers.length);
      } else {
        console.log('[UsersPage] fetchUsers - User role not authorized:', userProfile.role);
      }

      console.log('[UsersPage] fetchUsers - Setting users state:', fetchedUsers);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('[UsersPage] Error fetching users:', error);
      console.error('[UsersPage] Error details:', {
        message: error.message,
        stack: error.stack
      });
    } finally {
      console.log('[UsersPage] fetchUsers - Setting loading to false');
      setLoading(false);
    }
  };

  const filterUsers = () => {
    console.log('[UsersPage] filterUsers - Starting with users:', users.length);
    let filtered = [...users];

    if (searchTerm) {
      console.log('[UsersPage] filterUsers - Applying search term:', searchTerm);
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.displayName?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search) ||
          user.phoneNumber?.includes(search)
      );
      console.log('[UsersPage] filterUsers - After search filter:', filtered.length);
    }

    if (roleFilter !== 'all') {
      console.log('[UsersPage] filterUsers - Applying role filter:', roleFilter);
      filtered = filtered.filter(user => user.role === roleFilter);
      console.log('[UsersPage] filterUsers - After role filter:', filtered.length);
    }

    console.log('[UsersPage] filterUsers - Setting filteredUsers:', filtered.length);
    setFilteredUsers(filtered);
  };

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      t('user.deleteConfirm', { name: user.displayName || user.email })
    );

    if (!confirmed) return;

    try {
      await deleteUser(user.id);
      await fetchUsers();
      alert(t('user.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(t('user.deleteError'));
    }
  };

  const handleUserCreated = () => {
    setShowCreateModal(false);
    fetchUsers();
  };

  const handleUserUpdated = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const getRoleCount = (role) => {
    return users.filter(u => u.role === role).length;
  };

  if (!userProfile) {
    console.log('[UsersPage] Render - userProfile is null, showing loading state');
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  console.log('[UsersPage] Render - userProfile exists, proceeding to main render');
  console.log('[UsersPage] Render states:', {
    loading,
    usersCount: users.length,
    filteredUsersCount: filteredUsers.length
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('user.users')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {t('user.manageUsers')}
                </p>
              </div>
            </div>

            {userProfile?.role === USER_ROLES.ADMIN && (
              <Button onClick={handleCreateUser}>
                <Plus className="w-5 h-5 mr-2" />
                {t('user.createUser')}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('user.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {users.length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('user.roles.admin')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {getRoleCount(USER_ROLES.ADMIN)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('user.roles.propertyManager')}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {getRoleCount(USER_ROLES.PROPERTY_MANAGER)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('user.roles.unitOwner')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {getRoleCount(USER_ROLES.UNIT_OWNER)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('user.roles.tenant')}</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {getRoleCount(USER_ROLES.TENANT)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={t('user.searchUsers')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="relative w-full sm:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">{t('user.allRoles')}</option>
                <option value={USER_ROLES.ADMIN}>{t('user.roles.admin')}</option>
                <option value={USER_ROLES.PROPERTY_MANAGER}>{t('user.roles.propertyManager')}</option>
                <option value={USER_ROLES.UNIT_OWNER}>{t('user.roles.unitOwner')}</option>
                <option value={USER_ROLES.TENANT}>{t('user.roles.tenant')}</option>
                <option value={USER_ROLES.SERVICE_PROVIDER}>{t('user.roles.serviceProvider')}</option>
              </select>
            </div>
          </div>
        </div>

        {(() => {
          console.log('[UsersPage] Render - Determining which view to show', {
            loading,
            filteredUsersLength: filteredUsers.length
          });
          return null;
        })()}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {console.log('[UsersPage] Render - Showing loading skeleton')}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            {console.log('[UsersPage] Render - Showing empty state')}
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              {t('user.noUsersFound')}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {searchTerm || roleFilter !== 'all'
                ? t('user.tryDifferentFilters')
                : t('user.noUsersYet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {console.log('[UsersPage] Render - Rendering user cards, count:', filteredUsers.length)}
            {filteredUsers.map((user, index) => {
              console.log(`[UsersPage] Render - Rendering UserCard ${index + 1}/${filteredUsers.length}`, {
                userId: user.id,
                userName: user.displayName
              });
              try {
                return (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                    showActions={userProfile?.role === USER_ROLES.ADMIN || userProfile?.uid !== user.id}
                  />
                );
              } catch (error) {
                console.error(`[UsersPage] Error rendering UserCard for user ${user.id}:`, error);
                return null;
              }
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </MainLayout>
  );
};

export default UsersPage;
