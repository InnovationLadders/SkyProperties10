import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Edit, Trash2, FileText, Download, Building2, User, Calendar, DollarSign } from 'lucide-react';
import { CONTRACT_STATUS, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export const ContractDetailPage = () => {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const { hasRole } = useAuth();
  const [contract, setContract] = useState(null);
  const [property, setProperty] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  const fetchContractDetails = async () => {
    setLoading(true);
    try {
      const contractDoc = await getDoc(doc(db, 'contracts', contractId));
      if (!contractDoc.exists()) {
        setError('Contract not found');
        setLoading(false);
        return;
      }

      const contractData = { id: contractDoc.id, ...contractDoc.data() };
      setContract(contractData);

      if (contractData.propertyId) {
        const propertyDoc = await getDoc(doc(db, 'properties', contractData.propertyId));
        if (propertyDoc.exists()) {
          setProperty({ id: propertyDoc.id, ...propertyDoc.data() });
        }
      }

      if (contractData.unitId) {
        const unitDoc = await getDoc(doc(db, 'units', contractData.unitId));
        if (unitDoc.exists()) {
          setUnit({ id: unitDoc.id, ...unitDoc.data() });
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      setError('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'contracts', contractId));
      navigate('/contracts');
    } catch (error) {
      console.error('Error deleting contract:', error);
      setError('Failed to delete contract');
      setDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case CONTRACT_STATUS.ACTIVE:
        return 'bg-green-100 text-green-800';
      case CONTRACT_STATUS.EXPIRING:
        return 'bg-yellow-100 text-yellow-800';
      case CONTRACT_STATUS.EXPIRED:
        return 'bg-red-100 text-red-800';
      case CONTRACT_STATUS.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case CONTRACT_STATUS.TERMINATED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDuration = () => {
    if (!contract?.startDate || !contract?.endDate) return 'N/A';
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
    return `${months} months`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/contracts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </div>
          <Card>
            <CardContent className="py-12">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/contracts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contracts
            </Button>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{error || 'Contract not found'}</h3>
              <p className="text-muted-foreground">The contract you're looking for doesn't exist or has been removed.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/contracts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
          {hasRole([USER_ROLES.ADMIN, USER_ROLES.PROPERTY_MANAGER]) && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/contracts/edit/${contractId}`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{contract.tenantName || 'Unnamed Contract'}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    Contract ID: {contractId}
                  </CardDescription>
                </div>
                <span className={`text-sm px-4 py-2 rounded-full font-medium ${getStatusColor(contract.status)}`}>
                  {contract.status}
                </span>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Tenant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{contract.tenantName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{contract.tenantEmail || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-medium">{property?.name || 'Unknown Property'}</p>
                </div>
                {unit && (
                  <div>
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-medium">
                      Unit {unit.unitNumber} - Floor {unit.floor}
                    </p>
                  </div>
                )}
                {!unit && contract.unitNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Unit</p>
                    <p className="font-medium">Unit {contract.unitNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Contract Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(contract.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{calculateDuration()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rent Amount</p>
                  <p className="font-medium text-primary text-lg">
                    ${contract.rentAmount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deposit Amount</p>
                  <p className="font-medium text-lg">
                    ${contract.depositAmount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Frequency</p>
                  <p className="font-medium capitalize">
                    {contract.paymentFrequency || 'Monthly'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contract Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{contract.type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {contract.createdAt ? formatDate(contract.createdAt.toDate?.() || contract.createdAt) : 'N/A'}
                  </p>
                </div>
              </div>
              {contract.terms && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Terms and Notes</p>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{contract.terms}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {contract.documentUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Contract Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Contract Document</p>
                      <p className="text-sm text-muted-foreground">PDF Document</p>
                    </div>
                  </div>
                  <a
                    href={contract.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-semibold mb-2">Delete Contract</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to delete this contract? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
