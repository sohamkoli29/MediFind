import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, LogOut, Sun, Moon, Plus, Edit2, Trash2,
  Package, AlertTriangle, TrendingUp, Store,
  Loader2, Search, ChevronDown, X, Check
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import useSocket from '../../hooks/useSocket';
import toast, { Toaster } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
};

const CATEGORIES = [
  'antibiotic', 'analgesic', 'antiviral', 'antifungal',
  'cardiovascular', 'diabetes', 'respiratory', 'vitamin', 'other'
];

const UNITS = ['strip', 'bottle', 'vial', 'sachet', 'tube', 'other'];

// ── Main Component ─────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);

  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = add, object = edit

  // Live stock updates
  useSocket((data) => {
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'hsl(var(--primary))' }} />
        Stock synced: <strong>{data.medicineName}</strong>
      </motion.div>
    ), { duration: 3000 });
  });

  // ── Fetch pharmacy + inventory on mount ──
  useEffect(() => {
    fetchPharmacyData();
  }, []);

  const fetchPharmacyData = async () => {
    setPageLoading(true);
    try {
      const { data } = await api.get('/pharmacies/me');
      setPharmacy(data.pharmacy);
      await fetchInventory();
    } catch (err) {
      if (err.response?.status === 404) {
        // No pharmacy registered yet
        setPharmacy(null);
      }
    } finally {
      setPageLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const { data } = await api.get('/inventory/me');
      setInventory(data.inventory);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from inventory?`)) return;
    try {
      await api.delete(`/inventory/${id}`);
      setInventory((prev) => prev.filter((item) => item._id !== id));
      toast.success(`${name} removed`);
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const handleLogout = () => dispatch(logout());

  // ── Derived stats ──
  const totalSKUs = inventory.length;
  const inStockCount = inventory.filter((i) => i.inStock).length;
  const lowStockCount = inventory.filter(
    (i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold
  ).length;
  const outOfStockCount = inventory.filter((i) => !i.inStock).length;

  const filteredInventory = inventory.filter((item) =>
    item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brandNames?.some((b) => b.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const skeletonBase = theme === 'dark' ? '#1e2a3a' : '#e8edf2';
  const skeletonHigh = theme === 'dark' ? '#2a3a4e' : '#f0f4f8';

  if (pageLoading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <Skeleton height={60} className="mb-8" baseColor={skeletonBase} highlightColor={skeletonHigh} />
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} height={100} borderRadius={16}
              baseColor={skeletonBase} highlightColor={skeletonHigh} />
          ))}
        </div>
        <Skeleton height={400} borderRadius={16} baseColor={skeletonBase} highlightColor={skeletonHigh} />
      </div>
    );
  }

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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--primary))' }}>
            <Pill className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm block" style={{ color: 'hsl(var(--foreground))' }}>
              MediFind
            </span>
            {pharmacy && (
              <span className="text-xs block" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {pharmacy.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {user?.name}
          </span>
          <button onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}>
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}>
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </nav>

      <div className="px-4 md:px-8 py-8 max-w-6xl mx-auto">

        {/* ── No pharmacy registered ── */}
        {!pharmacy ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}>
              <Store className="w-10 h-10" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Register your pharmacy
            </h2>
            <p className="text-sm mb-6 max-w-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Set up your pharmacy profile to start managing your medicine inventory in real-time.
            </p>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              <Plus className="w-4 h-4" />
              Register Pharmacy
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── Page header ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
            >
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  Inventory Dashboard
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Manage your medicine stock in real-time
                </p>
              </div>
              <button
                onClick={() => { setEditingItem(null); setShowInventoryModal(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </motion.div>

            {/* ── Stats cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total SKUs', value: totalSKUs, icon: Package, color: 'var(--primary)' },
                { label: 'In Stock', value: inStockCount, icon: Check, color: '161 94% 30%' },
                { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: '38 92% 50%' },
                { label: 'Out of Stock', value: outOfStockCount, icon: TrendingUp, color: '0 84% 60%' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="p-5 rounded-2xl"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {stat.label}
                    </p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `hsl(${stat.color} / 0.1)` }}>
                      <stat.icon className="w-4 h-4" style={{ color: `hsl(${stat.color})` }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* ── Inventory table ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              {/* Table header */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  Medicine Inventory
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                    style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-full sm:w-56"
                    style={{
                      backgroundColor: 'hsl(var(--secondary))',
                      color: 'hsl(var(--foreground))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                </div>
              </div>

              {/* Loading */}
              {inventoryLoading ? (
                <div className="p-5 space-y-3">
                  {[1,2,3].map(i => (
                    <Skeleton key={i} height={56} borderRadius={12}
                      baseColor={skeletonBase} highlightColor={skeletonHigh} />
                  ))}
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="py-16 text-center">
                  <Package className="w-10 h-10 mx-auto mb-3"
                    style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {searchTerm ? 'No medicines match your search' : 'No medicines in inventory yet'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => { setEditingItem(null); setShowInventoryModal(true); }}
                      className="mt-4 text-sm font-semibold"
                      style={{ color: 'hsl(var(--primary))' }}
                    >
                      + Add your first medicine
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        {['Medicine', 'Category', 'Quantity', 'Price', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                            style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {filteredInventory.map((item, i) => (
                          <InventoryRow
                            key={item._id}
                            item={item}
                            index={i}
                            onEdit={() => { setEditingItem(item); setShowInventoryModal(true); }}
                            onDelete={() => handleDelete(item._id, item.medicineName)}
                          />
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* ── Register Pharmacy Modal ── */}
      <AnimatePresence>
        {showRegisterModal && (
          <RegisterPharmacyModal
            onClose={() => setShowRegisterModal(false)}
            onSuccess={(p) => { setPharmacy(p); setShowRegisterModal(false); }}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* ── Add/Edit Inventory Modal ── */}
      <AnimatePresence>
        {showInventoryModal && (
          <InventoryModal
            editingItem={editingItem}
            onClose={() => { setShowInventoryModal(false); setEditingItem(null); }}
            onSuccess={(item, isEdit) => {
              if (isEdit) {
                setInventory((prev) => prev.map((i) => i._id === item._id ? item : i));
              } else {
                setInventory((prev) => [item, ...prev]);
              }
              setShowInventoryModal(false);
              setEditingItem(null);
            }}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Inventory Row ─────────────────────────────────────────────────────────────
const InventoryRow = ({ item, index, onEdit, onDelete }) => {
  const isLowStock = item.quantity > 0 && item.quantity <= item.lowStockThreshold;
  const isOutOfStock = !item.inStock;

  return (
    <motion.tr
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, x: -20 }}
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      {/* Medicine name */}
      <td className="px-5 py-4">
        <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
          {item.medicineName}
        </p>
        {item.brandNames?.length > 0 && (
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {item.brandNames.slice(0, 2).join(', ')}
            {item.brandNames.length > 2 && ` +${item.brandNames.length - 2}`}
          </p>
        )}
      </td>

      {/* Category */}
      <td className="px-5 py-4">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor: 'hsl(var(--secondary))',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          {item.category}
        </span>
      </td>

      {/* Quantity */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            {item.quantity}
          </span>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {item.unit}s
          </span>
          {isLowStock && (
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'hsl(38 92% 50%)' }} />
          )}
        </div>
      </td>

      {/* Price */}
      <td className="px-5 py-4">
        <span style={{ color: 'hsl(var(--foreground))' }}>
          {item.price ? `₹${item.price}` : '—'}
        </span>
      </td>

      {/* Status */}
      <td className="px-5 py-4">
        <span
          className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: isOutOfStock
              ? 'hsl(0 84% 60% / 0.1)'
              : isLowStock
              ? 'hsl(38 92% 50% / 0.1)'
              : 'hsl(var(--primary) / 0.1)',
            color: isOutOfStock
              ? 'hsl(0 84% 60%)'
              : isLowStock
              ? 'hsl(38 92% 50%)'
              : 'hsl(var(--primary))',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'In stock'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'hsl(var(--secondary))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'hsl(0 84% 60% / 0.1)',
              color: 'hsl(0 84% 60%)',
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

// ── Register Pharmacy Modal ───────────────────────────────────────────────────
const RegisterPharmacyModal = ({ onClose, onSuccess, theme }) => {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', licenceNumber: '', phone: '',
    street: '', city: '', state: '', pincode: '',
    open: '09:00', close: '21:00',
    coordinates: null,
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const detectLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          coordinates: [pos.coords.longitude, pos.coords.latitude],
        }));
        setLocationLoading(false);
        toast.success('Location pinned!');
      },
      () => {
        toast.error('Could not detect location');
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.coordinates) {
      toast.error('Please pin your pharmacy location first');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/pharmacies/register', {
        name: form.name,
        licenceNumber: form.licenceNumber,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        coordinates: form.coordinates,
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

  const inputStyle = {
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--foreground))',
    border: '1.5px solid hsl(var(--border))',
  };

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'hsl(var(--foreground))' }}>
              Register Pharmacy
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Set up your pharmacy profile
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}>
            <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Pharmacy name */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'hsl(var(--foreground))' }}>
              Pharmacy Name
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: 'hsl(var(--foreground))' }}>
                Licence Number
              </label>
              <input name="licenceNumber" value={form.licenceNumber} onChange={handleChange} required
                placeholder="MH-2024-001"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: 'hsl(var(--foreground))' }}>
                Phone
              </label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                placeholder="9876543210"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'hsl(var(--foreground))' }}>
              Street Address
            </label>
            <input name="street" value={form.street} onChange={handleChange}
              placeholder="College Road"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'city', placeholder: 'Nashik' },
              { name: 'state', placeholder: 'Maharashtra' },
              { name: 'pincode', placeholder: '422005' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium mb-1.5 capitalize"
                  style={{ color: 'hsl(var(--foreground))' }}>
                  {f.name}
                </label>
                <input name={f.name} value={form[f.name]} onChange={handleChange}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </div>
            ))}
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'open', label: 'Opening Time' },
              { name: 'close', label: 'Closing Time' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-sm font-medium mb-1.5"
                  style={{ color: 'hsl(var(--foreground))' }}>
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

          {/* Location pin */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'hsl(var(--foreground))' }}>
              Pharmacy Location
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={locationLoading}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: form.coordinates
                  ? 'hsl(var(--primary) / 0.1)'
                  : 'hsl(var(--secondary))',
                color: form.coordinates
                  ? 'hsl(var(--primary))'
                  : 'hsl(var(--muted-foreground))',
                border: '1.5px solid hsl(var(--border))',
              }}
            >
              {locationLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : form.coordinates
                ? <Check className="w-4 h-4" />
                : <Store className="w-4 h-4" />
              }
              {locationLoading
                ? 'Detecting...'
                : form.coordinates
                ? `Location pinned (${form.coordinates[1].toFixed(4)}, ${form.coordinates[0].toFixed(4)})`
                : 'Pin my current location'
              }
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
              : 'Register Pharmacy'
            }
          </button>
        </form>
      </motion.div>
    </ModalOverlay>
  );
};

// ── Add / Edit Inventory Modal ────────────────────────────────────────────────
const InventoryModal = ({ editingItem, onClose, onSuccess, theme }) => {
  const isEdit = !!editingItem;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    medicineName: editingItem?.medicineName || '',
    brandNames: editingItem?.brandNames?.join(', ') || '',
    saltComposition: editingItem?.saltComposition || '',
    category: editingItem?.category || 'other',
    quantity: editingItem?.quantity ?? '',
    price: editingItem?.price ?? '',
    unit: editingItem?.unit || 'strip',
    lowStockThreshold: editingItem?.lowStockThreshold ?? 10,
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        brandNames: form.brandNames
          ? form.brandNames.split(',').map((b) => b.trim()).filter(Boolean)
          : [],
        quantity: Number(form.quantity),
        price: form.price ? Number(form.price) : undefined,
        lowStockThreshold: Number(form.lowStockThreshold),
      };

      let data;
      if (isEdit) {
        const res = await api.put(`/inventory/${editingItem._id}`, payload);
        data = res.data.item;
      } else {
        const res = await api.post('/inventory', payload);
        data = res.data.item;
      }

      toast.success(isEdit ? 'Medicine updated!' : 'Medicine added!');
      onSuccess(data, isEdit);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'hsl(var(--secondary))',
    color: 'hsl(var(--foreground))',
    border: '1.5px solid hsl(var(--border))',
  };

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'hsl(var(--foreground))' }}>
              {isEdit ? 'Edit Medicine' : 'Add Medicine'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {isEdit ? `Editing ${editingItem.medicineName}` : 'Add a new medicine to your inventory'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}>
            <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Medicine name */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'hsl(var(--foreground))' }}>
              Medicine Name *
            </label>
            <input name="medicineName" value={form.medicineName} onChange={handleChange}
              required disabled={isEdit}
              placeholder="Paracetamol"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ ...inputStyle, opacity: isEdit ? 0.6 : 1 }}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          {/* Brand names */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'hsl(var(--foreground))' }}>
              Brand Names
              <span className="ml-1 font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>
                (comma separated)
              </span>
            </label>
            <input name="brandNames" value={form.brandNames} onChange={handleChange}
              placeholder="Crocin, Calpol, Dolo"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          {/* Salt composition */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'hsl(var(--foreground))' }}>
              Salt Composition
            </label>
            <input name="saltComposition" value={form.saltComposition} onChange={handleChange}
              placeholder="Paracetamol 500mg"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
              onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1.5"
              style={{ color: 'hsl(var(--foreground))' }}>
              Category
            </label>
            <div className="relative">
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none capitalize"
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: 'hsl(var(--foreground))' }}>
                Quantity *
              </label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange}
                required min="0" placeholder="50"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: 'hsl(var(--foreground))' }}>
                Unit
              </label>
              <div className="relative">
                <select name="unit" value={form.unit} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none capitalize"
                  style={inputStyle}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
            </div>
          </div>

          {/* Price + Low stock threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: 'hsl(var(--foreground))' }}>
                Price (&#8377;)
              </label>
              <input type="number" name="price" value={form.price} onChange={handleChange}
                min="0" placeholder="25"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5"
                style={{ color: 'hsl(var(--foreground))' }}>
                Low Stock Alert
              </label>
              <input type="number" name="lowStockThreshold" value={form.lowStockThreshold}
                onChange={handleChange} min="1" placeholder="10"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Adding...'}
                </>
              : isEdit ? 'Update Medicine' : 'Add Medicine'
            }
          </button>
        </form>
      </motion.div>
    </ModalOverlay>
  );
};

// ── Modal Overlay ─────────────────────────────────────────────────────────────
const ModalOverlay = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
  >
    {children}
  </motion.div>
);

export default DashboardPage;