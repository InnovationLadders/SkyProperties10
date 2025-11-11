import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Building2, MapPin, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PropertiesMap = ({ properties, selectedPropertyId, onMarkerClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 24.7136, lng: 46.6753 });
  const [mapZoom, setMapZoom] = useState(12);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (properties.length > 0) {
      const validProperties = properties.filter(
        (p) => p.coordinates && p.coordinates.lat && p.coordinates.lng
      );

      if (validProperties.length > 0) {
        const bounds = {
          north: Math.max(...validProperties.map((p) => p.coordinates.lat)),
          south: Math.min(...validProperties.map((p) => p.coordinates.lat)),
          east: Math.max(...validProperties.map((p) => p.coordinates.lng)),
          west: Math.min(...validProperties.map((p) => p.coordinates.lng)),
        };

        const centerLat = (bounds.north + bounds.south) / 2;
        const centerLng = (bounds.east + bounds.west) / 2;

        setMapCenter({ lat: centerLat, lng: centerLng });

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
    }
  }, [properties]);

  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find((p) => p.id === selectedPropertyId);
      if (property && property.coordinates) {
        setMapCenter({
          lat: property.coordinates.lat,
          lng: property.coordinates.lng,
        });
        setMapZoom(15);
      }
    }
  }, [selectedPropertyId, properties]);

  const handleMarkerClick = (property) => {
    setSelectedMarker(property);
    if (onMarkerClick) {
      onMarkerClick(property.id);
    }
  };

  const handleInfoWindowClose = () => {
    setSelectedMarker(null);
  };

  const handleViewDetails = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const propertiesWithCoordinates = properties.filter(
    (p) => p.coordinates && p.coordinates.lat && p.coordinates.lng
  );

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-6">
          <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('map.apiKeyRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="properties-map"
        center={mapCenter}
        zoom={mapZoom}
        className="w-full h-full rounded-lg"
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
      >
        {propertiesWithCoordinates.map((property) => (
          <AdvancedMarker
            key={property.id}
            position={{
              lat: property.coordinates.lat,
              lng: property.coordinates.lng,
            }}
            onClick={() => handleMarkerClick(property)}
          >
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 ${
                selectedPropertyId === property.id
                  ? 'bg-secondary scale-125'
                  : 'bg-primary'
              }`}
            >
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </AdvancedMarker>
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.coordinates.lat,
              lng: selectedMarker.coordinates.lng,
            }}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-sm mb-1 text-gray-900">
                {selectedMarker.name || t('property.unnamed')}
              </h3>
              <div className="flex items-start gap-1 text-xs text-gray-600 mb-2">
                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">
                  {selectedMarker.address || t('property.noAddress')}
                </span>
              </div>
              {selectedMarker.price && (
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                  <DollarSign className="h-3 w-3" />
                  <span>${selectedMarker.price?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex gap-2 text-xs text-gray-600 mb-2">
                <span>
                  {t('property.totalUnits')}: {selectedMarker.totalUnits || 0}
                </span>
                <span className="text-green-600">
                  {t('property.available')}: {selectedMarker.availableUnits || 0}
                </span>
              </div>
              <button
                onClick={() => handleViewDetails(selectedMarker.id)}
                className="w-full mt-2 px-3 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary/90 transition-colors"
              >
                {t('landing.viewDetails')}
              </button>
            </div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};
