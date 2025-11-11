import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, Users, Ticket, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { USER_ROLES } from '../utils/constants';

export const DashboardPage = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getDashboardCards = () => {
    const role = userProfile?.role;

    if (role === USER_ROLES.ADMIN || role === USER_ROLES.PROPERTY_MANAGER) {
      return [
        {
          title: t('property.properties'),
          description: t('dashboard.manageProperties'),
          icon: Building2,
          link: '/properties',
          color: 'from-primary to-primary-600',
        },
        {
          title: t('unit.units'),
          description: t('dashboard.manageUnits'),
          icon: Building2,
          link: '/units',
          color: 'from-secondary to-secondary-700',
        },
        {
          title: t('ticket.tickets'),
          description: t('dashboard.maintenanceTickets'),
          icon: Ticket,
          link: '/tickets',
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: t('contract.contracts'),
          description: t('dashboard.manageContracts'),
          icon: FileText,
          link: '/contracts',
          color: 'from-purple-500 to-purple-600',
        },
      ];
    }

    if (role === USER_ROLES.UNIT_OWNER) {
      return [
        {
          title: t('dashboard.myUnits'),
          description: t('dashboard.manageUnits'),
          icon: Building2,
          link: '/my-units',
          color: 'from-primary to-primary-600',
        },
        {
          title: t('ticket.tickets'),
          description: t('dashboard.maintenanceRequests'),
          icon: Ticket,
          link: '/tickets',
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: t('contract.contracts'),
          description: t('dashboard.viewContracts'),
          icon: FileText,
          link: '/contracts',
          color: 'from-purple-500 to-purple-600',
        },
      ];
    }

    if (role === USER_ROLES.TENANT) {
      return [
        {
          title: t('dashboard.myRental'),
          description: t('dashboard.viewRentalDetails'),
          icon: Building2,
          link: '/my-rental',
          color: 'from-primary to-primary-600',
        },
        {
          title: t('ticket.tickets'),
          description: t('dashboard.submitRequests'),
          icon: Ticket,
          link: '/tickets',
          color: 'from-blue-500 to-blue-600',
        },
        {
          title: t('payment.payments'),
          description: t('dashboard.viewPayments'),
          icon: FileText,
          link: '/payments',
          color: 'from-green-500 to-green-600',
        },
      ];
    }

    if (role === USER_ROLES.SERVICE_PROVIDER) {
      return [
        {
          title: t('dashboard.myServices'),
          description: t('dashboard.manageServices'),
          icon: Building2,
          link: '/services',
          color: 'from-primary to-primary-600',
        },
        {
          title: t('dashboard.assignedTickets'),
          description: t('dashboard.workTickets'),
          icon: Ticket,
          link: '/tickets',
          color: 'from-blue-500 to-blue-600',
        },
      ];
    }

    return [];
  };

  const cards = getDashboardCards();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t('common.welcomeBack')}, {userProfile?.displayName || userProfile?.email}
            </h1>
            <p className="text-muted-foreground">
              {t('dashboard.role')}: {userProfile?.role}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => navigate(card.link)}
                >
                  <CardHeader>
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-primary hover:underline">
                      {t('common.viewDetails')} →
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {cards.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.welcomeMessage')}</h3>
                <p className="text-muted-foreground">
                  {t('dashboard.welcomeDescription')}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};
