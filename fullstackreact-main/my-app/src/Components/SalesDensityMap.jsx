import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Singapore postal sector centers (approximate centroids for 01–82)
const POSTAL_CENTERS = {
  '01': { name: 'Raffles Place', lat: 1.2839, lng: 103.8511 },
  '02': { name: 'Anson', lat: 1.2744, lng: 103.8458 },
  '03': { name: 'Queenstown', lat: 1.2942, lng: 103.8059 },
  '04': { name: 'Telok Blangah', lat: 1.2707, lng: 103.8097 },
  '05': { name: 'Pasir Panjang', lat: 1.2762, lng: 103.7913 },
  '06': { name: 'Tanjong Pagar', lat: 1.2655, lng: 103.8458 },
  '07': { name: 'Anson', lat: 1.2744, lng: 103.8458 },
  '08': { name: 'Sentosa', lat: 1.2494, lng: 103.8303 },
  '09': { name: 'Straits View', lat: 1.2580, lng: 103.8230 },
  '10': { name: 'Tanglin', lat: 1.3062, lng: 103.8135 },
  '11': { name: 'Newton', lat: 1.3138, lng: 103.8364 },
  '12': { name: 'Balestier', lat: 1.3260, lng: 103.8435 },
  '13': { name: 'Macpherson', lat: 1.3261, lng: 103.8901 },
  '14': { name: 'Paya Lebar', lat: 1.3313, lng: 103.8989 },
  '15': { name: 'Katong', lat: 1.3055, lng: 103.9052 },
  '16': { name: 'Bedok', lat: 1.3236, lng: 103.9273 },
  '17': { name: 'Changi', lat: 1.3573, lng: 103.9894 },
  '18': { name: 'Tampines', lat: 1.3496, lng: 103.9568 },
  '19': { name: 'Hougang', lat: 1.3713, lng: 103.8926 },
  '20': { name: 'Bishan', lat: 1.3526, lng: 103.8489 },
  '21': { name: 'Clementi', lat: 1.3151, lng: 103.7652 },
  '22': { name: 'Jurong', lat: 1.3430, lng: 103.7063 },
  '23': { name: 'Hillview', lat: 1.3622, lng: 103.7633 },
  '24': { name: 'Jurong West', lat: 1.3504, lng: 103.7183 },
  '25': { name: 'Woodlands', lat: 1.4382, lng: 103.7890 },
  '26': { name: 'Upper Thomson', lat: 1.3817, lng: 103.8278 },
  '27': { name: 'Yishun', lat: 1.4304, lng: 103.8354 },
  '28': { name: 'Seletar', lat: 1.4044, lng: 103.8691 },
  '29': { name: 'Sembawang', lat: 1.4491, lng: 103.8185 },
  '30': { name: 'Bukit Panjang', lat: 1.3774, lng: 103.7719 },
  '31': { name: 'Punggol', lat: 1.4043, lng: 103.9022 },
  '32': { name: 'Sengkang', lat: 1.3900, lng: 103.8950 },
  '33': { name: 'Ang Mo Kio', lat: 1.3721, lng: 103.8492 },
  '34': { name: 'Serangoon', lat: 1.3532, lng: 103.8737 },
  '35': { name: 'Toa Payoh', lat: 1.3342, lng: 103.8497 },
  '36': { name: 'Marine Parade', lat: 1.3026, lng: 103.9122 },
  '37': { name: 'Kallang', lat: 1.3111, lng: 103.8660 },
  '38': { name: 'Geylang', lat: 1.3184, lng: 103.8851 },
  '39': { name: 'Chinatown', lat: 1.2844, lng: 103.8439 },
  '40': { name: 'Bukit Timah', lat: 1.3294, lng: 103.8077 },
  '41': { name: 'Bukit Batok', lat: 1.3496, lng: 103.7497 },
  '42': { name: 'Jurong East', lat: 1.3341, lng: 103.7432 },
  '43': { name: 'Bukit Gombak', lat: 1.3588, lng: 103.7513 },
  '44': { name: 'Hillview', lat: 1.3622, lng: 103.7633 },
  '45': { name: 'Choa Chu Kang', lat: 1.3854, lng: 103.7446 },
  '46': { name: 'Bukit Panjang', lat: 1.3774, lng: 103.7719 },
  '47': { name: 'Mandai', lat: 1.4146, lng: 103.7543 },
  '48': { name: 'Yio Chu Kang', lat: 1.3801, lng: 103.8718 },
  '49': { name: 'Sembawang', lat: 1.4491, lng: 103.8185 },
  '50': { name: 'Woodlands', lat: 1.4382, lng: 103.7890 },
  '51': { name: 'Marsiling', lat: 1.4447, lng: 103.7714 },
  '52': { name: 'Admiralty', lat: 1.4407, lng: 103.8002 },
  '53': { name: 'Canberra', lat: 1.4483, lng: 103.8216 },
  '54': { name: 'Sengkang East', lat: 1.3914, lng: 103.9033 },
  '55': { name: 'Sengkang West', lat: 1.3893, lng: 103.8863 },
  '56': { name: 'Punggol', lat: 1.4063, lng: 103.9027 },
  '57': { name: 'Hougang East', lat: 1.3692, lng: 103.8912 },
  '58': { name: 'Hougang West', lat: 1.3725, lng: 103.8824 },
  '59': { name: 'Tampines North', lat: 1.3603, lng: 103.9633 },
  '60': { name: 'Tampines East', lat: 1.3509, lng: 103.9607 },
  '61': { name: 'Tampines West', lat: 1.3463, lng: 103.9435 },
  '62': { name: 'Pasir Ris', lat: 1.3721, lng: 103.9494 },
  '63': { name: 'Loyang', lat: 1.3639, lng: 103.9724 },
  '64': { name: 'Changi Village', lat: 1.3894, lng: 103.9888 },
  '65': { name: 'East Coast', lat: 1.3147, lng: 103.9365 },
  '66': { name: 'Siglap', lat: 1.3208, lng: 103.9303 },
  '67': { name: 'Bedok North', lat: 1.3321, lng: 103.9298 },
  '68': { name: 'Bedok South', lat: 1.3141, lng: 103.9305 },
  '69': { name: 'Tanah Merah', lat: 1.3271, lng: 103.9453 },
  '70': { name: 'Upper East Coast', lat: 1.3208, lng: 103.9510 },
  '71': { name: 'Kembangan', lat: 1.3208, lng: 103.9122 },
  '72': { name: 'Geylang Serai', lat: 1.3174, lng: 103.8997 },
  '73': { name: 'Ubi', lat: 1.3325, lng: 103.9020 },
  '74': { name: 'Kallang', lat: 1.3111, lng: 103.8660 },
  '75': { name: 'Lavender', lat: 1.3082, lng: 103.8631 },
  '76': { name: 'Balestier', lat: 1.3260, lng: 103.8435 },
  '77': { name: 'Toa Payoh', lat: 1.3342, lng: 103.8497 },
  '78': { name: 'Novena', lat: 1.3204, lng: 103.8438 },
  '79': { name: 'Newton', lat: 1.3138, lng: 103.8364 },
  '80': { name: 'Orchard', lat: 1.3048, lng: 103.8318 }
};


const getHeatColor = (orderCount, maxCount) => {
  if (!maxCount || maxCount === 0) return '#E5E7EB';
  const intensity = orderCount / maxCount;
  if (intensity > 0.8) return '#DC2626';    // High = Red
  if (intensity > 0.6) return '#F59E0B';    // Med = Orange
  if (intensity > 0.4) return '#FCD34D';    // Med = Yellow
  if (intensity > 0.2) return '#86EFAC';    // Low = Green
  return '#D1FAE5';                         // Very low = Mint
};

const SalesDensityMap = ({ geoData }) => {
  const maxOrders = geoData && geoData.length > 0
    ? Math.max(...geoData.map(d => d.order_count || 0), 1)
    : 1;

  return (
    <div style={{ height: 400, width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
      <MapContainer center={[1.3521, 103.8198]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {geoData && geoData.map((item, idx) => {
          const sector = POSTAL_CENTERS[item.sector];
          if (!sector || (item.order_count || 0) === 0) return null;
          return (
            <CircleMarker
              key={item.sector + '-' + idx}
              center={[sector.lat, sector.lng]}
              radius={8 + Math.min(14, Math.round(item.order_count * 2))} // scale by order count
              fillColor={getHeatColor(item.order_count, maxOrders)}
              color="#374151"
              weight={1.5}
              fillOpacity={0.8}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
                <div>
                  <b>{sector.name} (Sector {item.sector})</b><br />
                  {item.order_count} orders<br />
                  ${parseFloat(item.total_sales).toLocaleString()}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, right: 18, background: 'rgba(255,255,255,0.95)', padding: '8px 15px',
        borderRadius: 8, fontSize: 13, border: '1px solid #e5e7eb', zIndex: 1000
      }}>
        <b style={{ fontWeight: 600 }}>Order Density:</b>
        <div style={{ display: 'flex', gap: 14, marginTop: 3 }}>
          <span><span style={{ background: '#D1FAE5', width: 14, height: 14, display: 'inline-block', borderRadius: 3, marginRight: 3 }}></span>Low</span>
          <span><span style={{ background: '#FCD34D', width: 14, height: 14, display: 'inline-block', borderRadius: 3, marginRight: 3 }}></span>Med</span>
          <span><span style={{ background: '#DC2626', width: 14, height: 14, display: 'inline-block', borderRadius: 3, marginRight: 3 }}></span>High</span>
        </div>
      </div>
    </div>
  );
};

export default SalesDensityMap;
