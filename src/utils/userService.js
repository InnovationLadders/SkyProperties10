import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  deleteUser as deleteAuthUser
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { USER_ROLES } from './constants';

const USERS_COLLECTION = 'users';
const UNITS_COLLECTION = 'units';
const PROPERTIES_COLLECTION = 'properties';

export const getAllUsers = async () => {
  try {
    console.log('[userService] getAllUsers - Starting');
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    console.log('[userService] getAllUsers - Executing query');
    const snapshot = await getDocs(q);
    console.log('[userService] getAllUsers - Query complete, docs:', snapshot.docs.length);
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('[userService] getAllUsers - Returning users:', users.length);
    return users;
  } catch (error) {
    console.error('[userService] Error fetching all users:', error);
    console.error('[userService] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const units = await getUserUnits(userId);

    return {
      id: userDoc.id,
      ...userDoc.data(),
      assignedUnits: units
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const { email, password, displayName, phoneNumber, role } = userData;

    if (!email || !password || !displayName || !role) {
      throw new Error('Missing required fields');
    }

    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error('Invalid role');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocData = {
      uid: user.uid,
      email: email,
      displayName: displayName,
      phoneNumber: phoneNumber || '',
      role: role,
      photoURL: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, USERS_COLLECTION, user.uid), userDocData);

    return {
      id: user.uid,
      ...userDocData
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    delete updateData.uid;
    delete updateData.email;
    delete updateData.createdAt;

    await updateDoc(userRef, updateData);

    return {
      id: userId,
      ...userDoc.data(),
      ...updateData
    };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const units = await getUserUnits(userId);

    for (const unit of units) {
      if (unit.ownerId === userId) {
        await updateDoc(doc(db, UNITS_COLLECTION, unit.id), { ownerId: '' });
      }
      if (unit.tenantId === userId) {
        await updateDoc(doc(db, UNITS_COLLECTION, unit.id), { tenantId: '' });
      }
    }

    await deleteDoc(doc(db, USERS_COLLECTION, userId));

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const changeUserRole = async (userId, newRole) => {
  try {
    if (!Object.values(USER_ROLES).includes(newRole)) {
      throw new Error('Invalid role');
    }

    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error changing user role:', error);
    throw error;
  }
};

export const assignUnitToUser = async (unitId, userId, assignmentType) => {
  try {
    const unitRef = doc(db, UNITS_COLLECTION, unitId);
    const unitDoc = await getDoc(unitRef);

    if (!unitDoc.exists()) {
      throw new Error('Unit not found');
    }

    const unitData = unitDoc.data();

    if (assignmentType === 'owner') {
      await updateDoc(unitRef, {
        ownerId: userId,
        updatedAt: Timestamp.now()
      });
    } else if (assignmentType === 'tenant') {
      if (unitData.status === 'sold') {
        throw new Error('Cannot assign tenant to sold unit');
      }
      await updateDoc(unitRef, {
        tenantId: userId,
        updatedAt: Timestamp.now()
      });
    } else {
      throw new Error('Invalid assignment type');
    }

    return true;
  } catch (error) {
    console.error('Error assigning unit to user:', error);
    throw error;
  }
};

export const unassignUnitFromUser = async (unitId, assignmentType) => {
  try {
    const unitRef = doc(db, UNITS_COLLECTION, unitId);

    if (assignmentType === 'owner') {
      await updateDoc(unitRef, {
        ownerId: '',
        updatedAt: Timestamp.now()
      });
    } else if (assignmentType === 'tenant') {
      await updateDoc(unitRef, {
        tenantId: '',
        updatedAt: Timestamp.now()
      });
    } else {
      throw new Error('Invalid assignment type');
    }

    return true;
  } catch (error) {
    console.error('Error unassigning unit from user:', error);
    throw error;
  }
};

export const getUserUnits = async (userId) => {
  try {
    const unitsRef = collection(db, UNITS_COLLECTION);
    const ownerQuery = query(unitsRef, where('ownerId', '==', userId));
    const tenantQuery = query(unitsRef, where('tenantId', '==', userId));

    const [ownerSnapshot, tenantSnapshot] = await Promise.all([
      getDocs(ownerQuery),
      getDocs(tenantQuery)
    ]);

    const units = [];
    const unitIds = new Set();

    ownerSnapshot.docs.forEach(doc => {
      if (!unitIds.has(doc.id)) {
        units.push({
          id: doc.id,
          ...doc.data(),
          assignmentType: 'owner'
        });
        unitIds.add(doc.id);
      }
    });

    tenantSnapshot.docs.forEach(doc => {
      if (!unitIds.has(doc.id)) {
        units.push({
          id: doc.id,
          ...doc.data(),
          assignmentType: 'tenant'
        });
        unitIds.add(doc.id);
      } else {
        const existingUnit = units.find(u => u.id === doc.id);
        if (existingUnit) {
          existingUnit.assignmentType = 'both';
        }
      }
    });

    return units;
  } catch (error) {
    console.error('Error fetching user units:', error);
    throw error;
  }
};

export const getUsersByRole = async (role) => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};

export const getPropertyManagerUsers = async (managerId) => {
  try {
    console.log('[userService] getPropertyManagerUsers - Starting for managerId:', managerId);
    const propertiesRef = collection(db, PROPERTIES_COLLECTION);
    const propertiesQuery = query(propertiesRef, where('managerId', '==', managerId));
    console.log('[userService] getPropertyManagerUsers - Fetching properties');
    const propertiesSnapshot = await getDocs(propertiesQuery);

    const propertyIds = propertiesSnapshot.docs.map(doc => doc.id);
    console.log('[userService] getPropertyManagerUsers - Found properties:', propertyIds.length);

    if (propertyIds.length === 0) {
      console.log('[userService] getPropertyManagerUsers - No properties found, returning empty array');
      return [];
    }

    const unitsRef = collection(db, UNITS_COLLECTION);
    const unitsQuery = query(unitsRef, where('propertyId', 'in', propertyIds));
    console.log('[userService] getPropertyManagerUsers - Fetching units');
    const unitsSnapshot = await getDocs(unitsQuery);
    console.log('[userService] getPropertyManagerUsers - Found units:', unitsSnapshot.docs.length);

    const userIds = new Set();
    unitsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.ownerId) userIds.add(data.ownerId);
      if (data.tenantId) userIds.add(data.tenantId);
    });
    console.log('[userService] getPropertyManagerUsers - Found unique user IDs:', userIds.size);

    if (userIds.size === 0) {
      console.log('[userService] getPropertyManagerUsers - No users found, returning empty array');
      return [];
    }

    const users = [];
    console.log('[userService] getPropertyManagerUsers - Fetching user details');
    for (const userId of userIds) {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (userDoc.exists()) {
        users.push({
          id: userDoc.id,
          ...userDoc.data()
        });
      }
    }
    console.log('[userService] getPropertyManagerUsers - Returning users:', users.length);

    return users;
  } catch (error) {
    console.error('[userService] Error fetching property manager users:', error);
    console.error('[userService] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

export const canUserManageUser = (currentUser, targetUserId) => {
  if (currentUser.role === USER_ROLES.ADMIN) {
    return true;
  }

  if (currentUser.role === USER_ROLES.PROPERTY_MANAGER) {
    return true;
  }

  return false;
};
