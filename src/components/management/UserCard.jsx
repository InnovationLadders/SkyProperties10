import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Edit, Trash2, MapPin } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import RoleBadge from './RoleBadge';

const UserCard = ({ user, onEdit, onDelete, showActions = true }) => {
  console.log('[UserCard] Rendering for user:', {
    userId: user?.id,
    userName: user?.displayName,
    userEmail: user?.email,
    showActions
  });
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleViewDetails = () => {
    console.log('[UserCard] Navigating to user details:', user.id);
    navigate(`/users/${user.id}`);
  };

  try {
    console.log('[UserCard] Rendering Card component for:', user.displayName || user.email);
    return (
      <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <Avatar
            src={user.photoURL}
            name={user.displayName || user.email}
            size="lg"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={handleViewDetails}
                >
                  {user.displayName || t('user.noName')}
                </h3>
                <div className="mt-1">
                  <RoleBadge role={user.role} />
                </div>
              </div>

              {showActions && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(user)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              {user.phoneNumber && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}

              {user.assignedUnits && user.assignedUnits.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {t('user.unitsCount', { count: user.assignedUnits.length })}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                className="w-full"
              >
                {t('user.viewDetails')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
    );
  } catch (error) {
    console.error('[UserCard] Error rendering card:', error);
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <div className="p-6">
          <p className="text-red-600">Error rendering user card</p>
        </div>
      </Card>
    );
  }
};

export default UserCard;
