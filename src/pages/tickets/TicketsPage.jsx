import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Ticket, Search, Filter } from 'lucide-react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { TICKET_STATUS, USER_ROLES } from '../../utils/constants';

export const TicketsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [properties, setProperties] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!currentUser || !userProfile) return;
    fetchData();
  }, [currentUser, userProfile]);

  const fetchData = async () => {
    if (!currentUser || !userProfile) return;

    setLoading(true);
    try {
      let ticketsQuery;

      if (userProfile.role === USER_ROLES.TENANT) {
        ticketsQuery = query(
          collection(db, 'tickets'),
          where('createdBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      } else if (userProfile.role === USER_ROLES.SERVICE_PROVIDER) {
        ticketsQuery = query(
          collection(db, 'tickets'),
          where('assignedTo', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        ticketsQuery = query(
          collection(db, 'tickets'),
          orderBy('createdAt', 'desc')
        );
      }

      const [ticketsSnapshot, propertiesSnapshot] = await Promise.all([
        getDocs(ticketsQuery),
        getDocs(collection(db, 'properties')),
      ]);

      const ticketsData = ticketsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const propertiesData = {};
      propertiesSnapshot.docs.forEach((doc) => {
        propertiesData[doc.id] = doc.data();
      });

      setTickets(ticketsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case TICKET_STATUS.OPEN:
        return 'bg-blue-100 text-blue-800';
      case TICKET_STATUS.ASSIGNED:
        return 'bg-purple-100 text-purple-800';
      case TICKET_STATUS.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case TICKET_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TICKET_STATUS.CLOSED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Maintenance Tickets</h1>
            <p className="text-muted-foreground">
              {userProfile?.role === USER_ROLES.SERVICE_PROVIDER
                ? 'Tickets assigned to you'
                : 'Manage maintenance requests'}
            </p>
          </div>
          <Button onClick={() => navigate('/tickets/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ticket
          </Button>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value={TICKET_STATUS.OPEN}>Open</option>
            <option value={TICKET_STATUS.ASSIGNED}>Assigned</option>
            <option value={TICKET_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={TICKET_STATUS.COMPLETED}>Completed</option>
            <option value={TICKET_STATUS.CLOSED}>Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first maintenance ticket'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => navigate('/tickets/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {ticket.title}
                          <span className={`text-sm font-normal ${getPriorityColor(ticket.priority)}`}>
                            ({ticket.priority || 'normal'} priority)
                          </span>
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {properties[ticket.propertyId]?.name || 'Unknown Property'}
                          {ticket.unitNumber && ` - Unit ${ticket.unitNumber}`}
                        </CardDescription>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Category: {ticket.category || 'General'}</span>
                      <span>
                        Created:{' '}
                        {ticket.createdAt?.toDate
                          ? new Date(ticket.createdAt.toDate()).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
