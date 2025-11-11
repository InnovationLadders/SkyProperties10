import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Building2, Edit, Trash2, Search } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export const PropertiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const unitsRef = collection(db, 'units');
      const unitsSnapshot = await getDocs(unitsRef);

      const unitsByProperty = {};
      unitsSnapshot.docs.forEach((doc) => {
        const unit = doc.data();
        const propertyId = unit.propertyId;
        if (!unitsByProperty[propertyId]) {
          unitsByProperty[propertyId] = { total: 0, available: 0 };
        }
        unitsByProperty[propertyId].total += 1;
        if (unit.status === 'available') {
          unitsByProperty[propertyId].available += 1;
        }
      });

      const propertiesData = snapshot.docs.map((doc) => {
        const propertyId = doc.id;
        const counts = unitsByProperty[propertyId] || { total: 0, available: 0 };
        return {
          id: propertyId,
          ...doc.data(),
          totalUnits: counts.total,
          availableUnits: counts.available,
        };
      });

      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm(t('property.deleteConfirm'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      setProperties(properties.filter((p) => p.id !== propertyId));
    } catch (error) {
      console.error('Error deleting property:', error);
      alert(t('property.deleteFailed'));
    }
  };

  const filteredProperties = properties.filter((property) =>
    property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('property.properties')}</h1>
            <p className="text-muted-foreground">
              {t('property.manageAll')}
            </p>
          </div>
          <Button onClick={() => navigate('/properties/create')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('property.addProperty')}
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder={t('property.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('property.noPropertiesFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? t('property.tryAdjustingSearch') : t('property.getStarted')}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/properties/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('property.addProperty')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div
                    className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    {property.imageUrl ? (
                      <img
                        src={property.imageUrl}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-24 w-24 text-primary opacity-50" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{property.name || t('property.unnamed')}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {property.address || t('property.noAddress')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {property.description || t('property.noDescription')}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-semibold">{property.totalUnits || 0}</span> {t('property.units').toLowerCase()}
                      </div>
                      <div className="text-green-600">
                        <span className="font-semibold">{property.availableUnits || 0}</span> {t('property.available')}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/properties/edit/${property.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(property.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
