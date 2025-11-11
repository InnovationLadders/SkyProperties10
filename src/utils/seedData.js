import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UNIT_STATUS, CONTRACT_STATUS } from './constants';

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    const properties = [
      {
        id: 'prop1',
        name: 'Skyline Towers',
        address: '123 Main Street, Downtown, City',
        description: 'Luxury high-rise building with stunning city views and modern amenities',
        totalUnits: 50,
        availableUnits: 12,
        coordinates: { lat: 24.7136, lng: 46.6753 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        id: 'prop2',
        name: 'Harbor View Residences',
        address: '456 Ocean Drive, Waterfront District',
        description: 'Premium waterfront apartments with private balconies and marina access',
        totalUnits: 30,
        availableUnits: 8,
        coordinates: { lat: 24.7242, lng: 46.6585 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        id: 'prop3',
        name: 'Park Avenue Suites',
        address: '789 Park Avenue, Central Business District',
        description: 'Modern office and residential complex in the heart of the city',
        totalUnits: 40,
        availableUnits: 15,
        coordinates: { lat: 24.7019, lng: 46.6919 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ];

    for (const property of properties) {
      await setDoc(doc(db, 'properties', property.id), property);
      console.log(`Created property: ${property.name}`);
    }

    const units = [
      {
        propertyId: 'prop1',
        unitNumber: 'A101',
        floor: '1',
        type: 'apartment',
        size: 85,
        price: 450000,
        status: UNIT_STATUS.AVAILABLE,
        listingType: 'sale',
        viewType: 'external',
        description: 'Spacious 2-bedroom apartment with modern finishes',
        coordinates: [-2, 2, 0],
      },
      {
        propertyId: 'prop1',
        unitNumber: 'A201',
        floor: '2',
        type: 'apartment',
        size: 90,
        price: 480000,
        status: UNIT_STATUS.AVAILABLE,
        listingType: 'sale',
        viewType: 'external',
        description: 'Premium corner unit with panoramic views',
        coordinates: [-2, 4, 0],
      },
      {
        propertyId: 'prop1',
        unitNumber: 'B101',
        floor: '1',
        type: 'studio',
        size: 45,
        price: 2200,
        status: UNIT_STATUS.AVAILABLE,
        listingType: 'rent',
        viewType: 'internal',
        description: 'Cozy studio perfect for young professionals',
        coordinates: [2, 2, 0],
      },
      {
        propertyId: 'prop2',
        unitNumber: 'W301',
        floor: '3',
        type: 'penthouse',
        size: 150,
        price: 850000,
        status: UNIT_STATUS.AVAILABLE,
        listingType: 'sale',
        viewType: 'external',
        description: 'Luxury penthouse with ocean views',
        coordinates: [0, 6, 0],
      },
      {
        propertyId: 'prop2',
        unitNumber: 'W102',
        floor: '1',
        type: 'apartment',
        size: 75,
        price: 2800,
        status: UNIT_STATUS.RENTED,
        listingType: 'rent',
        viewType: 'internal',
        description: '2-bedroom apartment with marina access',
        coordinates: [-1, 2, 0],
      },
      {
        propertyId: 'prop3',
        unitNumber: 'O505',
        floor: '5',
        type: 'office',
        size: 120,
        price: 4500,
        status: UNIT_STATUS.AVAILABLE,
        listingType: 'rent',
        viewType: 'external',
        description: 'Modern office space with city views',
        coordinates: [0, 10, 0],
      },
    ];

    for (const unit of units) {
      const unitRef = doc(collection(db, 'units'));
      await setDoc(unitRef, {
        ...unit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`Created unit: ${unit.unitNumber}`);
    }

    console.log('Database seeding completed successfully!');
    return { success: true, message: 'Data seeded successfully' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error: error.message };
  }
};

export const runSeeder = () => {
  if (typeof window !== 'undefined' && window.confirm('Do you want to seed the database with sample data?')) {
    seedDatabase().then((result) => {
      if (result.success) {
        alert('Database seeded successfully! Refresh the page to see the data.');
      } else {
        alert(`Error seeding database: ${result.error}`);
      }
    });
  }
};
