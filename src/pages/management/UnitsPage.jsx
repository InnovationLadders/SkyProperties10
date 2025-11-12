import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Building2, Edit, Trash2, Search, Filter, Eye, Image as ImageIcon, Video, Download, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { UNIT_STATUS, UNIT_CATEGORY, FACILITY_TYPES } from '../../utils/constants';
import { exportUnitsData, importUnitsData, parseImportFile } from '../../utils/unitsImportExport';

export const UnitsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState({});
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('all');
  const [expandedFloors, setExpandedFloors] = useState({});
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unitsSnapshot, propertiesSnapshot, usersSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'units'), orderBy('createdAt', 'desc'))),
        getDocs(collection(db, 'properties')),
        getDocs(collection(db, 'users')),
      ]);

      const unitsData = unitsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const propertiesData = {};
      propertiesSnapshot.docs.forEach((doc) => {
        propertiesData[doc.id] = doc.data();
      });

      const usersData = {};
      usersSnapshot.docs.forEach((doc) => {
        usersData[doc.id] = doc.data();
      });

      setUnits(unitsData);
      setProperties(propertiesData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching units:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (unitId) => {
    if (!window.confirm(t('unit.deleteUnitConfirm'))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'units', unitId));
      setUnits(units.filter((u) => u.id !== unitId));
    } catch (error) {
      console.error('Error deleting unit:', error);
      alert(t('unit.deleteUnitFailed'));
    }
  };

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      properties[unit.propertyId]?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || (unit.category || UNIT_CATEGORY.NORMAL) === categoryFilter;
    const matchesFacilityType = facilityTypeFilter === 'all' || unit.facilityType === facilityTypeFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesFacilityType;
  });

  const normalUnits = filteredUnits.filter(unit => (unit.category || UNIT_CATEGORY.NORMAL) === UNIT_CATEGORY.NORMAL);
  const facilityUnits = filteredUnits.filter(unit => unit.category === UNIT_CATEGORY.FACILITY);

  const groupedFacilityUnits = facilityUnits.reduce((acc, unit) => {
    const floor = unit.floor || 'Unassigned';
    if (!acc[floor]) {
      acc[floor] = [];
    }
    acc[floor].push(unit);
    return acc;
  }, {});

  const toggleFloor = (floor) => {
    setExpandedFloors(prev => ({
      ...prev,
      [floor]: !prev[floor]
    }));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportUnitsData();
      alert(`${t('unit.exportSuccess')}: ${result.count} ${t('unit.unitsExported')}`);
    } catch (error) {
      console.error('Export error:', error);
      alert(t('unit.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const unitsData = await parseImportFile(file);
      setImportPreview(unitsData);
      setShowImportModal(true);
    } catch (error) {
      console.error('File parse error:', error);
      alert(error.message || t('unit.importParseFailed'));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;

    setImporting(true);
    try {
      const result = await importUnitsData(importPreview, {
        skipDuplicates: true,
        overwriteDuplicates: false,
      });

      if (result.success) {
        alert(`${t('unit.importSuccess')}: ${result.imported} ${t('unit.unitsImported')}\n${result.skipped > 0 ? `${t('unit.skipped')}: ${result.skipped}` : ''}`);
        setShowImportModal(false);
        setImportPreview(null);
        fetchData();
      } else {
        alert(`${t('unit.importFailed')}: ${result.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(t('unit.importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case UNIT_STATUS.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case UNIT_STATUS.RESERVED:
        return 'bg-yellow-100 text-yellow-800';
      case UNIT_STATUS.SOLD:
        return 'bg-red-100 text-red-800';
      case UNIT_STATUS.RENTED:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('unit.units')}</h1>
            <p className="text-muted-foreground">{t('unit.manageAllUnits')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting || units.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? t('unit.exporting') : t('unit.exportUnits')}
            </Button>
            <Button variant="outline" onClick={handleImportClick} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? t('unit.importing') : t('unit.importUnits')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button variant="outline" onClick={() => navigate('/units/visualizer')}>
              <Eye className="h-4 w-4 mr-2" />
              {t('unit.visualizer3D')}
            </Button>
            <Button onClick={() => navigate('/units/create')}>
              <Plus className="h-4 w-4 mr-2" />
              {t('unit.addUnit')}
            </Button>
          </div>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder={t('unit.searchUnits')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setFacilityTypeFilter('all');
            }}
            className="px-4 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">{t('unit.allCategories')}</option>
            <option value={UNIT_CATEGORY.NORMAL}>{t('unit.normalUnit')}</option>
            <option value={UNIT_CATEGORY.FACILITY}>{t('unit.facilityUnit')}</option>
          </select>
          {categoryFilter === UNIT_CATEGORY.FACILITY && (
            <select
              value={facilityTypeFilter}
              onChange={(e) => setFacilityTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">{t('unit.allFacilityTypes')}</option>
              <option value={FACILITY_TYPES.CAR_PARKING}>{t('unit.carParking')}</option>
              <option value={FACILITY_TYPES.OUTDOOR_PARK}>{t('unit.outdoorPark')}</option>
              <option value={FACILITY_TYPES.KIOSK}>{t('unit.kiosk')}</option>
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">{t('unit.allStatus')}</option>
            <option value={UNIT_STATUS.AVAILABLE}>{t('unit.available')}</option>
            <option value={UNIT_STATUS.RESERVED}>{t('unit.reserved')}</option>
            <option value={UNIT_STATUS.SOLD}>{t('unit.sold')}</option>
            <option value={UNIT_STATUS.RENTED}>{t('unit.rented')}</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUnits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('unit.noUnitsFound')}</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? t('unit.tryAdjustingFilters')
                  : t('unit.getStartedUnit')}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => navigate('/units/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('unit.addUnit')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {normalUnits.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{t('unit.normalUnits')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {normalUnits.map((unit, index) => (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                  {unit.media && unit.media.length > 0 && (
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      {unit.media.find(m => m.isPrimary) || unit.media[0] ? (
                        <img
                          src={(unit.media.find(m => m.isPrimary) || unit.media[0]).url}
                          alt={`Unit ${unit.unitNumber}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {unit.media.filter(m => m.type === 'image').length}
                        <Video className="h-3 w-3 ml-1" />
                        {unit.media.filter(m => m.type === 'video').length}
                      </div>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle>{t('unit.units')} {unit.unitNumber}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(unit.status)}`}>
                        {t(`unit.${unit.status}`)}
                      </span>
                    </div>
                    {unit.category === UNIT_CATEGORY.FACILITY && unit.facilityType && (
                      <div className="mb-2">
                        <span className="inline-flex items-center text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {unit.facilityType === FACILITY_TYPES.CAR_PARKING && t('unit.carParking')}
                          {unit.facilityType === FACILITY_TYPES.OUTDOOR_PARK && t('unit.outdoorPark')}
                          {unit.facilityType === FACILITY_TYPES.KIOSK && t('unit.kiosk')}
                        </span>
                      </div>
                    )}
                    <CardDescription>
                      {properties[unit.propertyId]?.name || t('unit.unknownProperty')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('unit.floor')}:</span>
                        <span className="font-medium">{unit.floor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('unit.type')}:</span>
                        <span className="font-medium">{unit.type || t('unit.na')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('unit.view')}:</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          unit.viewType === 'external'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {unit.viewType === 'external' ? t('property.external') : t('property.internal')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('unit.size')}:</span>
                        <span className="font-medium">{unit.size} sqm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('unit.price')}:</span>
                        <span className="font-medium text-primary">
                          ${unit.price?.toLocaleString()}
                        </span>
                      </div>
                      {(unit.ownerId || unit.tenantId) && (
                        <div className="border-t pt-2 mt-2">
                          {unit.ownerId && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('unit.owner')}:</span>
                              <span className="font-medium text-xs">
                                {users[unit.ownerId]?.displayName || users[unit.ownerId]?.email || t('unit.noOwner')}
                              </span>
                            </div>
                          )}
                          {unit.tenantId && (
                            <div className="flex justify-between mt-1">
                              <span className="text-muted-foreground">{t('unit.tenant')}:</span>
                              <span className="font-medium text-xs">
                                {users[unit.tenantId]?.displayName || users[unit.tenantId]?.email || t('unit.noTenant')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/units/edit/${unit.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(unit.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
                  ))}
                </div>
              </div>
            )}

            {facilityUnits.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">{t('unit.facilityUnits')}</h2>
                <div className="space-y-4">
                  {Object.entries(groupedFacilityUnits).sort(([a], [b]) => a.localeCompare(b)).map(([floor, floorUnits]) => (
                    <div key={floor} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFloor(floor)}
                        className="w-full px-4 py-3 bg-muted/50 hover:bg-muted flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          {expandedFloors[floor] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                          <span className="font-semibold">{t('unit.floor')} {floor}</span>
                          <span className="text-sm text-muted-foreground">({floorUnits.length} {t('unit.spaces')})</span>
                        </div>
                      </button>
                      {expandedFloors[floor] && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {floorUnits.map((unit, index) => (
                            <motion.div
                              key={unit.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                              <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                                {unit.media && unit.media.length > 0 && (
                                  <div className="relative aspect-video bg-gray-100 overflow-hidden">
                                    {unit.media.find(m => m.isPrimary) || unit.media[0] ? (
                                      <img
                                        src={(unit.media.find(m => m.isPrimary) || unit.media[0]).url}
                                        alt={`Unit ${unit.unitNumber}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Building2 className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                      <ImageIcon className="h-3 w-3" />
                                      {unit.media.filter(m => m.type === 'image').length}
                                      <Video className="h-3 w-3 ml-1" />
                                      {unit.media.filter(m => m.type === 'video').length}
                                    </div>
                                  </div>
                                )}
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <CardTitle>{unit.facilityType === FACILITY_TYPES.CAR_PARKING ? t('unit.carParking') : unit.facilityType === FACILITY_TYPES.OUTDOOR_PARK ? t('unit.outdoorPark') : t('unit.kiosk')} {unit.unitNumber}</CardTitle>
                                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(unit.status)}`}>
                                      {t(`unit.${unit.status}`)}
                                    </span>
                                  </div>
                                  <CardDescription>
                                    {properties[unit.propertyId]?.name || t('unit.unknownProperty')}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">{t('unit.floor')}:</span>
                                      <span className="font-medium">{unit.floor}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">{t('unit.size')}:</span>
                                      <span className="font-medium">{unit.size} sqm</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">{t('unit.price')}:</span>
                                      <span className="font-medium text-primary">
                                        ${unit.price?.toLocaleString()}
                                      </span>
                                    </div>
                                    {(unit.ownerId || unit.tenantId) && (
                                      <div className="border-t pt-2 mt-2">
                                        {unit.ownerId && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('unit.owner')}:</span>
                                            <span className="font-medium text-xs">
                                              {users[unit.ownerId]?.displayName || users[unit.ownerId]?.email || t('unit.noOwner')}
                                            </span>
                                          </div>
                                        )}
                                        {unit.tenantId && (
                                          <div className="flex justify-between mt-1">
                                            <span className="text-muted-foreground">{t('unit.tenant')}:</span>
                                            <span className="font-medium text-xs">
                                              {users[unit.tenantId]?.displayName || users[unit.tenantId]?.email || t('unit.noTenant')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(`/units/edit/${unit.id}`)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    {t('common.edit')}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(unit.id)}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showImportModal && importPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">{t('unit.importPreview')}</h2>
                <p className="text-muted-foreground mt-1">
                  {t('unit.reviewUnitsBeforeImport')}
                </p>
              </div>
              <div className="p-6 overflow-auto flex-1">
                <div className="mb-4">
                  <p className="text-sm">
                    <strong>{t('unit.totalUnits')}:</strong> {importPreview.length}
                  </p>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left">{t('unit.unitNumber')}</th>
                        <th className="px-4 py-2 text-left">{t('unit.floor')}</th>
                        <th className="px-4 py-2 text-left">{t('unit.category')}</th>
                        <th className="px-4 py-2 text-left">{t('unit.price')}</th>
                        <th className="px-4 py-2 text-left">{t('unit.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.slice(0, 50).map((unit, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{unit.unitNumber}</td>
                          <td className="px-4 py-2">{unit.floor}</td>
                          <td className="px-4 py-2">{unit.category || 'normal'}</td>
                          <td className="px-4 py-2">${unit.price?.toLocaleString()}</td>
                          <td className="px-4 py-2">{unit.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.length > 50 && (
                    <div className="p-4 bg-muted/50 text-center text-sm text-muted-foreground">
                      {t('unit.showingFirst50')}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreview(null);
                  }}
                  disabled={importing}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleConfirmImport} disabled={importing}>
                  {importing ? t('unit.importing') : t('unit.confirmImport')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
