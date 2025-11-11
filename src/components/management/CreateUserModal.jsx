import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Mail, Lock, User, Phone, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { createUser } from '../../utils/userService';
import { USER_ROLES } from '../../utils/constants';

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    role: USER_ROLES.TENANT
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.email) {
      setError(t('user.emailRequired'));
      return false;
    }

    if (!formData.email.includes('@')) {
      setError(t('user.invalidEmail'));
      return false;
    }

    if (!formData.password) {
      setError(t('user.passwordRequired'));
      return false;
    }

    if (formData.password.length < 8) {
      setError(t('user.passwordTooShort'));
      return false;
    }

    if (!formData.displayName) {
      setError(t('user.displayNameRequired'));
      return false;
    }

    if (!formData.role) {
      setError(t('user.roleRequired'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      await createUser(formData);

      alert(t('user.createSuccess'));
      onUserCreated();
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError(t('user.emailAlreadyExists'));
      } else if (error.code === 'auth/weak-password') {
        setError(t('user.weakPassword'));
      } else {
        setError(t('user.createError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('user.createUser')}
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

          <div>
            <Label htmlFor="email" required>
              <Mail className="w-4 h-4 inline mr-2" />
              {t('user.email')}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('user.emailPlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="password" required>
              <Lock className="w-4 h-4 inline mr-2" />
              {t('user.password')}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t('user.passwordPlaceholder')}
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('user.passwordHint')}
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

          <div>
            <Label htmlFor="role" required>
              <Shield className="w-4 h-4 inline mr-2" />
              {t('user.role')}
            </Label>
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
              {loading ? t('common.creating') : t('user.createUser')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
