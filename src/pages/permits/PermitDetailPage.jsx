import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, X, Ban, Calendar, User, Building2, Phone, Mail, FileText, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { PermitStatusBadge } from '../../components/permits/PermitStatusBadge';
import { AccessTypeBadge } from '../../components/permits/AccessTypeBadge';
import { PermitQRCode } from '../../components/permits/PermitQRCode';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPermitById,
  approvePermit,
  rejectPermit,
  revokePermit,
  generatePermitQRData
} from '../../utils/permitsService';
import { PERMIT_STATUS, USER_ROLES } from '../../utils/constants';

const PermitDetailPage = () => {
  const { t } = useTranslation();
  const { permitId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  useEffect(() => {
    fetchPermit();
  }, [permitId]);

  const fetchPermit = async () => {
    try {
      setLoading(true);
      const fetchedPermit = await getPermitById(permitId);
      setPermit(fetchedPermit);
    } catch (error) {
      console.error('Error fetching permit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm(t('permit.approveConfirm'))) return;

    try {
      setActionLoading(true);
      const qrCodeData = generatePermitQRData(permitId);
      await approvePermit(permitId, userProfile.displayName || userProfile.email, qrCodeData);
      alert(t('permit.approveSuccess'));
      fetchPermit();
    } catch (error) {
      console.error('Error approving permit:', error);
      alert(t('permit.approveError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert(t('permit.reasonPlaceholder'));
      return;
    }

    try {
      setActionLoading(true);
      await rejectPermit(permitId, userProfile.displayName || userProfile.email, rejectionReason);
      alert(t('permit.rejectSuccess'));
      setShowRejectModal(false);
      setRejectionReason('');
      fetchPermit();
    } catch (error) {
      console.error('Error rejecting permit:', error);
      alert(t('permit.rejectError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revocationReason.trim()) {
      alert(t('permit.reasonPlaceholder'));
      return;
    }

    try {
      setActionLoading(true);
      await revokePermit(permitId, userProfile.displayName || userProfile.email, revocationReason);
      alert(t('permit.revokeSuccess'));
      setShowRevokeModal(false);
      setRevocationReason('');
      fetchPermit();
    } catch (error) {
      console.error('Error revoking permit:', error);
      alert(t('permit.revokeError'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t('common.unknown');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return t('common.unknown');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const isAdmin = userProfile?.role === USER_ROLES.ADMIN || userProfile?.role === USER_ROLES.PROPERTY_MANAGER;
  const canApprove = isAdmin && permit?.status === PERMIT_STATUS.PENDING;
  const canRevoke = isAdmin && permit?.status === PERMIT_STATUS.APPROVED;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('permit.noPermitsFound')}</h3>
            <Button onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(isAdmin ? '/permits/manage' : '/permits')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('permit.backToPermits')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <FileText className="w-6 h-6" />
                  {t('permit.permitDetails')}
                </CardTitle>
                <PermitStatusBadge status={permit.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('permit.requestedBy')}
                </h3>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{permit.userName || t('common.unknown')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{permit.userEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{permit.mobileNumber || t('common.unknown')}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t('permit.property')}
                </h3>
                <div className="space-y-2 pl-6">
                  <p className="text-sm">
                    <span className="font-medium">{t('property.propertyName')}:</span>{' '}
                    {permit.propertyName || t('common.unknown')}
                  </p>
                  {permit.unitNumber && (
                    <p className="text-sm">
                      <span className="font-medium">{t('unit.unitNumber')}:</span> {permit.unitNumber}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('permit.accessTypes')}
                </h3>
                <div className="flex flex-wrap gap-2 pl-6">
                  {permit.accessTypes?.map((type, index) => (
                    <AccessTypeBadge key={index} type={type} />
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('permit.duration')}
                </h3>
                <div className="space-y-2 pl-6">
                  <p className="text-sm">
                    <span className="font-medium">{t('permit.validFrom')}:</span>{' '}
                    {formatDate(permit.startDate)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">{t('permit.validUntil')}:</span>{' '}
                    {formatDate(permit.endDate)}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('permit.purpose')}
                </h3>
                <p className="text-sm text-gray-600 pl-6">{permit.purpose}</p>
              </div>

              {(permit.governmentId || permit.passportNumber || permit.carPlateNumber) && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t('common.details')}
                  </h3>
                  <div className="space-y-2 pl-6">
                    {permit.governmentId && (
                      <p className="text-sm">
                        <span className="font-medium">{t('permit.governmentId')}:</span>{' '}
                        {permit.governmentId}
                      </p>
                    )}
                    {permit.passportNumber && (
                      <p className="text-sm">
                        <span className="font-medium">{t('permit.passportNumber')}:</span>{' '}
                        {permit.passportNumber}
                      </p>
                    )}
                    {permit.carPlateNumber && (
                      <p className="text-sm">
                        <span className="font-medium">{t('permit.carPlateNumber')}:</span>{' '}
                        {permit.carPlateNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(permit.approvedBy || permit.rejectedBy || permit.revokedBy) && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    {t('common.history')}
                  </h3>
                  <div className="space-y-2 pl-6">
                    {permit.approvedBy && (
                      <p className="text-sm">
                        <span className="font-medium">{t('permit.approvedBy')}:</span>{' '}
                        {permit.approvedBy} - {formatDateTime(permit.approvedAt)}
                      </p>
                    )}
                    {permit.rejectedBy && (
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{t('permit.rejectedBy')}:</span>{' '}
                          {permit.rejectedBy} - {formatDateTime(permit.rejectedAt)}
                        </p>
                        {permit.rejectionReason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{t('permit.rejectionReason')}:</span>{' '}
                            {permit.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                    {permit.revokedBy && (
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{t('permit.revokedBy')}:</span>{' '}
                          {permit.revokedBy} - {formatDateTime(permit.revokedAt)}
                        </p>
                        {permit.revocationReason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{t('permit.revocationReason')}:</span>{' '}
                            {permit.revocationReason}
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">{t('permit.requestDate')}:</span>{' '}
                      {formatDateTime(permit.createdAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {permit.status === PERMIT_STATUS.APPROVED && permit.qrCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('permit.qrCode')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <PermitQRCode value={permit.qrCode} size={200} />
                <p className="text-xs text-gray-500 text-center mt-4">
                  {t('permit.scanQRCode')}
                </p>
              </CardContent>
            </Card>
          )}

          {canApprove && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('common.actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {t('permit.approvePermit')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('permit.rejectPermit')}
                </Button>
              </CardContent>
            </Card>
          )}

          {canRevoke && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('common.actions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRevokeModal(true)}
                  disabled={actionLoading}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {t('permit.revokePermit')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{t('permit.rejectPermit')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">{t('permit.rejectionReason')}</Label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  placeholder={t('permit.reasonPlaceholder')}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={actionLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? t('common.loading') : t('permit.rejectPermit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{t('permit.revokePermit')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="revocationReason">{t('permit.revocationReason')}</Label>
                <textarea
                  id="revocationReason"
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary mt-1"
                  placeholder={t('permit.reasonPlaceholder')}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRevokeModal(false);
                    setRevocationReason('');
                  }}
                  disabled={actionLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleRevoke}
                  disabled={actionLoading || !revocationReason.trim()}
                >
                  {actionLoading ? t('common.loading') : t('permit.revokePermit')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PermitDetailPage;
