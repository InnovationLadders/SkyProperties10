import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { User, Save, Upload, Trash2, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    bio: '',
    location: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile || currentUser) {
      setFormData({
        displayName: userProfile?.displayName || currentUser?.displayName || '',
        phoneNumber: userProfile?.phoneNumber || '',
        bio: userProfile?.bio || '',
        location: userProfile?.location || '',
      });
    }
  }, [userProfile, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        setError(t('profile.photoTooLarge'));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError(t('profile.invalidFileType'));
        return;
      }

      setPhotoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm(t('profile.deletePhotoConfirm'))) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateProfile(auth.currentUser, {
        photoURL: null,
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: null,
      });

      setPhotoPreview(null);
      setPhotoFile(null);
      setSuccess(t('profile.photoDeleted'));

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error deleting photo:', error);
      setError(t('profile.deletePhotoFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let photoURL = userProfile?.photoURL || currentUser?.photoURL || '';

      if (photoFile) {
        const photoRef = ref(storage, `profiles/${currentUser.uid}/${Date.now()}_${photoFile.name}`);
        await uploadBytes(photoRef, photoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL,
      });

      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        location: formData.location,
        photoURL,
        updatedAt: new Date().toISOString(),
      });

      setSuccess(t('profile.updateSuccess'));
      setPhotoFile(null);
      setPhotoPreview(null);

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('profile.profile')}</h1>
          <p className="text-muted-foreground">{t('profile.manageInfo')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar
                    src={photoPreview || userProfile?.photoURL || currentUser?.photoURL}
                    name={formData.displayName || currentUser?.email}
                    size="2xl"
                    className="border-4 border-white shadow-lg"
                  />
                  <label
                    htmlFor="photo"
                    className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">{t('profile.profilePhoto')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('profile.photoHint')}</p>
                  {(userProfile?.photoURL || currentUser?.photoURL || photoPreview) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDeletePhoto}
                      className="mt-2 text-red-600 hover:text-red-700"
                      disabled={loading}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t('profile.deletePhoto')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">{t('profile.emailCannotChange')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">{t('profile.displayName')}</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder={t('profile.yourName')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">{t('profile.phoneNumber')}</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder={t('profile.phonePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t('profile.bio')}</Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                  placeholder={t('profile.bioPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('profile.location')}</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder={t('profile.locationPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('profile.role')}</Label>
                <Input value={userProfile?.role || 'N/A'} disabled className="bg-muted capitalize" />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                  {success}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? t('profile.saving') : t('profile.saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
