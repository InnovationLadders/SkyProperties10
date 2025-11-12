import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const validateUnitData = (unit) => {
  const errors = [];

  if (!unit.propertyId || typeof unit.propertyId !== 'string') {
    errors.push('propertyId is required and must be a string');
  }

  if (!unit.unitNumber || typeof unit.unitNumber !== 'string') {
    errors.push('unitNumber is required and must be a string');
  }

  if (!unit.floor) {
    errors.push('floor is required');
  }

  if (unit.price === undefined || unit.price === null || typeof unit.price !== 'number') {
    errors.push('price is required and must be a number');
  }

  if (!unit.status || typeof unit.status !== 'string') {
    errors.push('status is required and must be a string');
  }

  if (unit.size !== undefined && typeof unit.size !== 'number') {
    errors.push('size must be a number');
  }

  if (unit.category && !['normal', 'facility'].includes(unit.category)) {
    errors.push('category must be either "normal" or "facility"');
  }

  if (unit.category === 'facility' && !unit.facilityType) {
    errors.push('facilityType is required when category is "facility"');
  }

  if (unit.facilityType && !['carParking', 'outdoorPark', 'kiosk'].includes(unit.facilityType)) {
    errors.push('facilityType must be "carParking", "outdoorPark", or "kiosk"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const exportUnitsData = async () => {
  try {
    const unitsSnapshot = await getDocs(collection(db, 'units'));
    const units = unitsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `units_export_${timestamp}.json`;

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalUnits: units.length,
      units,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      count: units.length,
      filename,
    };
  } catch (error) {
    console.error('Error exporting units:', error);
    throw new Error('Failed to export units data');
  }
};

export const checkForDuplicates = async (units) => {
  const duplicates = [];

  for (const unit of units) {
    const q = query(
      collection(db, 'units'),
      where('propertyId', '==', unit.propertyId),
      where('unitNumber', '==', unit.unitNumber)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      duplicates.push({
        unitNumber: unit.unitNumber,
        propertyId: unit.propertyId,
        existingId: snapshot.docs[0].id,
      });
    }
  }

  return duplicates;
};

export const importUnitsData = async (unitsData, options = {}) => {
  const { skipDuplicates = true, overwriteDuplicates = false } = options;

  try {
    if (!Array.isArray(unitsData)) {
      throw new Error('Units data must be an array');
    }

    const validationResults = unitsData.map((unit, index) => ({
      index,
      unit,
      validation: validateUnitData(unit),
    }));

    const validUnits = validationResults.filter(r => r.validation.isValid).map(r => r.unit);
    const invalidUnits = validationResults.filter(r => !r.validation.isValid);

    if (validUnits.length === 0) {
      return {
        success: false,
        message: 'No valid units to import',
        imported: 0,
        failed: invalidUnits.length,
        errors: invalidUnits,
      };
    }

    const duplicates = await checkForDuplicates(validUnits);

    let unitsToImport = validUnits;
    if (skipDuplicates && !overwriteDuplicates) {
      const duplicateKeys = duplicates.map(d => `${d.propertyId}-${d.unitNumber}`);
      unitsToImport = validUnits.filter(
        unit => !duplicateKeys.includes(`${unit.propertyId}-${unit.unitNumber}`)
      );
    }

    const batchSize = 500;
    let importedCount = 0;

    for (let i = 0; i < unitsToImport.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchUnits = unitsToImport.slice(i, i + batchSize);

      for (const unit of batchUnits) {
        const unitRef = doc(collection(db, 'units'));
        const unitData = {
          ...unit,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        delete unitData.id;

        batch.set(unitRef, unitData);
        importedCount++;
      }

      await batch.commit();
    }

    return {
      success: true,
      message: `Successfully imported ${importedCount} units`,
      imported: importedCount,
      failed: invalidUnits.length,
      skipped: duplicates.length,
      errors: invalidUnits,
      duplicates,
    };
  } catch (error) {
    console.error('Error importing units:', error);
    throw error;
  }
};

export const parseImportFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const data = JSON.parse(content);

        if (data.units && Array.isArray(data.units)) {
          resolve(data.units);
        } else if (Array.isArray(data)) {
          resolve(data);
        } else {
          reject(new Error('Invalid file format. Expected an array of units or an object with "units" property.'));
        }
      } catch (error) {
        reject(new Error('Failed to parse JSON file. Please ensure the file is valid JSON.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};
