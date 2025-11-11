import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { createPinIcon } from '../../utils/mapIcons';
import { geocodeAddress } from '../../utils/geocoding';

const DraggableMarker = ({ position, onPositionChange }) => {
  const [markerPosition, setMarkerPosition] = useState(position);
  const markerRef = useRef(null);

  useEffect(() => {
    setMarkerPosition(position);
  }, [position]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setMarkerPosition([newPos.lat, newPos.lng]);
          onPositionChange({ lat: newPos.lat, lng: newPos.lng });
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={markerPosition}
      ref={markerRef}
      icon={createPinIcon('#3b82f6')}
    />
  );
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

export const CoordinatePicker = ({ coordinates, onCoordinatesChange, address }) => {
  const { t } = useTranslation();
  const [markerPosition, setMarkerPosition] = useState(
    coordinates ? [coordinates.lat, coordinates.lng] : [24.7136, 46.6753]
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodingTimeoutRef = useRef(null);

  useEffect(() => {
    if (coordinates) {
      setMarkerPosition([coordinates.lat, coordinates.lng]);
    }
  }, [coordinates]);

  useEffect(() => {
    if (address && address.trim() !== '') {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }

      geocodingTimeoutRef.current = setTimeout(async () => {
        setIsGeocoding(true);
        const result = await geocodeAddress(address);
        setIsGeocoding(false);

        if (result) {
          const newPosition = [result.lat, result.lng];
          setMarkerPosition(newPosition);
          onCoordinatesChange({ lat: result.lat, lng: result.lng });
        }
      }, 1500);
    }

    return () => {
      if (geocodingTimeoutRef.current) {
        clearTimeout(geocodingTimeoutRef.current);
      }
    };
  }, [address, onCoordinatesChange]);

  const handleMapClick = (coords) => {
    setMarkerPosition([coords.lat, coords.lng]);
    onCoordinatesChange(coords);
  };

  const handleMarkerDragEnd = (coords) => {
    setMarkerPosition([coords.lat, coords.lng]);
    onCoordinatesChange(coords);
  };

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border relative">
      {isGeocoding && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded shadow-lg text-sm">
          {t('map.searchingLocation') || 'Searching location...'}
        </div>
      )}
      <MapContainer
        center={markerPosition}
        zoom={13}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        <DraggableMarker position={markerPosition} onPositionChange={handleMarkerDragEnd} />
      </MapContainer>
    </div>
  );
};
