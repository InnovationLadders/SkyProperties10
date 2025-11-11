import { useTranslation } from 'react-i18next';
import { USER_ROLES } from '../../utils/constants';

const roleStyles = {
  [USER_ROLES.ADMIN]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [USER_ROLES.PROPERTY_MANAGER]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  [USER_ROLES.UNIT_OWNER]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  [USER_ROLES.TENANT]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  [USER_ROLES.SERVICE_PROVIDER]: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
};

const RoleBadge = ({ role }) => {
  console.log('[RoleBadge] Rendering for role:', role);
  const { t } = useTranslation();

  const getRoleLabel = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return t('user.roles.admin');
      case USER_ROLES.PROPERTY_MANAGER:
        return t('user.roles.propertyManager');
      case USER_ROLES.UNIT_OWNER:
        return t('user.roles.unitOwner');
      case USER_ROLES.TENANT:
        return t('user.roles.tenant');
      case USER_ROLES.SERVICE_PROVIDER:
        return t('user.roles.serviceProvider');
      default:
        return role;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
      {getRoleLabel(role)}
    </span>
  );
};

export default RoleBadge;
