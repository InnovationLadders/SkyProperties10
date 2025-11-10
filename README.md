# SkyProperties - Property Management & Marketplace

A comprehensive bilingual (English/Arabic) property management and marketplace platform built with React, Firebase, and Three.js.

## Features

### Core Functionality
- **Multi-role Authentication System**: Support for 6 user roles (Admin, Property Manager, Unit Owner, Tenant, Service Provider, Public)
- **Property & Unit Management**: Complete CRUD operations for properties and units
- **3D Building Visualization**: Interactive 3D models using React Three Fiber with clickable hotspots
- **Bilingual Support**: Full English and Arabic support with RTL layout
- **Dark/Light Mode**: Theme switching with system preference detection
- **Responsive Design**: Mobile-first design that works on all screen sizes

### User Roles & Permissions

1. **Admin**: Full system control, user management, analytics
2. **Property Manager**: Manage properties, units, tickets, contracts, and local users
3. **Unit Owner**: Manage owned units, list for sale/rent, submit maintenance tickets
4. **Tenant**: View rental details, pay rent, submit maintenance requests
5. **Service Provider**: Manage services, accept tickets, track work
6. **Public**: Browse properties, view 3D models, filter/search units (no login required)

### Key Features
- **Landing Page**: Searchable property marketplace with filters
- **Property Home Page**: 3D building model with interactive hotspots for each unit
- **Dashboard**: Role-based dashboard with relevant actions and information
- **Authentication**: Email/password and Google OAuth support
- **Real-time Updates**: Firebase Firestore for instant data synchronization

## Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: TailwindCSS v4, Framer Motion
- **3D Visualization**: React Three Fiber, Three.js, @react-three/drei
- **Backend**: Firebase (Firestore, Authentication, Storage, Analytics)
- **Internationalization**: react-i18next
- **UI Components**: Custom components inspired by shadcn/ui
- **Icons**: Lucide React
- **Routing**: React Router v7

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (already configured)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd project
```

2. Install dependencies
```bash
npm install
```

3. Environment is pre-configured with Firebase credentials

4. Start development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

6. Preview production build
```bash
npm preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Card, Input, etc.)
│   ├── layout/         # Layout components (Navbar, MainLayout)
│   └── property/       # Property-specific components (3D Model)
├── contexts/           # React contexts (Auth, Theme)
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   └── property/      # Property pages
├── lib/               # Core utilities (Firebase, i18n, helpers)
├── locales/           # Translation files (en.json, ar.json)
├── styles/            # Global styles
└── utils/             # Utility functions and constants
```

## Firebase Collections Schema

### users
- uid, email, role, displayName, photoURL, createdAt

### properties
- name, address, description, modelUrl, totalUnits, availableUnits, managerId, createdAt

### units
- propertyId, unitNumber, floor, type, size, price, status, listingType, viewType, coordinates, description, ownerId, tenantId

### tickets
- propertyId, unitId, title, description, status, priority, createdBy, assignedTo, createdAt, updatedAt

### contracts
- propertyId, unitId, type, status, parties, terms, startDate, endDate, documents

## Available Routes

- `/` - Landing page (public)
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Role-based dashboard (protected)
- `/property/:propertyId` - Property home page with 3D model

## Language Support

The app supports English and Arabic with automatic RTL layout switching. Language preference is persisted in localStorage.

To switch languages:
- Click the globe icon in the navbar
- Language preference applies to all UI elements and layouts

## Theme Support

Toggle between light and dark modes using the sun/moon icon in the navbar. Theme preference is saved and respects system preferences.

## 3D Visualization

The property home page features:
- Interactive 3D building model
- Clickable hotspots for each unit
- Color-coded by listing type (sale/rent) and view (external/internal)
- Zoom and rotation controls
- Unit details panel on hotspot click

### Hotspot Legend
- 🟩 Green Square: Unit for sale (external view)
- 🟢 Green Circle: Unit for sale (internal view)
- 🟦 Blue Square: Unit for rent (external view)
- 🔵 Blue Circle: Unit for rent (internal view)

## Future Enhancements

- Payment gateway integration (Stripe/PayTabs/HyperPay)
- Contract management system
- Ticketing system with service provider assignment
- Notification system (WhatsApp, SMS, Email)
- Admin analytics dashboard
- GLB model upload for properties
- Unit media gallery management
- Advanced search and filters
- Map view integration

## Development Notes

- The project uses Firebase for all backend operations
- Firestore security rules should be configured for production
- 3D models currently use placeholder geometry; implement GLB loader for actual models
- Environment variables are pre-configured but should be secured in production

## License

ISC

## Support

For questions or issues, please contact the development team.
