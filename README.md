# MediFind 💊

> Real-time medicine availability finder — search pharmacies near you, manage inventory live.

![MediFind](https://img.shields.io/badge/MediFind-v1.0.0-10b981?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=for-the-badge&logo=socket.io)

---

## What is MediFind?

MediFind is a full-stack web application that bridges the gap between patients and pharmacies. Instead of calling multiple pharmacies or physically visiting them, patients can search for any medicine by name, brand, or salt composition and instantly see which nearby pharmacies have it in stock — with live quantity updates.

Pharmacies get a dedicated dashboard to manage their inventory in real-time, with bulk CSV upload support and automatic low-stock alerts.

---

## Features

### For Patients
- **Partial search** — type `"para"` to find Paracetamol, `"croc"` to find Crocin
- **Search by anything** — generic name, brand name, or salt composition
- **Geolocation-based results** — finds pharmacies within a configurable 1–25 km radius
- **Live stock updates** — socket.io pushes real-time notifications when nearby stock changes
- **Directions** — one-tap Google Maps directions to any pharmacy
- **Google OAuth** — sign in with Google

### For Pharmacy Staff
- **Inventory dashboard** — full CRUD for medicine stock
- **Bulk CSV upload** — add or update hundreds of medicines at once
- **Low stock alerts** — configurable threshold per medicine with visual warnings
- **Real-time sync** — every stock update is instantly broadcast to searching patients
- **Google Maps registration** — pin pharmacy location on an interactive map with autocomplete search

### General
- **Dark / Light mode** — persisted across sessions
- **Fully responsive** — mobile-first design with bottom sheet modals on small screens
- **Role-based access** — patient, pharmacy staff, and admin portals
- **Google OAuth 2.0** — sign in or register with Google

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| State Management | Redux Toolkit |
| Animations | Framer Motion |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Real-time | Socket.io |
| Auth | JWT, Passport.js, Google OAuth 2.0 |
| Maps | Google Maps JavaScript API, Places API |
| File Upload | Multer, PapaParse (CSV) |
| UI Components | Shadcn/ui, Lucide React, React Hot Toast |

---

## Project Structure

```
medifind/
├── client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── app/
│   │   │   └── store.js           # Redux store
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── ProtectedRoute.jsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── authSlice.js   # Auth state + thunks
│   │   │   └── medicine/
│   │   │       └── medicineSlice.js
│   │   ├── hooks/
│   │   │   ├── useDebounce.js
│   │   │   ├── useSocket.js
│   │   │   └── useTheme.js
│   │   ├── pages/
│   │   │   ├── auth/              # Login, Register
│   │   │   ├── oauth/             # Google callback, button
│   │   │   ├── patient/           # SearchPage
│   │   │   └── pharmacy/          # DashboardPage, PharmacyRegisterModal
│   │   ├── services/
│   │   │   └── api.js             # Axios instance with JWT interceptor
│   │   ├── App.jsx
│   │   └── index.css              # CSS variables + Tailwind
│   └── package.json
│
└── server/                        # Node.js + Express backend
    ├── config/
    │   ├── db.js                  # MongoDB connection
    │   └── passport.js            # Google OAuth strategy
    ├── controllers/
    │   ├── authController.js
    │   ├── inventoryController.js
    │   ├── medicineController.js
    │   ├── pharmacyController.js
    │   └── adminController.js
    ├── middleware/
    │   ├── authMiddleware.js      # JWT protect
    │   └── roleMiddleware.js      # Role-based authorise
    ├── models/
    │   ├── User.js
    │   ├── Pharmacy.js
    │   ├── Inventory.js
    │   ├── Medicine.js
    │   └── Alert.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── pharmacyRoutes.js
    │   ├── inventoryRoutes.js
    │   ├── medicineRoutes.js
    │   └── adminRoutes.js
    ├── utils/
    │   ├── generateToken.js
    │   └── csvParser.js
    └── server.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud project with **Maps JavaScript API**, **Places API**, and **Google OAuth 2.0** enabled

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/medifind.git
cd medifind
```

### 2. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/medifind
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Start the server:

```bash
npm run dev
```

### 3. Set up the client

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Start the client:

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|---|---|
| `PORT` | Port for Express server (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRE` | JWT expiry duration (e.g. `7d`) |
| `CLIENT_URL` | Frontend URL for CORS and OAuth redirect |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL |

### Client (`client/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_SOCKET_URL` | Socket.io server URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps + Places API key |

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login with email/password |
| `GET` | `/api/auth/me` | Protected | Get current user |
| `POST` | `/api/auth/switch-to-pharmacy` | Protected | Switch patient role to pharmacy staff |
| `GET` | `/api/auth/google` | Public | Initiate Google OAuth |
| `GET` | `/api/auth/google/callback` | Public | Google OAuth callback |

### Pharmacies

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/pharmacies/nearby` | Public | Search pharmacies by medicine + location |
| `POST` | `/api/pharmacies/register` | Pharmacy Staff | Register a pharmacy |
| `GET` | `/api/pharmacies/me` | Pharmacy Staff | Get own pharmacy |
| `PUT` | `/api/pharmacies/me` | Pharmacy Staff | Update pharmacy details |
| `GET` | `/api/pharmacies/:id/inventory` | Public | Get pharmacy's full inventory |

### Inventory

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/inventory/me` | Pharmacy Staff | Get own inventory |
| `POST` | `/api/inventory` | Pharmacy Staff | Add medicine to inventory |
| `PUT` | `/api/inventory/:id` | Pharmacy Staff | Update inventory item |
| `DELETE` | `/api/inventory/:id` | Pharmacy Staff | Remove inventory item |
| `POST` | `/api/inventory/bulk` | Pharmacy Staff | Bulk upload via CSV |

### Medicines (Master List)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/medicines/search?q=` | Public | Search medicine master list |
| `GET` | `/api/medicines/:id` | Public | Get medicine by ID |
| `POST` | `/api/medicines` | Admin | Add medicine to master list |
| `PUT` | `/api/medicines/:id` | Admin | Update medicine |
| `DELETE` | `/api/medicines/:id` | Admin | Delete medicine |

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/pharmacies/pending` | Admin | Get pending pharmacy verifications |
| `PATCH` | `/api/admin/pharmacies/:id/verify` | Admin | Verify or reject a pharmacy |
| `GET` | `/api/admin/users` | Admin | List all users |
| `PATCH` | `/api/admin/users/:id/toggle` | Admin | Suspend or activate a user |
| `GET` | `/api/admin/analytics` | Admin | Platform analytics |

---

## User Roles

| Role | Access |
|---|---|
| `patient` | Search medicines, view pharmacy stock, use Google OAuth |
| `pharmacy_staff` | Everything in patient + manage own pharmacy + inventory |
| `admin` | Everything + verify pharmacies + manage users + analytics |

A patient can self-upgrade to `pharmacy_staff` by registering a pharmacy from the patient dashboard. The app issues a new JWT with the updated role automatically.

---

## Bulk CSV Upload

Pharmacy staff can upload a CSV to add or update medicines in bulk.

**Required columns:** `medicineName`, `quantity`

**Optional columns:** `brandNames`, `saltComposition`, `category`, `price`, `unit`, `lowStockThreshold`

**Format notes:**
- `brandNames` — pipe-separated: `Crocin|Calpol|Dolo`
- `category` — one of: `antibiotic`, `analgesic`, `antiviral`, `antifungal`, `cardiovascular`, `diabetes`, `respiratory`, `vitamin`, `other`
- `unit` — one of: `strip`, `bottle`, `vial`, `sachet`, `tube`, `other`
- If a medicine with the same name already exists in the pharmacy's inventory, its quantity and price are updated instead of creating a duplicate

**Example:**

```csv
medicineName,brandNames,saltComposition,category,quantity,price,unit,lowStockThreshold
Paracetamol,Crocin|Calpol|Dolo,Paracetamol 500mg,analgesic,100,25,strip,15
Amoxicillin,Mox|Novamox,Amoxicillin 500mg,antibiotic,60,85,strip,10
```

---

## Real-time Architecture

Socket.io is used to push stock updates to all connected clients instantly.

```
Pharmacy Staff updates stock
        ↓
  Express API saves to MongoDB
        ↓
  io.emit('stock_updated', { medicineName, quantity, inStock, pharmacyId })
        ↓
  All connected patients receive the event
        ↓
  If the updated medicine matches current search query → auto re-fetch results
```

---

## Search Algorithm

The patient search uses **MongoDB regex** across three fields simultaneously:

```js
{ medicineName: /query/i }   // "para"  → "Paracetamol"
{ brandNames:   /query/i }   // "croc"  → "Crocin"
{ saltComposition: /query/i } // "500mg" → any 500mg medicine
```

Combined with geospatial filtering using MongoDB's `$near` operator on a `2dsphere` index, results are always relevant to the patient's current location within the selected radius.

---

## Google OAuth Flow

```
1. User clicks "Sign in with Google"
2. Frontend redirects → GET /api/auth/google
3. Passport redirects → Google consent screen
4. Google redirects → GET /api/auth/google/callback
5. Passport verifies profile, finds or creates user
6. Server issues JWT, redirects → /oauth/callback?token=...&role=...
7. Frontend stores token, fetches user profile, navigates to correct portal
```

---

## Screenshots

| Patient Search | Pharmacy Dashboard | Register Pharmacy |
|---|---|---|
| Live medicine search with geolocation | Inventory table with stock stats | Google Maps location picker |

---

## Known Limitations

- Admin portal UI is not yet implemented (API is fully built)
- Google Maps API key must have billing enabled for production use
- Pharmacy verification by admin is in the API but not enforced on search results yet (all active pharmacies appear)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ · MediFind — Medicine, found fast.
</div>