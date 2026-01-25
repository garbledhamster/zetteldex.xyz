import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../firebase/config.js';
import { executeRecaptcha } from './recaptcha.js';

/**
 * Sign up a new user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} User credential
 */
export async function signUp(email, password) {
  try {
    // Execute reCAPTCHA
    const recaptchaToken = await executeRecaptcha('signup');
    console.log('reCAPTCHA token obtained for signup:', recaptchaToken);

    // Set persistence to LOCAL (survives browser restarts)
    await setPersistence(auth, browserLocalPersistence);

    // Create user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    return {
      success: true,
      user: userCredential.user,
      recaptchaToken
    };
  } catch (error) {
    console.error('Signup error:', error);
    throw {
      success: false,
      code: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}

/**
 * Sign in an existing user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} User credential
 */
export async function signIn(email, password) {
  try {
    // Execute reCAPTCHA
    const recaptchaToken = await executeRecaptcha('login');
    console.log('reCAPTCHA token obtained for login:', recaptchaToken);

    // Set persistence to LOCAL
    await setPersistence(auth, browserLocalPersistence);

    // Sign in user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    return {
      success: true,
      user: userCredential.user,
      recaptchaToken
    };
  } catch (error) {
    console.error('Login error:', error);
    throw {
      success: false,
      code: error.code,
      message: getAuthErrorMessage(error.code)
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Signout error:', error);
    throw {
      success: false,
      code: error.code,
      message: 'Failed to sign out'
    };
  }
}

/**
 * Get the current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function that receives the user object
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get user-friendly error messages
 * @param {string} errorCode
 * @returns {string} Error message
 */
function getAuthErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.'
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
}
