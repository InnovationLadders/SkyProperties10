import { useTranslation } from 'react-i18next';
import { Building2, Car, Wrench } from 'lucide-react';
import { PERMIT_TYPES } from '../../utils/constants';

export const AccessTypeBadge = ({ type }) => {
  const { t } = useTranslation();

  const getIcon = () => {
    switch (type) {
      case PERMIT_TYPES.MAIN_BUILDING:
        return <Building2 className="w-3 h-3" />;
      case PERMIT_TYPES.PARKING:
        return <Car className="w-3 h-3" />;
      case PERMIT_TYPES.UTILITY:
        return <Wrench className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
      {getIcon()}
      {t(`permit.types.${type}`)}
    </span>
  );
};
