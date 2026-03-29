import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, LogOut, Sun, Moon, Plus, Edit2, Trash2,
  Package, AlertTriangle, TrendingUp, Store,
  Loader2, Search, ChevronDown, X, Check,
  Upload, FileText, AlertCircle, CheckCircle2,
  Navigation, MoreVertical
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import api from '../../services/api';
import useTheme from '../../hooks/useTheme';
import useSocket from '../../hooks/useSocket';
import toast, { Toaster } from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } },
};

const CATEGORIES = [
  'antibiotic', 'analgesic', 'antiviral', 'antifungal',
  'cardiovascular', 'diabetes', 'respiratory', 'vitamin', 'other'
];

const UNITS = ['strip', 'bottle', 'vial', 'sachet', 'tube', 'other'];

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);

  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useSocket((data) => {
    toast.custom(() => (
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
          maxWidth: '90vw',
        }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse shrink-0"
          style={{ backgroundColor: 'hsl(var(--primary))' }} />
        <span className="truncate">
          Stock synced: <strong>{data.medicineName}</strong>
        </span>
      </motion.div>
    ), { duration: 3000 });
  });

  useEffect(() => { fetchPharmacyData(); }, []);

  const fetchPharmacyData = async () => {
    setPageLoading(true);
    try {
      const { data } = await api.get('/pharmacies/me');
      setPharmacy(data.pharmacy);
      await fetchInventory();
    } catch (err) {
      if (err.response?.status === 404) setPharmacy(null);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const { data } = await api.get('/inventory/me');
      setInventory(data.inventory);
    } catch {
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
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const totalSKUs = inventory.length;
  const inStockCount = inventory.filter((i) => i.inStock).length;
  const lowStockCount = inventory.filter((i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;
  const outOfStockCount = inventory.filter((i) => !i.inStock).length;

  const filteredInventory = inventory.filter((item) =>
    item.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brandNames?.some((b) => b.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const skeletonBase = theme === 'dark' ? '#1e2a3a' : '#e8edf2';
  const skeletonHigh = theme === 'dark' ? '#2a3a4e' : '#f0f4f8';

  if (pageLoading) {
    return (
      <div
        className="min-h-screen min-h-dvh p-4 sm:p-8"
        style={{ backgroundColor: 'hsl(var(--background))' }}
      >
        <Skeleton height={56} className="mb-6" baseColor={skeletonBase} highlightColor={skeletonHigh} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={90} borderRadius={16} baseColor={skeletonBase} highlightColor={skeletonHigh} />
          ))}
        </div>
        <Skeleton height={320} borderRadius={16} baseColor={skeletonBase} highlightColor={skeletonHigh} />
      </div>
    );
  }

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
          <div>
            <span className="font-bold text-sm sm:text-base block" style={{ color: 'hsl(var(--foreground))' }}>
              MediFind
            </span>
            {pharmacy && (
              <span className="text-xs block leading-tight" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {pharmacy.name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <span className="hidden md:block text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {user?.name}
          </span>
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
            style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </nav>

      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 max-w-6xl mx-auto">

        {/* ── No pharmacy ── */}
        {!pharmacy ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 sm:py-28 text-center"
          >
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}
            >
              <Store className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
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
            {/* ── Header ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8"
            >
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                  Inventory Dashboard
                </h1>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Manage your medicine stock in real-time
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowCSVModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                  style={{
                    backgroundColor: 'hsl(var(--secondary))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    minHeight: '40px',
                  }}
                >
                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Bulk Upload</span>
                </button>
                <button
                  onClick={() => { setEditingItem(null); setShowInventoryModal(true); }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    minHeight: '40px',
                  }}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Add Medicine</span>
                </button>
              </div>
            </motion.div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {[
                { label: 'Total SKUs', value: totalSKUs, icon: Package, color: '161 94% 30%' },
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
                  className="p-4 sm:p-5 rounded-2xl"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <p
                      className="text-xs font-medium uppercase tracking-wide leading-tight"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      {stat.label}
                    </p>
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `hsl(${stat.color} / 0.1)` }}
                    >
                      <stat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: `hsl(${stat.color})` }} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* ── Inventory ── */}
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
              <div
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid hsl(var(--border))' }}
              >
                <h2 className="font-semibold text-sm sm:text-base" style={{ color: 'hsl(var(--foreground))' }}>
                  Medicine Inventory
                  {filteredInventory.length > 0 && (
                    <span
                      className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'hsl(var(--secondary))',
                        color: 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {filteredInventory.length} items
                    </span>
                  )}
                </h2>
                <div className="relative w-full sm:w-52">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <input
                    type="search"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm outline-none w-full"
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
                <div className="p-4 sm:p-5 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={52} borderRadius={12}
                      baseColor={skeletonBase} highlightColor={skeletonHigh} />
                  ))}
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="py-12 sm:py-16 text-center">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3"
                    style={{ color: 'hsl(var(--muted-foreground))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {searchTerm ? 'No medicines match your search' : 'No medicines in inventory yet'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={() => { setEditingItem(null); setShowInventoryModal(true); }}
                      className="mt-3 text-sm font-semibold nav-btn"
                      style={{ color: 'hsl(var(--primary))' }}
                    >
                      + Add your first medicine
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                          {['Medicine', 'Category', 'Quantity', 'Price', 'Status', 'Actions'].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 sm:px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                              style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
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

                  {/* Mobile cards */}
                  <div className="md:hidden divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
                    {filteredInventory.map((item, i) => (
                      <MobileInventoryCard
                        key={item._id}
                        item={item}
                        index={i}
                        onEdit={() => { setEditingItem(item); setShowInventoryModal(true); }}
                        onDelete={() => handleDelete(item._id, item.medicineName)}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showRegisterModal && (
          <RegisterPharmacyModal
            onClose={() => setShowRegisterModal(false)}
            onSuccess={(p) => { setPharmacy(p); setShowRegisterModal(false); fetchInventory(); }}
            theme={theme}
          />
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {showCSVModal && (
          <CSVUploadModal
            onClose={() => setShowCSVModal(false)}
            onSuccess={() => { setShowCSVModal(false); fetchInventory(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Mobile Inventory Card ─────────────────────────────────────────────────────
const MobileInventoryCard = ({ item, index, onEdit, onDelete }) => {
  const isLowStock = item.quantity > 0 && item.quantity <= item.lowStockThreshold;
  const isOutOfStock = !item.inStock;
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColor = isOutOfStock
    ? 'hsl(0 84% 60%)'
    : isLowStock
    ? 'hsl(38 92% 50%)'
    : 'hsl(var(--primary))';

  const statusBg = isOutOfStock
    ? 'hsl(0 84% 60% / 0.1)'
    : isLowStock
    ? 'hsl(38 92% 50% / 0.1)'
    : 'hsl(var(--primary) / 0.1)';

  const statusLabel = isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'In stock';

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="p-4 flex items-start gap-3 relative"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: 'hsl(var(--foreground))' }}>
              {item.medicineName}
            </p>
            {item.brandNames?.length > 0 && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {item.brandNames.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center nav-btn"
              style={{ backgroundColor: 'hsl(var(--secondary))' }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 rounded-xl shadow-xl overflow-hidden z-10"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    minWidth: '120px',
                  }}
                >
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-left"
                    style={{ color: 'hsl(var(--foreground))' }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-left"
                    style={{ color: 'hsl(0 84% 60%)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span
            className="px-2 py-0.5 rounded-full text-xs capitalize"
            style={{
              backgroundColor: 'hsl(var(--secondary))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {item.category}
          </span>
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ backgroundColor: statusBg, color: statusColor }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {item.quantity} {item.unit}s
            {isLowStock && (
              <AlertTriangle className="inline w-3 h-3 ml-1" style={{ color: 'hsl(38 92% 50%)' }} />
            )}
          </span>
          {item.price && (
            <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
              ₹{item.price}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── Desktop Inventory Row ─────────────────────────────────────────────────────
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
      <td className="px-5 py-4">
        <p className="font-medium text-sm" style={{ color: 'hsl(var(--foreground))' }}>
          {item.medicineName}
        </p>
        {item.brandNames?.length > 0 && (
          <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {item.brandNames.slice(0, 2).join(', ')}
            {item.brandNames.length > 2 && ` +${item.brandNames.length - 2}`}
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
          style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}
        >
          {item.category}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
            {item.quantity}
          </span>
          <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {item.unit}s
          </span>
          {isLowStock && <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'hsl(38 92% 50%)' }} />}
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
          {item.price ? `₹${item.price}` : '—'}
        </span>
      </td>
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
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-lg flex items-center justify-center nav-btn"
            style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg flex items-center justify-center nav-btn"
            style={{ backgroundColor: 'hsl(0 84% 60% / 0.1)', color: 'hsl(0 84% 60%)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </motion.tr>
  );
};

// ── Modal Overlay ─────────────────────────────────────────────────────────────
const ModalOverlay = ({ children, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay"
    style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
  >
    {children}
  </motion.div>
);

// ── Register Pharmacy Modal ───────────────────────────────────────────────────
const RegisterPharmacyModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', licenceNumber: '', phone: '',
    street: '', city: '', state: '', pincode: '',
    open: '09:00', close: '21:00',
    coordinates: null,
  });

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const detectLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({ ...p, coordinates: [pos.coords.longitude, pos.coords.latitude] }));
        setLocationLoading(false);
        toast.success('Location pinned!');
      },
      () => { toast.error('Could not detect location'); setLocationLoading(false); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.coordinates) { toast.error('Please pin your location first'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/pharmacies/register', {
        name: form.name, licenceNumber: form.licenceNumber, phone: form.phone,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
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
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden modal-sheet"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sheet handle on mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--border))' }} />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
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
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'licenceNumber', label: 'Licence Number', placeholder: 'MH-2024-001' },
              { name: 'phone', label: 'Phone', placeholder: '9876543210' },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
                  {f.label}
                </label>
                <input name={f.name} value={form[f.name]} onChange={handleChange} required
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                  onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
                />
              </div>
            ))}
          </div>

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

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
              Pharmacy Location
            </label>
            <button type="button" onClick={detectLocation} disabled={locationLoading}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: form.coordinates ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--secondary))',
                color: form.coordinates ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                border: '1.5px solid hsl(var(--border))',
                minHeight: '44px',
              }}
            >
              {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" />
                : form.coordinates ? <Check className="w-4 h-4" />
                : <Navigation className="w-4 h-4" />}
              {locationLoading ? 'Detecting...'
                : form.coordinates ? `Pinned (${form.coordinates[1].toFixed(3)}, ${form.coordinates[0].toFixed(3)})`
                : 'Pin my current location'}
            </button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              opacity: loading ? 0.7 : 1,
              minHeight: '48px',
            }}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</> : 'Register Pharmacy'}
          </button>
        </form>
      </motion.div>
    </ModalOverlay>
  );
};

// ── Inventory Modal ───────────────────────────────────────────────────────────
const InventoryModal = ({ editingItem, onClose, onSuccess }) => {
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

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        brandNames: form.brandNames ? form.brandNames.split(',').map((b) => b.trim()).filter(Boolean) : [],
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
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden modal-sheet"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          maxHeight: '92dvh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--border))' }} />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="font-bold text-base sm:text-lg" style={{ color: 'hsl(var(--foreground))' }}>
              {isEdit ? 'Edit Medicine' : 'Add Medicine'}
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {isEdit ? `Editing ${editingItem.medicineName}` : 'Add a new medicine to your inventory'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center nav-btn"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}>
            <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
          {[
            { name: 'medicineName', label: 'Medicine Name *', placeholder: 'Paracetamol', required: true, disabled: isEdit },
            { name: 'brandNames', label: 'Brand Names (comma separated)', placeholder: 'Crocin, Calpol, Dolo' },
            { name: 'saltComposition', label: 'Salt Composition', placeholder: 'Paracetamol 500mg' },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
                {f.label}
              </label>
              <input
                name={f.name} value={form[f.name]} onChange={handleChange}
                required={f.required} disabled={f.disabled}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ ...inputStyle, opacity: f.disabled ? 0.6 : 1 }}
                onFocus={(e) => e.target.style.borderColor = 'hsl(var(--primary))'}
                onBlur={(e) => e.target.style.borderColor = 'hsl(var(--border))'}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
              Category
            </label>
            <div className="relative">
              <select name="category" value={form.category} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none capitalize"
                style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'hsl(var(--muted-foreground))' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
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
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
                Unit
              </label>
              <div className="relative">
                <select name="unit" value={form.unit} onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none"
                  style={inputStyle}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'hsl(var(--muted-foreground))' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
                Price (₹)
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
              <label className="block text-xs sm:text-sm font-medium mb-1.5" style={{ color: 'hsl(var(--foreground))' }}>
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

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              opacity: loading ? 0.7 : 1,
              minHeight: '48px',
            }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Updating...' : 'Adding...'}</>
              : isEdit ? 'Update Medicine' : 'Add Medicine'
            }
          </button>
        </form>
      </motion.div>
    </ModalOverlay>
  );
};

// ── CSV Modal ─────────────────────────────────────────────────────────────────
const CSVUploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (f && f.name.endsWith('.csv')) { setFile(f); setResult(null); }
    else toast.error('Please upload a .csv file');
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('csv', file);
      const { data } = await api.post('/inventory/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.results);
      toast.success(`Done! ${data.results.added} added, ${data.results.updated} updated`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden modal-sheet"
        style={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'hsl(var(--border))' }} />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-4"
          style={{ borderBottom: '1px solid hsl(var(--border))' }}>
          <div>
            <h2 className="font-bold text-base sm:text-lg" style={{ color: 'hsl(var(--foreground))' }}>
              Bulk Upload
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Upload CSV to add or update medicines
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center nav-btn"
            style={{ backgroundColor: 'hsl(var(--secondary))' }}>
            <X className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-4">
          <div className="p-3 rounded-xl text-xs font-mono"
            style={{ backgroundColor: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}>
            <p className="font-semibold mb-1 font-sans text-xs" style={{ color: 'hsl(var(--foreground))' }}>
              Required: medicineName, quantity
            </p>
            Optional: brandNames (| separated), saltComposition, category, price, unit, lowStockThreshold
          </div>

          <div
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById('csv-input').click()}
            className="border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all"
            style={{
              borderColor: dragOver ? 'hsl(var(--primary))' : file ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
              backgroundColor: dragOver ? 'hsl(var(--primary) / 0.05)' : 'transparent',
            }}
          >
            <input id="csv-input" type="file" accept=".csv" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
                <p className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{file.name}</p>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {(file.size / 1024).toFixed(1)} KB — tap to change
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8" style={{ color: 'hsl(var(--muted-foreground))' }} />
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                  Drop CSV here or tap to browse
                </p>
              </div>
            )}
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 space-y-2"
              style={{ backgroundColor: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                Upload Summary
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Added', value: result.added, color: 'hsl(var(--primary))' },
                  { label: 'Updated', value: result.updated, color: 'hsl(38 92% 50%)' },
                  { label: 'Skipped', value: result.skipped, color: 'hsl(0 84% 60%)' },
                ].map((s) => (
                  <div key={s.label} className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--card))' }}>
                    <p className="text-lg sm:text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'hsl(0 84% 60%)' }}>
                      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                      {e}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {result ? (
            <button onClick={onSuccess}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                minHeight: '48px',
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Done — Refresh Inventory
            </button>
          ) : (
            <button onClick={handleUpload} disabled={!file || loading}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                opacity: !file || loading ? 0.6 : 1,
                minHeight: '48px',
              }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                : <><Upload className="w-4 h-4" /> Upload CSV</>
              }
            </button>
          )}
        </div>
      </motion.div>
    </ModalOverlay>
  );
};

export default DashboardPage;