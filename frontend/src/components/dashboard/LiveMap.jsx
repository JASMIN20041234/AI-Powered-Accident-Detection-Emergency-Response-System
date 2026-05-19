import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '../../contexts/ThemeContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pulseIcon = L.divIcon({
  className: '',
  html: '<div class="live-marker-inner"></div>',
  iconSize: [14, 14], iconAnchor: [7, 7],
});

function Recenter({ lat, lng, trigger }) {
  const map = useMap();
  useEffect(() => { if (lat && lng) map.setView([lat, lng], 16, { animate: true }); }, [trigger]);
  return null;
}

const TILES = {
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
};

export default function LiveMap({ location, recenterTrigger }) {
  const { lat, lng, accuracy } = location;
  const { theme } = useTheme();
  return (
    <MapContainer center={[17.385, 78.4867]} zoom={13}
      style={{ height: '100%', minHeight: 320, width: '100%' }}>
      <TileLayer
        key={theme}
        url={TILES[theme] || TILES.dark}
        attribution="&copy; OpenStreetMap &copy; CARTO"
        maxZoom={19}
      />
      {lat && lng && (
        <>
          <Recenter lat={lat} lng={lng} trigger={recenterTrigger} />
          <Marker position={[lat, lng]} icon={pulseIcon}>
            <Popup>
              <b>Your Location</b><br />
              {lat.toFixed(5)}, {lng.toFixed(5)}<br />
              Accuracy: ±{Math.round(accuracy)}m
            </Popup>
          </Marker>
          <Circle center={[lat, lng]} radius={accuracy}
            pathOptions={{ color:'#ffb547', fillColor:'#ffb547', fillOpacity:0.08, weight:1 }}
          />
        </>
      )}
    </MapContainer>
  );
}
