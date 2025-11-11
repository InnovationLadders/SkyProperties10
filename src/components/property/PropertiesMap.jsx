import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createCustomIcon } from '../../utils/mapIcons';

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
    }
  }, [center, zoom, map]);

  return null;
};

export const PropertiesMap = ({ properties, selectedPropertyId, onMarkerClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState([24.7136, 46.6753]);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapKey, setMapKey] = useState(0);
  const mapInitialized = useRef(false);

  const propertiesWithCoordinates = useMemo(() => {
    return properties.filter(
      (p) => p.coordinates && p.coordinates.lat && p.coordinates.lng
    );
  }, [properties]);

  useEffect(() => {
    if (!mapInitialized.current && propertiesWithCoordinates.length > 0) {
      mapInitialized.current = true;
      setMapKey(prev => prev + 1);
    }
  }, [propertiesWithCoordinates.length]);

  useEffect(() => {
    if (propertiesWithCoordinates.length > 0) {
      const lats = propertiesWithCoordinates.map((p) => p.coordinates.lat);
      const lngs = propertiesWithCoordinates.map((p) => p.coordinates.lng);

      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs),
      };

      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;

      setMapCenter([centerLat, centerLng]);

      const latDiff = bounds.north - bounds.south;
      const lngDiff = bounds.east - bounds.west;
      const maxDiff = Math.max(latDiff, lngDiff);

      if (maxDiff < 0.01) {
        setMapZoom(14);
      } else if (maxDiff < 0.05) {
        setMapZoom(12);
      } else if (maxDiff < 0.1) {
        setMapZoom(11);
      } else {
        setMapZoom(10);
      }
    }
  }, [propertiesWithCoordinates]);

  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find((p) => p.id === selectedPropertyId);
      if (property && property.coordinates) {
        setMapCenter([property.coordinates.lat, property.coordinates.lng]);
        setMapZoom(15);
      }
    }
  }, [selectedPropertyId, properties]);

  const handleViewDetails = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  if (propertiesWithCoordinates.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-6">
          <p className="text-muted-foreground">{t('map.noPropertiesWithCoordinates')}</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      key={mapKey}
      center={mapCenter}
      zoom={mapZoom}
      className="w-full h-full rounded-lg"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={{ lat: mapCenter[0], lng: mapCenter[1] }} zoom={mapZoom} />

      {propertiesWithCoordinates.map((property) => {
        const isSelected = selectedPropertyId === property.id;
        const icon = createCustomIcon(
          isSelected ? '#f97316' : '#3b82f6',
          isSelected,
          property.name || 'Unnamed Property'
        );

        return (
          <Marker
            key={property.id}
            position={[property.coordinates.lat, property.coordinates.lng]}
            icon={icon}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(property.id);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-sm mb-1 text-gray-900">
                  {property.name || t('property.unnamed')}
                </h3>
                <div className="flex items-start gap-1 text-xs text-gray-600 mb-2">
                  <span className="line-clamp-2">
                    {property.address || t('property.noAddress')}
                  </span>
                </div>
                {property.price && (
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <DollarSign className="h-3 w-3" />
                    <span>${property.price?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex gap-2 text-xs text-gray-600 mb-2">
                  <span>
                    {t('property.totalUnits')}: {property.totalUnits || 0}
                  </span>
                  <span className="text-green-600">
                    {t('property.available')}: {property.availableUnits || 0}
                  </span>
                </div>
                <button
                  onClick={() => handleViewDetails(property.id)}
                  className="w-full mt-2 px-3 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary/90 transition-colors"
                >
                  {t('landing.viewDetails')}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};
