import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Wrench, Star, Clock, CheckCircle, Edit, Save, Plus } from 'lucide-react';
import { TICKET_STATUS } from '../../utils/constants';

export const ServicesPage = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [allTickets, setAllTickets] = useState([]);
  const [completedTickets, setCompletedTickets] = useState([]);
  const [activeTickets, setActiveTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    specialties: '',
    description: '',
    hourlyRate: '',
  });

  useEffect(() => {
    fetchServiceData();
  }, []);

  const fetchServiceData = async () => {
    setLoading(true);
    try {
      setProfileData({
        displayName: userProfile?.displayName || '',
        phone: userProfile?.phone || '',
        specialties: userProfile?.specialties || '',
        description: userProfile?.description || '',
        hourlyRate: userProfile?.hourlyRate || '',
      });

      const ticketsQuery = query(
        collection(db, 'tickets'),
        where('assignedTo', '==', currentUser.uid)
      );
      const ticketsSnapshot = await getDocs(ticketsQuery);
      const ticketsData = ticketsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAllTickets(ticketsData);

      const completed = ticketsData.filter(ticket =>
        ticket.status === TICKET_STATUS.COMPLETED ||
        ticket.status === TICKET_STATUS.CLOSED ||
        ticket.status === TICKET_STATUS.RATED
      );
      setCompletedTickets(completed);

      const active = ticketsData.filter(ticket =>
        ticket.status === TICKET_STATUS.OPEN ||
        ticket.status === TICKET_STATUS.ASSIGNED ||
        ticket.status === TICKET_STATUS.IN_PROGRESS
      );
      setActiveTickets(active);
    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...profileData,
        updatedAt: serverTimestamp(),
      });
      setEditingProfile(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const stats = [
    {
      title: 'Completed Jobs',
      value: completedTickets.length,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Active Tickets',
      value: activeTickets.length,
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Total Tickets',
      value: allTickets.length,
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Services</h1>
          <p className="text-muted-foreground">Manage your service provider profile</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
                  <div className="flex justify-between items-center">
                    <CardTitle>Profile Information</CardTitle>
                    {!editingProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProfile(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingProfile ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          value={profileData.displayName}
                          onChange={handleChange}
                          placeholder="Your name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleChange}
                          placeholder="+1234567890"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="specialties">Specialties</Label>
                        <Input
                          id="specialties"
                          name="specialties"
                          value={profileData.specialties}
                          onChange={handleChange}
                          placeholder="Plumbing, Electrical, HVAC..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Hourly Rate</Label>
                        <Input
                          id="hourlyRate"
                          name="hourlyRate"
                          type="number"
                          value={profileData.hourlyRate}
                          onChange={handleChange}
                          placeholder="50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          name="description"
                          value={profileData.description}
                          onChange={handleChange}
                          className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                          placeholder="Tell us about your experience and services..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button type="submit" disabled={loading}>
                          <Save className="h-4 w-4 mr-2" />
                          {loading ? 'Saving...' : 'Save Profile'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingProfile(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p className="text-lg">{userProfile?.displayName || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-lg">{userProfile?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-lg">{userProfile?.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Specialties</p>
                        <p className="text-lg">{userProfile?.specialties || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                        <p className="text-lg">
                          {userProfile?.hourlyRate ? `$${userProfile.hourlyRate}/hr` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                        <p className="text-base">{userProfile?.description || 'No description provided'}</p>
                      </div>
                    </div>
                  )}
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
                  <CardTitle>Recent Completed Jobs</CardTitle>
                  <CardDescription>Your work history</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : completedTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No completed jobs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedTickets.slice(0, 5).map(ticket => (
                        <div
                          key={ticket.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{ticket.title}</p>
                              <p className="text-sm text-muted-foreground">{ticket.category}</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Completed: {ticket.completedAt?.toDate
                              ? new Date(ticket.completedAt.toDate()).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => navigate('/tickets')}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Assigned Tickets
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Account Settings
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="text-sm font-semibold">
                      {completedTickets.length > 0 ? '100%' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Jobs</span>
                    <span className="text-sm font-semibold">{completedTickets.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Average Rating</span>
                    <span className="text-sm font-semibold">N/A</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
