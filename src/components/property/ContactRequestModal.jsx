import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { useAuth } from '../../contexts/AuthContext';
import { createContactRequest } from '../../utils/contactRequestService';

export const ContactRequestModal = ({ isOpen, onClose, property, unit }) => {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.displayName || '',
    email: userProfile?.email || '',
    phoneNumber: userProfile?.phoneNumber || '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      alert(t('contactRequest.nameRequired'));
      return;
    }

    try {
      setLoading(true);
      await createContactRequest({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        message: formData.message,
        propertyId: property.id,
        propertyName: property.name || property.propertyName,
        unitId: unit?.id || null,
        unitNumber: unit?.unitNumber || '',
        userId: userProfile?.uid || null,
        userRole: userProfile?.role || null,
      });

      alert(t('contactRequest.requestSuccess'));
      onClose();
      setFormData({
        name: userProfile?.displayName || '',
        email: userProfile?.email || '',
        phoneNumber: userProfile?.phoneNumber || '',
        message: '',
      });
    } catch (error) {
      console.error('Error submitting contact request:', error);
      alert(t('contactRequest.requestError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('contactRequest.requestContact')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {property?.name || property?.propertyName}
              {unit && ` - ${t('unit.unitNumber')}: ${unit.unitNumber}`}
            </p>
          </div>

          <div>
            <Label htmlFor="name">{t('contactRequest.name')} *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('contactRequest.namePlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">{t('contactRequest.email')} *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('contactRequest.emailPlaceholder')}
              required
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">{t('contactRequest.phoneNumber')}</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder={t('contactRequest.phoneNumberPlaceholder')}
            />
          </div>

          <div>
            <Label htmlFor="message">{t('contactRequest.message')} *</Label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder={t('contactRequest.messagePlaceholder')}
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
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
              {loading ? t('contactRequest.sending') : t('contactRequest.submitRequest')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
