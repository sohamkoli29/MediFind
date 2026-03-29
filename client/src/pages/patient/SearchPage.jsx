import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Pill, LogOut, Sun, Moon,
  Clock, Phone, ChevronRight, Loader2,
  AlertCircle, PackageX, Navigation
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import {
  setSearchQuery, setSearchResults,
  setRadius, setUserLocation, setLoading, clearResults
} from '../../features/medicine/medicineSlice';
import api from '../../services/api';
import useDebounce from '../../hooks/useDebounce';
import useSocket from '../../hooks/useSocket';
import useTheme from '../../hooks/useTheme';
import toast, { Toaster } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const SearchPage = () => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const { searchQuery, searchResults, radius, userLocation, loading } = useSelector(
    (state) => state.medicine
  );

  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 600);

  // ── Live stock update via Socket.IO ──
  useSocket((data) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
        style={{
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        />
        <span>
          <strong>{data.medicineName}</strong>{' '}
          stock updated nearby — {data.inStock ? `${data.quantity} in stock` : 'now out of stock'}
        </span>
      </motion.div>
    ), { duration: 4000 });

    // Re-run search if current query matches updated medicine
    if (
      debouncedQuery &&
      data.medicineName?.toLowerCase().includes(debouncedQuery.toLowerCase())
    ) {
      runSearch(debouncedQuery);
    }
  });

  // ── Get user location ──
  const getLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setLocationLoading(false);
        toast.success('Location detected!');
      },
      () => {
        setLocationError('Could not detect location. Please allow location access.');
        setLocationLoading(false);
      }
    );
  }, []);

  // Auto-get location on mount
  useEffect(() => {
    getLocation();
  }, []);

  // ── Run search ──
  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2 || !userLocation) return;

    dispatch(setLoading(true));
    setHasSearched(true);

    try {
      const { data } = await api.get('/pharmacies/nearby', {
        params: {
          q: q.trim(),
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius,
        },
      });
      dispatch(setSearchResults(data.results));
    } catch (err) {
      toast.error('Search failed. Please try again.');
      dispatch(setSearchResults([]));
    } finally {
      dispatch(setLoading(false));
    }
  }, [userLocation, radius]);

  // Trigger search on debounced query change
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      runSearch(debouncedQuery);
    } else if (debouncedQuery.trim().length === 0) {
      dispatch(clearResults());
      setHasSearched(false);
    }
  }, [debouncedQuery, radius]);

  const handleLogout = () => {
    dispatch(logout());
  };

  const openDirections = (pharmacy) => {
    const [lng, lat] = pharmacy.location.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const skeletonBaseColor = theme === 'dark' ? '#1e2a3a' : '#e8edf2';
  const skeletonHighlightColor = theme === 'dark' ? '#2a3a4e' : '#f0f4f8';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Toaster position="top-right" />

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 px-4 md:px-8 py-4 flex items-center justify-between"
        style={{
          backgroundColor: 'hsl(var(--background) / 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            <Pill className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg" style={{ color: 'hsl(var(--foreground))' }}>
            MediFind
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Location indicator */}
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: userLocation
                ? 'hsl(var(--primary) / 0.1)'
                : 'hsl(var(--secondary))',
              color: userLocation
                ? 'hsl(var(--primary))'
                : 'hsl(var(--muted-foreground))',
            }}
          >
            <MapPin className="w-3 h-3" />
            {userLocation ? 'Location detected' : 'No location'}
          </div>

          <span
            className="hidden md:block text-sm"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Hi, {user?.name?.split(' ')[0]}
          </span>

          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              backgroundColor: 'hsl(var(--secondary))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Hero Search Section ── */}
      <div className="px-4 md:px-8 pt-10 pb-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1
            className="text-4xl md:text-5xl mb-3"
            style={{
              fontFamily: "'DM Serif Display', serif",
              color: 'hsl(var(--foreground))',
            }}
          >
            Find your medicine
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Search by name, brand, or salt composition — see live stock near you
          </p>
        </motion.div>

        {/* Location error */}
        <AnimatePresence>
          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-3 p-4 rounded-xl mb-4 text-sm"
              style={{
                backgroundColor: 'hsl(var(--destructive) / 0.08)',
                color: 'hsl(var(--destructive))',
                border: '1px solid hsl(var(--destructive) / 0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {locationError}
              </div>
              <button
                onClick={getLocation}
                className="shrink-0 font-semibold underline text-xs"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative mb-4"
        >
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search medicine — e.g. Paracetamol, Crocin, Amoxicillin..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm outline-none transition-all shadow-sm"
            style={{
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1.5px solid hsl(var(--border))',
              fontSize: '1rem',
            }}
            onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
            onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
          />
          {loading && (
            <Loader2
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
              style={{ color: 'hsl(var(--primary))' }}
            />
          )}
        </motion.div>

        {/* Radius + location row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
        >
          {/* Radius slider */}
          <div className="flex items-center gap-3 flex-1">
            <MapPin className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            <span className="text-sm whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Within
            </span>
            <input
              type="range"
              min="1"
              max="25"
              value={radius}
              onChange={(e) => dispatch(setRadius(Number(e.target.value)))}
              className="flex-1 accent-green-600 cursor-pointer"
            />
            <span
              className="text-sm font-semibold whitespace-nowrap w-14 text-right"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {radius} km
            </span>
          </div>

          {/* Detect location button */}
          <button
            onClick={getLocation}
            disabled={locationLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              color: 'hsl(var(--primary))',
            }}
          >
            {locationLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Navigation className="w-3.5 h-3.5" />
            }
            {locationLoading ? 'Detecting...' : 'My location'}
          </button>
        </motion.div>
      </div>

      {/* ── Results ── */}
      <div className="px-4 md:px-8 pb-16 max-w-3xl mx-auto">

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <Skeleton
                  height={20} width="60%" className="mb-3"
                  baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor}
                />
                <Skeleton
                  height={14} width="40%" className="mb-4"
                  baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor}
                />
                <div className="flex gap-2">
                  <Skeleton height={28} width={100} borderRadius={8}
                    baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                  <Skeleton height={28} width={80} borderRadius={8}
                    baseColor={skeletonBaseColor} highlightColor={skeletonHighlightColor} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && hasSearched && searchResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}
            >
              <PackageX className="w-8 h-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              No pharmacies found
            </h3>
            <p className="text-sm max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No nearby pharmacy has <strong>"{searchQuery}"</strong> in stock within {radius} km.
              Try increasing the radius or check the spelling.
            </p>
          </motion.div>
        )}

        {/* Empty state — before search */}
        {!loading && !hasSearched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}
            >
              <Search className="w-7 h-7" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Type a medicine name above to find nearby pharmacies
            </p>
          </motion.div>
        )}

        {/* Results list */}
        <AnimatePresence>
          {!loading && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Results header */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {searchResults.length} pharmacy{searchResults.length !== 1 ? 's' : ''} found
                  within {radius} km
                </p>
                <div
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Live
                </div>
              </div>

              {searchResults.map((result, i) => (
                <PharmacyCard
                  key={result.pharmacy._id}
                  result={result}
                  index={i}
                  onDirections={() => openDirections(result.pharmacy)}
                  theme={theme}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ── Pharmacy Result Card ──────────────────────────────────────────────────────
const PharmacyCard = ({ result, index, onDirections, theme }) => {
  const { pharmacy, medicines } = result;
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Pharmacy name */}
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
              >
                <Pill className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h3
                className="font-semibold truncate"
                style={{ color: 'hsl(var(--foreground))' }}
              >
                {pharmacy.name}
              </h3>
            </div>

            {/* Address */}
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-sm truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {[pharmacy.address?.street, pharmacy.address?.city, pharmacy.address?.pincode]
                  .filter(Boolean).join(', ')}
              </p>
            </div>

            {/* Hours + Phone */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {pharmacy.operatingHours && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {pharmacy.operatingHours.open} - {pharmacy.operatingHours.close}
                  </span>
                </div>
              )}
              {pharmacy.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <a
                    href={`tel:${pharmacy.phone}`}
                    className="text-xs hover:underline"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    {pharmacy.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Directions button */}
          <button
            onClick={onDirections}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </button>
        </div>

        {/* Medicine count badge */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 mt-4 text-sm font-medium transition-colors"
          style={{ color: 'hsl(var(--primary))' }}
        >
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              color: 'hsl(var(--primary))',
            }}
          >
            {medicines.length}
          </span>
          medicine{medicines.length !== 1 ? 's' : ''} in stock
          <ChevronRight
            className="w-4 h-4 transition-transform"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>

      {/* Expanded medicine list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            <div className="p-4 space-y-3">
              {medicines.map((med) => (
                <div
                  key={med._id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: 'hsl(var(--secondary))' }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {med.medicineName}
                    </p>
                    {med.saltComposition && (
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                        {med.saltComposition}
                      </p>
                    )}
                    {med.brandNames?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {med.brandNames.map((brand) => (
                          <span
                            key={brand}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: 'hsl(var(--primary) / 0.1)',
                              color: 'hsl(var(--primary))',
                            }}
                          >
                            {brand}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {med.price ? `₹${med.price}` : '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {med.quantity} {med.unit}s
                    </p>
                    <div
                      className="flex items-center gap-1 mt-1 justify-end"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: 'hsl(var(--primary))' }}
                      />
                      <span className="text-xs" style={{ color: 'hsl(var(--primary))' }}>
                        In stock
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchPage;