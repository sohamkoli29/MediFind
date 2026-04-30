import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, MapPin, Search as SearchIcon } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } },
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// ── Tiny hook: load Google Maps script once ───────────────────────────────────
const useMapsScript = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.google?.maps) { setReady(true); return; }
    if (document.getElementById('gmap-script')) {
      // Script already injected — wait for it
      const interval = setInterval(() => {
        if (window.google?.maps) { setReady(true); clearInterval(interval); }
      }, 100);
      return () => clearInterval(interval);
    }
    const script = document.createElement('script');
    script.id = 'gmap-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  return ready;
};

const PharmacyRegisterModal = ({ onClose, onSuccess }) => {
  const mapsReady = useMapsScript();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [mapTab, setMapTab] = useState('search'); // 'search' | 'current'
  const [pinnedCoords, setPinnedCoords] = useState(null); // { lat, lng }
  const [gettingLocation, setGettingLocation] = useState(false);

  const [form, setForm] = useState({
    name: '', licenceNumber: '', phone: '',
    street: '', city: '', state: '', pincode: '',
    open: '09:00', close: '21:00',
  });

  const inputStyle = {
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--foreground))',
    border: '1.5px solid hsl(var(--border))',
  };

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = { lat: 20.5937, lng: 78.9629 }; // India center

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    });
    mapInstanceRef.current = map;

    // Click to pin
    map.addListener('click', (e) => {
      placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() }, map);
    });

    // Autocomplete on search input
    if (searchInputRef.current) {
      const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'in' },
      });
      autocompleteRef.current = ac;
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry) return;
        const loc = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        map.setCenter(loc);
        map.setZoom(16);
        placeMarker(loc, map);
      });
    }
  }, [mapsReady]);

  const placeMarker = (coords, map) => {
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      position: coords,
      map,
      animation: window.google.maps.Animation.DROP,
      title: 'Pharmacy location',
    });
    setPinnedCoords(coords);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapInstanceRef.current?.setCenter(coords);
        mapInstanceRef.current?.setZoom(16);
        placeMarker(coords, mapInstanceRef.current);
        setGettingLocation(false);
        toast.success('Location pinned!');
      },
      () => { toast.error('Could not detect location'); setGettingLocation(false); }
    );
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pinnedCoords) { toast.error('Please pin your pharmacy location on the map'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/pharmacies/register', {
        name: form.name,
        licenceNumber: form.licenceNumber,
        phone: form.phone,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        coordinates: [pinnedCoords.lng, pinnedCoords.lat],
        operatingHours: { open: form.open, close: form.close },
      });
      toast.success('Pharmacy registered!');
      onSuccess(data.pharmacy);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl overflow-hidden modal-sheet"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          maxHeight: '95dvh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--border))' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 sticky top-0 z-10"
          style={{ backgroundColor: 'hsl(var(--card))', borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div>
            <h2 className="font-bold text-base sm:text-lg" style={{ color: 'hsl(var(--foreground))' }}>
              Register Pharmacy
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Set up your pharmacy profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center nav-btn"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}
          >
            <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">

          {/* Pharmacy Name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
              Pharmacy Name *
            </label>
            <input name="name" value={form.name} onChange={handleChange} required
              placeholder="Apollo Pharmacy"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          {/* Licence + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'licenceNumber', label: 'Licence Number *', placeholder: 'MH-2024-001', required: true },
              { name: 'phone', label: 'Phone *', placeholder: '9876543210', required: true },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
                  {f.label}
                </label>
                <input name={f.name} value={form[f.name]} onChange={handleChange} required={f.required}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </div>
            ))}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
              Street Address
            </label>
            <input name="street" value={form.street} onChange={handleChange} placeholder="College Road"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { name: 'city', placeholder: 'Nashik' },
              { name: 'state', placeholder: 'Maharashtra' },
              { name: 'pincode', placeholder: '422005' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium mb-1.5 capitalize" style={{ color: 'hsl(var(--foreground))' }}>
                  {f.name}
                </label>
                <input name={f.name} value={form[f.name]} onChange={handleChange}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </div>
            ))}
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'open', label: 'Opening Time' },
              { name: 'close', label: 'Closing Time' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
                  {f.label}
                </label>
                <input type="time" name={f.name} value={form[f.name]} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </div>
            ))}
          </div>

          {/* ── Location Picker ── */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Pharmacy Location *
            </label>

            {/* Status chip */}
            {pinnedCoords && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs font-medium"
                style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
              >
                <Check className="w-3.5 h-3.5" />
                Pinned: {pinnedCoords.lat.toFixed(5)}, {pinnedCoords.lng.toFixed(5)}
              </div>
            )}

            {/* Search bar above map */}
            {mapsReady && (
              <div className="relative mb-2">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for your pharmacy location..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </div>
            )}

            {/* Map */}
            <div
              className="relative rounded-xl overflow-hidden"
              style={{ border: pinnedCoords ? '2px solid hsl(var(--primary))' : '1.5px solid hsl(var(--border))' }}
            >
              {!mapsReady && (
                <div
                  className="flex items-center justify-center"
                  style={{ height: '280px', backgroundColor: 'hsl(var(--secondary))' }}
                >
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
                </div>
              )}
              <div
                ref={mapRef}
                style={{ height: '280px', display: mapsReady ? 'block' : 'none' }}
              />

              {/* Use current location button — overlaid on map */}
              {mapsReady && (
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={gettingLocation}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-md transition-all"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    minHeight: '36px',
                  }}
                >
                  {gettingLocation
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <MapPin className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                  }
                  {gettingLocation ? 'Detecting...' : 'Use current location'}
                </button>
              )}
            </div>

            <p className="text-xs mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Search for an address above, click anywhere on the map, or use current location to pin your pharmacy.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !pinnedCoords}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              opacity: loading || !pinnedCoords ? 0.6 : 1,
              minHeight: '48px',
            }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
              : 'Register Pharmacy'
            }
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default PharmacyRegisterModal;