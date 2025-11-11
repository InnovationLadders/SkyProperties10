import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createCustomIcon } from '../../utils/mapIcons';
import { latLngBounds } from 'leaflet';

const BoundsHandler = ({ properties, selectedPropertyId }) => {
  const map = useMap();
  const initialBoundsSet = useRef(false);
  const previousPropertiesCount = useRef(0);

  useEffect(() => {
    if (!properties || properties.length === 0) return;

    const propertiesChanged = properties.length !== previousPropertiesCount.current;
    previousPropertiesCount.current = properties.length;

    if (selectedPropertyId) {
      const selectedProperty = properties.find(p => p.id === selectedPropertyId);
      if (selectedProperty && selectedProperty.coordinates) {
        map.setView(
          [selectedProperty.coordinates.lat, selectedProperty.coordinates.lng],
          15,
          { animate: true, duration: 0.5 }
        );
        return;
      }
    }

    if (!initialBoundsSet.current || propertiesChanged) {
      const validCoordinates = properties
        .filter(p => p.coordinates && p.coordinates.lat && p.coordinates.lng)
        .map(p => [p.coordinates.lat, p.coordinates.lng]);

      if (validCoordinates.length === 0) return;

      if (validCoordinates.length === 1) {
        map.setView(validCoordinates[0], 14, { animate: true });
      } else {
        const bounds = latLngBounds(validCoordinates);

        const areAllPointsSame = validCoordinates.every(
          coord => coord[0] === validCoordinates[0][0] && coord[1] === validCoordinates[0][1]
        );

        if (areAllPointsSame) {
          map.setView(validCoordinates[0], 14, { animate: true });
        } else {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 16,
            animate: true,
            duration: 0.5
          });
        }
      }

      initialBoundsSet.current = true;
    }
  }, [properties, selectedPropertyId, map]);

  return null;
};

export const PropertiesMap = ({ properties, selectedPropertyId, onMarkerClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const propertiesWithCoordinates = useMemo(() => {
    return properties.filter(
      (p) => p.coordinates && p.coordinates.lat && p.coordinates.lng
    );
  }, [properties]);

  const { mapCenter, maxBounds, minZoom, maxZoom } = useMemo(() => {
    if (propertiesWithCoordinates.length === 0) {
      return {
        mapCenter: [24.7136, 46.6753],
        maxBounds: null,
        minZoom: 3,
        maxZoom: 18
      };
    }

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

    const padding = 0.1;
    const latPadding = Math.max((bounds.north - bounds.south) * padding, 0.05);
    const lngPadding = Math.max((bounds.east - bounds.west) * padding, 0.05);

    return {
      mapCenter: [centerLat, centerLng],
      maxBounds: [
        [bounds.south - latPadding, bounds.west - lngPadding],
        [bounds.north + latPadding, bounds.east + lngPadding]
      ],
      minZoom: 3,
      maxZoom: 18
    };
  }, [propertiesWithCoordinates]);

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
      center={mapCenter}
      zoom={12}
      className="w-full h-full rounded-lg"
      zoomControl={true}
      scrollWheelZoom={true}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <BoundsHandler properties={propertiesWithCoordinates} selectedPropertyId={selectedPropertyId} />

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
