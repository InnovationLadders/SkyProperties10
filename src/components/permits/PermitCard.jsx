import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, User, Eye, QrCode } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PermitStatusBadge } from './PermitStatusBadge';
import { AccessTypeBadge } from './AccessTypeBadge';
import { PermitQRCode } from './PermitQRCode';
import { isPermitActive } from '../../utils/permitsService';
import { PERMIT_STATUS } from '../../utils/constants';

export const PermitCard = ({ permit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formatDate = (timestamp) => {
    if (!timestamp) return t('common.unknown');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const handleViewDetails = () => {
    navigate(`/permits/${permit.id}`);
  };

  const showQRCode = permit.status === 'approved' && permit.qrCode;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {permit.propertyName}
              </h3>
              <PermitStatusBadge status={permit.status} />
            </div>
            {permit.unitNumber && (
              <p className="text-sm text-gray-600">
                {t('permit.unit')}: {permit.unitNumber}
              </p>
            )}
          </div>
        </div>

        {showQRCode && (
          <div className="mb-4 flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <PermitQRCode value={permit.qrCode} size={150} />
              <p className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
                <QrCode className="w-3 h-3" />
                {t('permit.scanQRCode')}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{permit.userName || permit.userEmail}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDate(permit.startDate)} - {formatDate(permit.endDate)}
            </span>
          </div>

          {permit.accessTypes && permit.accessTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {permit.accessTypes.map((type, index) => (
                <AccessTypeBadge key={index} type={type} />
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {t('permit.requestDate')}: {formatDate(permit.createdAt)}
          </div>
          <Button onClick={handleViewDetails} size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            {t('common.viewDetails')}
          </Button>
        </div>
      </div>
    </Card>
  );
};
