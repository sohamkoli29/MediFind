import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Pill, LogOut, Sun, Moon,
  Clock, Phone, ChevronRight, Loader2,
  AlertCircle, PackageX, Navigation, X, Store
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
import PharmacyRegisterModal from '../pharmacy/PharmacyRegisterModal';

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
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 600);

  useSocket((data) => {
    toast.custom(() => (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium"
        style={{
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          maxWidth: '90vw',
        }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse shrink-0"
          style={{ backgroundColor: 'hsl(var(--primary))' }}
        />
        <span className="truncate">
          <strong>{data.medicineName}</strong>{' '}
          {data.inStock ? `${data.quantity} in stock nearby` : 'now out of stock'}
        </span>
      </motion.div>
    ), { duration: 4000 });

    if (debouncedQuery && data.medicineName?.toLowerCase().includes(debouncedQuery.toLowerCase())) {
      runSearch(debouncedQuery);
    }
  });

  const getLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocationLoading(false);
        toast.success('Location detected!');
      },
      () => {
        setLocationError('Could not detect location. Please allow access.');
        setLocationLoading(false);
      }
    );
  }, []);

  useEffect(() => { getLocation(); }, []);

  const runSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2 || !userLocation) return;
    dispatch(setLoading(true));
    setHasSearched(true);
    try {
      const { data } = await api.get('/pharmacies/nearby', {
        params: { q: q.trim(), lat: userLocation.lat, lng: userLocation.lng, radius },
      });
      dispatch(setSearchResults(data.results));
    } catch {
      toast.error('Search failed. Please try again.');
      dispatch(setSearchResults([]));
    } finally {
      dispatch(setLoading(false));
    }
  }, [userLocation, radius]);

  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      runSearch(debouncedQuery);
    } else if (debouncedQuery.trim().length === 0) {
      dispatch(clearResults());
      setHasSearched(false);
    }
  }, [debouncedQuery, radius]);

  const skeletonBase = theme === 'dark' ? '#1e2a3a' : '#e8edf2';
  const skeletonHigh = theme === 'dark' ? '#2a3a4e' : '#f0f4f8';

  return (
    <div className="min-h-screen min-h-dvh" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <Toaster position="top-center" toastOptions={{ style: { maxWidth: '90vw' } }} />

      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between"
        style={{
          backgroundColor: 'hsl(var(--background) / 0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid hsl(var(--border))',
          padding: '0 var(--page-px, 1rem)',
          height: 'var(--nav-h, 56px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--primary))' }}
          >
            <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="font-bold text-base sm:text-lg" style={{ color: 'hsl(var(--foreground))' }}>
            MediFind
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Location badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: userLocation ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--secondary))',
              color: userLocation ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
            }}
          >
            <MapPin className="w-3 h-3" />
            {userLocation ? 'Located' : 'No location'}
          </div>

          <span className="hidden md:block text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Hi, {user?.name?.split(' ')[0]}
          </span>

          {/* Switch to Pharmacy button */}
          <button
            onClick={() => setShowSwitchModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium nav-btn"
            style={{
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              color: 'hsl(var(--primary))',
              border: '1px solid hsl(var(--primary) / 0.2)',
            }}
          >
            <Store className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Register Pharmacy</span>
          </button>

          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center nav-btn"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => dispatch(logout())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm nav-btn"
            style={{
              backgroundColor: 'hsl(var(--secondary))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="px-4 sm:px-6 md:px-8 pt-6 sm:pt-10 pb-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3"
            style={{ fontFamily: "'DM Serif Display', serif", color: 'hsl(var(--foreground))' }}
          >
            Find your medicine
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Search by name, brand, or salt — see live stock near you
          </p>
        </motion.div>

        <AnimatePresence>
          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl mb-4 text-xs sm:text-sm"
              style={{
                backgroundColor: 'hsl(var(--destructive) / 0.08)',
                color: 'hsl(var(--destructive))',
                border: '1px solid hsl(var(--destructive) / 0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{locationError}</span>
              </div>
              <button onClick={getLocation} className="shrink-0 font-semibold underline nav-btn px-1">
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
          className="relative mb-3"
        >
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="e.g. Paracetamol, Crocin, Amoxicillin..."
            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 rounded-2xl text-sm sm:text-base outline-none transition-all"
            style={{
              backgroundColor: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1.5px solid hsl(var(--border))',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'hsl(var(--primary))')}
            onBlur={(e) => (e.target.style.borderColor = 'hsl(var(--border))')}
          />
          {loading ? (
            <Loader2
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin"
              style={{ color: 'hsl(var(--primary))' }}
            />
          ) : searchQuery ? (
            <button
              onClick={() => dispatch(setSearchQuery(''))}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center nav-btn"
              style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </motion.div>

        {/* Radius + location */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <MapPin className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            <span className="text-xs sm:text-sm whitespace-nowrap" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Within
            </span>
            <input
              type="range" min="1" max="25" value={radius}
              onChange={(e) => dispatch(setRadius(Number(e.target.value)))}
              className="flex-1"
              aria-label="Search radius"
            />
            <span
              className="text-xs sm:text-sm font-semibold whitespace-nowrap w-12 text-right"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {radius} km
            </span>
          </div>

          <button
            onClick={getLocation}
            disabled={locationLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all w-full sm:w-auto"
            style={{
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              color: 'hsl(var(--primary))',
              minHeight: '44px',
            }}
          >
            {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {locationLoading ? 'Detecting...' : 'Use my location'}
          </button>
        </motion.div>
      </div>

      {/* ── Results ── */}
      <div className="px-4 sm:px-6 md:px-8 pb-20 max-w-3xl mx-auto">
        {loading && (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 sm:p-5 rounded-2xl" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <Skeleton height={18} width="55%" className="mb-2" baseColor={skeletonBase} highlightColor={skeletonHigh} />
                <Skeleton height={13} width="38%" className="mb-3" baseColor={skeletonBase} highlightColor={skeletonHigh} />
                <div className="flex gap-2">
                  <Skeleton height={26} width={90} borderRadius={8} baseColor={skeletonBase} highlightColor={skeletonHigh} />
                  <Skeleton height={26} width={70} borderRadius={8} baseColor={skeletonBase} highlightColor={skeletonHigh} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasSearched && searchResults.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
              <PackageX className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>No pharmacies found</h3>
            <p className="text-xs sm:text-sm max-w-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No nearby pharmacy has <strong>"{searchQuery}"</strong> in stock within {radius} km. Try a larger radius or check spelling.
            </p>
          </motion.div>
        )}

        {!loading && !hasSearched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center justify-center py-14 sm:py-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
              <Search className="w-6 h-6" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Type a medicine name above to search</p>
          </motion.div>
        )}

        <AnimatePresence>
          {!loading && searchResults.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs sm:text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {searchResults.length} pharmacy{searchResults.length !== 1 ? 's' : ''} within {radius} km
                </p>
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Live
                </div>
              </div>

              {searchResults.map((result, i) => (
                <PharmacyCard
                  key={result.pharmacy._id}
                  result={result}
                  index={i}
                  onDirections={() => {
                    const [lng, lat] = result.pharmacy.location.coordinates;
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                  }}
                  theme={theme}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Switch to Pharmacy Modal */}
      <AnimatePresence>
        {showSwitchModal && (
          <PharmacyRegisterModal
            onClose={() => setShowSwitchModal(false)}
            onSuccess={() => {
              setShowSwitchModal(false);
              toast.success('Pharmacy registered! Please log in again as pharmacy staff.');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Pharmacy Card ─────────────────────────────────────────────────────────────
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
      className="rounded-2xl overflow-hidden card-lift"
      style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}>
                <Pill className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: 'hsl(var(--foreground))' }}>
                {pharmacy.name}
              </h3>
            </div>
            <div className="flex items-start gap-1.5 mt-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
              <p className="text-xs sm:text-sm line-clamp-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {[pharmacy.address?.street, pharmacy.address?.city, pharmacy.address?.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              {pharmacy.operatingHours && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {pharmacy.operatingHours.open} – {pharmacy.operatingHours.close}
                  </span>
                </div>
              )}
              {pharmacy.phone && (
                <a href={`tel:${pharmacy.phone}`} className="flex items-center gap-1 text-xs nav-btn" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Phone className="w-3 h-3" />
                  {pharmacy.phone}
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onDirections}
            className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', minHeight: '36px' }}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Directions</span>
          </button>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 mt-3 text-xs sm:text-sm font-medium"
          style={{ color: 'hsl(var(--primary))', minHeight: '32px' }}
        >
          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
            {medicines.length}
          </span>
          medicine{medicines.length !== 1 ? 's' : ''} in stock
          <ChevronRight className="w-4 h-4 transition-transform duration-200" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              {medicines.map((med) => (
                <div key={med._id} className="flex items-start sm:items-center justify-between gap-3 p-3 rounded-xl" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{med.medicineName}</p>
                    {med.saltComposition && (
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{med.saltComposition}</p>
                    )}
                    {med.brandNames?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {med.brandNames.slice(0, 3).map((brand) => (
                          <span key={brand} className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                            {brand}
                          </span>
                        ))}
                        {med.brandNames.length > 3 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}>
                            +{med.brandNames.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      {med.price ? `₹${med.price}` : '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {med.quantity} {med.unit}s
                    </p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} />
                      <span className="text-xs" style={{ color: 'hsl(var(--primary))' }}>In stock</span>
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