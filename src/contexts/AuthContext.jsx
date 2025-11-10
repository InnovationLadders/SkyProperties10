import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        console.log('Auth state changed - User logged in:', {
          uid: user.uid,
          email: user.email
        });

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data();
          console.log('User profile loaded:', {
            uid: profile.uid,
            email: profile.email,
            role: profile.role
          });
          setUserProfile(profile);
        } else {
          console.warn('User document not found in Firestore for UID:', user.uid);
        }
      } else {
        console.log('Auth state changed - User logged out');
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, role, additionalData = {}) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('Creating new user profile:', {
      uid: user.uid,
      email: user.email,
      role: role || USER_ROLES.PUBLIC
    });

    const userProfileData = {
      uid: user.uid,
      email: user.email,
      role: role || USER_ROLES.PUBLIC,
      createdAt: new Date().toISOString(),
      ...additionalData,
    };

    await setDoc(doc(db, 'users', user.uid), userProfileData);
    console.log('User profile created successfully in Firestore');
    setUserProfile(userProfileData);

    return userCredential;
  };

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async (role = USER_ROLES.PUBLIC) => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    console.log('Google login - User authenticated:', {
      uid: user.uid,
      email: user.email
    });

    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      console.log('Creating new Google user profile in Firestore');
      const userProfileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: role,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfileData);
      console.log('Google user profile created successfully');
      setUserProfile(userProfileData);
    } else {
      console.log('Existing Google user profile found');
    }

    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const hasRole = (roles) => {
    if (!userProfile) return false;
    if (Array.isArray(roles)) {
      return roles.includes(userProfile.role);
    }
    return userProfile.role === roles;
  };

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    hasRole,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
