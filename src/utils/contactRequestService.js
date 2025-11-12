import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CONTACT_REQUEST_STATUS } from './constants';

export const createContactRequest = async (contactData) => {
  try {
    const contactRequest = {
      name: contactData.name,
      email: contactData.email,
      phoneNumber: contactData.phoneNumber || '',
      message: contactData.message,
      propertyId: contactData.propertyId,
      propertyName: contactData.propertyName || '',
      unitId: contactData.unitId || null,
      unitNumber: contactData.unitNumber || '',
      userId: contactData.userId || null,
      userRole: contactData.userRole || null,
      status: CONTACT_REQUEST_STATUS.NEW,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Creating contact request:', {
      name: contactRequest.name,
      propertyId: contactRequest.propertyId,
      unitId: contactRequest.unitId,
    });

    const docRef = await addDoc(collection(db, 'contactRequests'), contactRequest);
    console.log('Contact request created successfully with ID:', docRef.id);
    return { id: docRef.id, ...contactRequest };
  } catch (error) {
    console.error('Error creating contact request:', error);
    throw error;
  }
};

export const getContactRequestById = async (requestId) => {
  try {
    const requestDoc = await getDoc(doc(db, 'contactRequests', requestId));
    if (requestDoc.exists()) {
      return { id: requestDoc.id, ...requestDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting contact request:', error);
    throw error;
  }
};

export const getUserContactRequests = async (userId) => {
  try {
    const q = query(
      collection(db, 'contactRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return requests;
  } catch (error) {
    console.error('Error getting user contact requests:', error);
    throw error;
  }
};

export const getPropertyContactRequests = async (propertyId) => {
  try {
    const q = query(
      collection(db, 'contactRequests'),
      where('propertyId', '==', propertyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return requests;
  } catch (error) {
    console.error('Error getting property contact requests:', error);
    throw error;
  }
};

export const getAllContactRequests = async (filters = {}) => {
  try {
    let q = collection(db, 'contactRequests');
    const constraints = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters.propertyId) {
      constraints.push(where('propertyId', '==', filters.propertyId));
    }

    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (constraints.length > 0) {
      q = query(collection(db, 'contactRequests'), ...constraints);
    }

    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return requests;
  } catch (error) {
    console.error('Error getting all contact requests:', error);
    throw error;
  }
};

export const updateContactRequestStatus = async (requestId, status) => {
  try {
    const requestRef = doc(db, 'contactRequests', requestId);
    await updateDoc(requestRef, {
      status: status,
      updatedAt: Timestamp.now(),
    });
    console.log('Contact request status updated:', requestId, status);
  } catch (error) {
    console.error('Error updating contact request status:', error);
    throw error;
  }
};

export const markContactRequestAsRead = async (requestId) => {
  try {
    await updateContactRequestStatus(requestId, CONTACT_REQUEST_STATUS.READ);
  } catch (error) {
    console.error('Error marking contact request as read:', error);
    throw error;
  }
};

export const markContactRequestAsResponded = async (requestId) => {
  try {
    await updateContactRequestStatus(requestId, CONTACT_REQUEST_STATUS.RESPONDED);
  } catch (error) {
    console.error('Error marking contact request as responded:', error);
    throw error;
  }
};

export const getNewContactRequestsCount = async (propertyId) => {
  try {
    const q = query(
      collection(db, 'contactRequests'),
      where('propertyId', '==', propertyId),
      where('status', '==', CONTACT_REQUEST_STATUS.NEW)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting new contact requests count:', error);
    throw error;
  }
};
