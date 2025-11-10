import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { useAuth } from '../../contexts/AuthContext';
import { TICKET_STATUS, USER_ROLES } from '../../utils/constants';
import { ArrowLeft, Clock, User, MapPin, AlertCircle, CheckCircle, Save, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, hasRole } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [property, setProperty] = useState(null);
  const [creator, setCreator] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);
  const [serviceProviders, setServiceProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicketData();
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      const unsubscribe = onSnapshot(doc(db, 'tickets', ticketId), (doc) => {
        if (doc.exists()) {
          const ticketData = { id: doc.id, ...doc.data() };
          setTicket(ticketData);
          setNewStatus(ticketData.status);
          if (ticketData.assignedTo) {
            setSelectedProvider(ticketData.assignedTo);
            fetchAssignedUser(ticketData.assignedTo);
          }
        }
      });

      const notesUnsubscribe = onSnapshot(
        query(collection(db, 'ticketNotes'), where('ticketId', '==', ticketId)),
        (snapshot) => {
          const notesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          notesData.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
          });
          setNotes(notesData);
        }
      );

      return () => {
        unsubscribe();
        notesUnsubscribe();
      };
    }
  }, [ticketId]);

  const fetchTicketData = async () => {
    setLoading(true);
    try {
      const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));

      if (!ticketDoc.exists()) {
        setError('Ticket not found');
        setLoading(false);
        return;
      }

      const ticketData = { id: ticketDoc.id, ...ticketDoc.data() };
      setTicket(ticketData);
      setNewStatus(ticketData.status);

      if (ticketData.propertyId) {
        const propertyDoc = await getDoc(doc(db, 'properties', ticketData.propertyId));
        if (propertyDoc.exists()) {
          setProperty(propertyDoc.data());
        }
      }

      if (ticketData.createdBy) {
        const creatorDoc = await getDoc(doc(db, 'users', ticketData.createdBy));
        if (creatorDoc.exists()) {
          setCreator(creatorDoc.data());
        }
      }

      if (ticketData.assignedTo) {
        setSelectedProvider(ticketData.assignedTo);
        await fetchAssignedUser(ticketData.assignedTo);
      }

      if (hasRole([USER_ROLES.ADMIN, USER_ROLES.PROPERTY_MANAGER])) {
        const usersQuery = query(
          collection(db, 'users'),
          where('role', '==', USER_ROLES.SERVICE_PROVIDER)
        );
        const usersSnapshot = await getDocs(usersQuery);
        const providers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setServiceProviders(providers);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setError('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedUser = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setAssignedUser(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching assigned user:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedProvider) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        assignedTo: selectedProvider,
        assignedBy: currentUser.uid,
        assignedAt: serverTimestamp(),
        status: TICKET_STATUS.ASSIGNED,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'ticketNotes'), {
        ticketId,
        userId: currentUser.uid,
        userName: userProfile?.displayName || userProfile?.email,
        content: `Ticket assigned to service provider`,
        type: 'system',
        createdAt: serverTimestamp(),
      });

      setError('');
      await fetchTicketData();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      setError('Failed to assign ticket');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === ticket.status) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === TICKET_STATUS.IN_PROGRESS && { startedAt: serverTimestamp() }),
        ...(newStatus === TICKET_STATUS.COMPLETED && { completedAt: serverTimestamp() }),
      });

      await addDoc(collection(db, 'ticketNotes'), {
        ticketId,
        userId: currentUser.uid,
        userName: userProfile?.displayName || userProfile?.email,
        content: `Status changed from ${ticket.status} to ${newStatus}`,
        type: 'system',
        createdAt: serverTimestamp(),
      });

      setError('');
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    setUpdating(true);
    try {
      await addDoc(collection(db, 'ticketNotes'), {
        ticketId,
        userId: currentUser.uid,
        userName: userProfile?.displayName || userProfile?.email,
        content: note,
        type: 'comment',
        createdAt: serverTimestamp(),
      });

      setNote('');
      setError('');
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case TICKET_STATUS.OPEN:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case TICKET_STATUS.ASSIGNED:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case TICKET_STATUS.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case TICKET_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case TICKET_STATUS.CLOSED:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 font-bold';
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const canAssign = hasRole([USER_ROLES.ADMIN, USER_ROLES.PROPERTY_MANAGER]);
  const canUpdateStatus =
    hasRole([USER_ROLES.ADMIN, USER_ROLES.PROPERTY_MANAGER]) ||
    (hasRole(USER_ROLES.SERVICE_PROVIDER) && ticket?.assignedTo === currentUser.uid);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          <Card className="mt-6">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{error}</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{ticket?.title}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(ticket?.status)}`}>
                          {ticket?.status}
                        </span>
                        <span className={`text-sm ${getPriorityColor(ticket?.priority)}`}>
                          {ticket?.priority} priority
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {ticket?.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{ticket?.description}</p>
                  </div>

                  {ticket?.imageUrl && (
                    <div>
                      <h3 className="font-semibold mb-2">Attachment</h3>
                      <img
                        src={ticket.imageUrl}
                        alt="Ticket attachment"
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {property?.name || 'Unknown Property'}
                        </p>
                        {ticket?.unitNumber && (
                          <p className="text-sm text-muted-foreground">Unit {ticket.unitNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Created By</p>
                        <p className="text-sm text-muted-foreground">
                          {creator?.displayName || creator?.email || 'Unknown'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket?.createdAt?.toDate
                            ? new Date(ticket.createdAt.toDate()).toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {assignedUser && (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Assigned To</p>
                          <p className="text-sm text-muted-foreground">
                            {assignedUser.displayName || assignedUser.email}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Notes & Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a comment or note..."
                      className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                    <Button type="submit" disabled={updating || !note.trim()}>
                      <Save className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </form>

                  <div className="space-y-3 pt-4 border-t">
                    {notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No notes yet
                      </p>
                    ) : (
                      notes.map((noteItem) => (
                        <div
                          key={noteItem.id}
                          className={`p-3 rounded-lg ${
                            noteItem.type === 'system'
                              ? 'bg-muted/50 border border-muted'
                              : 'bg-background border'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-medium">{noteItem.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {noteItem.createdAt?.toDate
                                ? new Date(noteItem.createdAt.toDate()).toLocaleString()
                                : 'N/A'}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">{noteItem.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            {canAssign && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Assign Ticket</CardTitle>
                    <CardDescription>Assign to a service provider</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Service Provider</Label>
                      <select
                        id="provider"
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value="">Select a provider</option>
                        {serviceProviders.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.displayName || provider.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={handleAssign}
                      disabled={updating || !selectedProvider || selectedProvider === ticket?.assignedTo}
                      className="w-full"
                    >
                      {updating ? 'Assigning...' : 'Assign Ticket'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {canUpdateStatus && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                    <CardDescription>Change ticket status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      >
                        <option value={TICKET_STATUS.OPEN}>Open</option>
                        <option value={TICKET_STATUS.ASSIGNED}>Assigned</option>
                        <option value={TICKET_STATUS.IN_PROGRESS}>In Progress</option>
                        <option value={TICKET_STATUS.COMPLETED}>Completed</option>
                        <option value={TICKET_STATUS.CLOSED}>Closed</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleStatusUpdate}
                      disabled={updating || newStatus === ticket?.status}
                      className="w-full"
                    >
                      {updating ? 'Updating...' : 'Update Status'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="pt-6">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
