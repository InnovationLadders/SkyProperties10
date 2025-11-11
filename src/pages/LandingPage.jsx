import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Building2, MapPin, DollarSign, Filter, Map as MapIcon, List } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { UNIT_STATUS } from '../utils/constants';
import { seedDatabase } from '../utils/seedData';
import { PropertiesMap } from '../components/property/PropertiesMap';
import bannerImage from '../assets/building1.jpg';

export const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('split');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const propertiesRef = collection(db, 'properties');
      const q = query(propertiesRef, orderBy('createdAt', 'desc'), limit(12));
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
        if (unit.status === UNIT_STATUS.AVAILABLE) {
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

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSeedData = async () => {
    if (window.confirm('Do you want to seed the database with sample properties and units?')) {
      const result = await seedDatabase();
      if (result.success) {
        alert('Database seeded successfully!');
        fetchProperties();
      } else {
        alert(`Error: ${result.error}`);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative text-white py-20 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bannerImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 drop-shadow-lg">
              {t('landing.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 drop-shadow-md">
              {t('landing.subtitle')}
            </p>

            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder={t('landing.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-12 px-4 rounded-md border border-input bg-white text-gray-900 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="sale">{t('landing.forSale')}</option>
                    <option value="rent">{t('landing.forRent')}</option>
                  </select>
                  <Button size="lg" className="h-12" onClick={() => setShowFilters(!showFilters)}>
                    <Filter className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/login">
                <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
                  {t('common.login')}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  {t('common.register')}
                </Button>
              </Link>
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
                {t('common.browseAsGuest')}
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      <section className="py-16 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">
                {t('landing.featuredProperties')}
              </h2>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="hidden md:flex"
                >
                  <List className="h-4 w-4 mr-2" />
                  {t('map.listView')}
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="hidden md:flex"
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  {t('map.mapView')}
                </Button>
                <Button
                  variant={viewMode === 'split' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('split')}
                  className="hidden lg:flex"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {t('map.splitView')}
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">{t('property.noPropertiesFound')}</h3>
                <p className="text-muted-foreground">
                  {t('property.tryAdjustingSearch')}
                </p>
              </div>
            ) : (
              <div className={`${viewMode === 'split' ? 'lg:grid lg:grid-cols-2 lg:gap-6' : ''}`}>
                <div className={`${viewMode === 'map' ? 'hidden' : viewMode === 'split' ? 'overflow-y-auto max-h-[800px] pr-2' : ''}`}>
                  <div className={`grid grid-cols-1 ${viewMode === 'list' ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
                    {filteredProperties.map((property, index) => (
                      <motion.div
                        key={property.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        onMouseEnter={() => setHoveredPropertyId(property.id)}
                        onMouseLeave={() => setHoveredPropertyId(null)}
                      >
                        <Card
                          className={`overflow-hidden transition-all cursor-pointer ${
                            hoveredPropertyId === property.id || selectedPropertyId === property.id
                              ? 'shadow-xl ring-2 ring-primary'
                              : 'hover:shadow-lg'
                          }`}
                          onClick={() => {
                            setSelectedPropertyId(property.id);
                            navigate(`/property/${property.id}`);
                          }}
                        >
                          <div className="h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center overflow-hidden">
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
                          <CardHeader className="space-y-3">
                            <CardTitle className="line-clamp-2 min-h-[3.5rem]">{property.name || t('property.unnamed')}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="line-clamp-1">{property.address || t('property.noAddress')}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {property.description || t('property.noDescription')}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="text-sm">
                                <span className="font-semibold">{property.totalUnits || 0}</span> {t('property.units')}
                              </div>
                              <div className="text-sm text-green-600">
                                <span className="font-semibold">{property.availableUnits || 0}</span> {t('property.available')}
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/property/${property.id}`);
                            }}>
                              {t('landing.viewDetails')}
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {(viewMode === 'map' || viewMode === 'split') && (
                  <div className={`${viewMode === 'map' ? 'w-full' : ''} ${viewMode === 'split' ? 'hidden lg:block' : ''} h-[600px] lg:h-[800px] rounded-lg overflow-hidden mt-6 lg:mt-0`}>
                    <PropertiesMap
                      key={`map-${viewMode}`}
                      properties={filteredProperties}
                      selectedPropertyId={hoveredPropertyId || selectedPropertyId}
                      onMarkerClick={(propertyId) => {
                        setSelectedPropertyId(propertyId);
                        const element = document.getElementById(`property-${propertyId}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.propertyManagement')}</h3>
              <p className="text-muted-foreground">
                {t('landing.propertyManagementDesc')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.smartMarketplace')}</h3>
              <p className="text-muted-foreground">
                {t('landing.smartMarketplaceDesc')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('landing.securePayments')}</h3>
              <p className="text-muted-foreground">
                {t('landing.securePaymentsDesc')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};
