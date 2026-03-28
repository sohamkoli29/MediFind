import User from '../models/User.js';
import Pharmacy from '../models/Pharmacy.js';
import generateToken from '../utils/generateToken.js';

// ─── Register ────────────────────────────────────────────────────────────────
// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    console.log('1. Body received:', { name, email, role });

    if (role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be self-registered' });
    }

    const existingUser = await User.findOne({ email });
    console.log('2. Existing user check done:', existingUser);

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    console.log('3. About to create user...');
    const user = await User.create({ name, email, password, role, phone });
    console.log('4. User created:', user._id);

    const token = generateToken(user._id, user.role);

    res.status(201).json({ success: true, token });
  } catch (error) {
    console.error('REGISTER ERROR:', error); // full error object
    res.status(500).json({ message: error.message });
  }
};
// ─── Login ───────────────────────────────────────────────────────────────────
// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password (select: false in model)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been suspended' });
    }

    // Use the matchPassword method defined on the model
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    // If pharmacy_staff, fetch their pharmacy's verification status
    let pharmacyStatus = null;
    if (user.role === 'pharmacy_staff') {
      const pharmacy = await Pharmacy.findOne({ owner: user._id }).select(
        'verificationStatus name'
      );
      pharmacyStatus = pharmacy || null;
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      pharmacy: pharmacyStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Me ──────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  try {
    // req.user is already attached by authMiddleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};