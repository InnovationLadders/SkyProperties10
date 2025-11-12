import { useTranslation } from 'react-i18next';
import { PERMIT_STATUS } from '../../utils/constants';

export const PermitStatusBadge = ({ status }) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    switch (status) {
      case PERMIT_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PERMIT_STATUS.APPROVED:
        return 'bg-green-100 text-green-800 border-green-200';
      case PERMIT_STATUS.REJECTED:
        return 'bg-red-100 text-red-800 border-red-200';
      case PERMIT_STATUS.ACTIVE:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case PERMIT_STATUS.EXPIRED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case PERMIT_STATUS.REVOKED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}
    >
      {t(`permit.statuses.${status}`)}
    </span>
  );
};
