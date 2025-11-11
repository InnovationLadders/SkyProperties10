import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Phone, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { updateUser, changeUserRole } from '../../utils/userService';
import { USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    role: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleChange, setShowRoleChange] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || USER_ROLES.TENANT
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.displayName) {
      setError(t('user.displayNameRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      await updateUser(user.id, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber
      });

      if (formData.role !== user.role) {
        const confirmRoleChange = window.confirm(
          t('user.roleChangeConfirm', {
            oldRole: t(`user.roles.${getRoleKey(user.role)}`),
            newRole: t(`user.roles.${getRoleKey(formData.role)}`)
          })
        );

        if (confirmRoleChange) {
          await changeUserRole(user.id, formData.role);
        }
      }

      alert(t('user.updateSuccess'));
      onUserUpdated();
    } catch (error) {
      console.error('Error updating user:', error);
      setError(t('user.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const getRoleKey = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'admin';
      case USER_ROLES.PROPERTY_MANAGER:
        return 'propertyManager';
      case USER_ROLES.UNIT_OWNER:
        return 'unitOwner';
      case USER_ROLES.TENANT:
        return 'tenant';
      case USER_ROLES.SERVICE_PROVIDER:
        return 'serviceProvider';
      default:
        return 'tenant';
    }
  };

  const canEditRole = () => {
    return currentUser.role === USER_ROLES.ADMIN;
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('user.editUser')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Label className="text-xs text-gray-500 dark:text-gray-400">
              {t('user.email')}
            </Label>
            <p className="text-sm text-gray-900 dark:text-white mt-1">{user.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('user.emailCannotBeChanged')}
            </p>
          </div>

          <div>
            <Label htmlFor="displayName" required>
              <User className="w-4 h-4 inline mr-2" />
              {t('user.displayName')}
            </Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              placeholder={t('user.displayNamePlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">
              <Phone className="w-4 h-4 inline mr-2" />
              {t('user.phoneNumber')}
            </Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder={t('user.phoneNumberPlaceholder')}
            />
          </div>

          {canEditRole() && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="role" required>
                  <Shield className="w-4 h-4 inline mr-2" />
                  {t('user.role')}
                </Label>
                {formData.role !== user.role && (
                  <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t('user.roleWillChange')}
                  </span>
                )}
              </div>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value={USER_ROLES.ADMIN}>{t('user.roles.admin')}</option>
                <option value={USER_ROLES.PROPERTY_MANAGER}>{t('user.roles.propertyManager')}</option>
                <option value={USER_ROLES.UNIT_OWNER}>{t('user.roles.unitOwner')}</option>
                <option value={USER_ROLES.TENANT}>{t('user.roles.tenant')}</option>
                <option value={USER_ROLES.SERVICE_PROVIDER}>{t('user.roles.serviceProvider')}</option>
              </select>
            </div>
          )}

          {user.assignedUnits && user.assignedUnits.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                {t('user.assignedUnits')}: {user.assignedUnits.length}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {t('user.viewDetailsForUnits')}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
