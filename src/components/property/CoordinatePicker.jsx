import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CoordinatePicker = ({ coordinates, onCoordinatesChange, address }) => {
  const { t } = useTranslation();
  const [markerPosition, setMarkerPosition] = useState(
    coordinates || { lat: 24.7136, lng: 46.6753 }
  );
  const [mapCenter, setMapCenter] = useState(
    coordinates || { lat: 24.7136, lng: 46.6753 }
  );

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (coordinates) {
      setMarkerPosition(coordinates);
      setMapCenter(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (address && window.google && window.google.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const newPosition = {
            lat: location.lat(),
            lng: location.lng(),
          };
          setMarkerPosition(newPosition);
          setMapCenter(newPosition);
          onCoordinatesChange(newPosition);
        }
      });
    }
  }, [address]);

  const handleMapClick = (event) => {
    const newPosition = {
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng,
    };
    setMarkerPosition(newPosition);
    onCoordinatesChange(newPosition);
  };

  if (!apiKey || apiKey === 'your_google_maps_api_key_here' || apiKey === 'AIzaSyDummyKeyForDevelopment') {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-muted rounded-lg border">
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-semibold mb-1">{t('map.apiKeyRequired')}</p>
          <p className="text-xs text-muted-foreground">
            {t('map.apiKeyInstructions') || 'Configure Google Maps API key to use location picker'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="coordinate-picker-map"
          center={mapCenter}
          zoom={13}
          className="w-full h-full"
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          onClick={handleMapClick}
        >
          <AdvancedMarker
            position={markerPosition}
            draggable={true}
            onDragEnd={(event) => {
              const newPosition = {
                lat: event.latLng.lat,
                lng: event.latLng.lng,
              };
              setMarkerPosition(newPosition);
              onCoordinatesChange(newPosition);
            }}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>
    </div>
  );
};
