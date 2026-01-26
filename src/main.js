// Main entry point - integrates Firebase with the Notes app
import { onAuthChange, signIn, signUp, signOut, getCurrentUser } from './services/auth.js';
import { loadRecaptcha } from './services/recaptcha.js';
import {
  initializeSync,
  stopSync,
  migrateLocalDataToFirebase,
  syncCardToFirebase,
  syncAllCardsToFirebase,
  loadCardsFromFirebase,
  deleteCardFromFirebase
} from './services/sync.js';

// Load legacy script.js
// We'll need to refactor script.js to be module-based, but for now we can access global variables
let appInitialized = false;
let migrationCompleted = false;

// Load reCAPTCHA on page load
loadRecaptcha().catch(error => {
  console.error('Failed to load reCAPTCHA:', error);
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupAuthUI();
  initializeAuthState();
});

/**
 * Set up authentication UI event listeners
 */
function setupAuthUI() {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const cancelLoginBtn = document.getElementById('cancelLoginBtn');
  const cancelSignupBtn = document.getElementById('cancelSignupBtn');
  const submitLoginBtn = document.getElementById('submitLoginBtn');
  const submitSignupBtn = document.getElementById('submitSignupBtn');

  // Show login modal
  loginBtn.addEventListener('click', () => {
    showModal('loginModal');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    hideError('loginError');
  });

  // Show signup modal
  signupBtn.addEventListener('click', () => {
    showModal('signupModal');
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupPasswordConfirm').value = '';
    hideError('signupError');
  });

  // Cancel modals
  cancelLoginBtn.addEventListener('click', () => {
    hideModal('loginModal');
  });

  cancelSignupBtn.addEventListener('click', () => {
    hideModal('signupModal');
  });

  // Submit login
  submitLoginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      showError('loginError', 'Please enter both email and password');
      return;
    }

    try {
      submitLoginBtn.disabled = true;
      submitLoginBtn.textContent = 'Logging in...';

      await signIn(email, password);
      hideModal('loginModal');
      showInfo('Success', 'Logged in successfully!');
    } catch (error) {
      showError('loginError', error.message || 'Login failed');
    } finally {
      submitLoginBtn.disabled = false;
      submitLoginBtn.textContent = 'Login';
    }
  });

  // Submit signup
  submitSignupBtn.addEventListener('click', async () => {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

    if (!email || !password || !passwordConfirm) {
      showError('signupError', 'Please fill in all fields');
      return;
    }

    if (password !== passwordConfirm) {
      showError('signupError', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('signupError', 'Password must be at least 6 characters');
      return;
    }

    try {
      submitSignupBtn.disabled = true;
      submitSignupBtn.textContent = 'Creating account...';

      await signUp(email, password);
      hideModal('signupModal');
      showInfo('Success', 'Account created successfully! Your data is being synced to the cloud.');
    } catch (error) {
      showError('signupError', error.message || 'Sign up failed');
    } finally {
      submitSignupBtn.disabled = false;
      submitSignupBtn.textContent = 'Sign Up';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to log out?')) {
      try {
        await signOut();
        showInfo('Logged Out', 'You have been logged out successfully');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  });

  // Enter key support for forms
  document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitLoginBtn.click();
  });

  document.getElementById('signupPasswordConfirm').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitSignupBtn.click();
  });

  // Close modals when clicking outside
  document.getElementById('loginModal').addEventListener('click', (e) => {
    if (e.target.id === 'loginModal') {
      hideModal('loginModal');
    }
  });

  document.getElementById('signupModal').addEventListener('click', (e) => {
    if (e.target.id === 'signupModal') {
      hideModal('signupModal');
    }
  });
}

/**
 * Initialize authentication state listener
 */
function initializeAuthState() {
  onAuthChange(async (user) => {
    if (user) {
      // User is logged in
      console.log('User authenticated:', user.email);
      updateAuthUI(user);

      // Initialize sync
      initializeSync(
        (cards) => {
          // Callback when cards are updated from Firestore
          console.log('Cards updated from Firestore:', cards.length);
          if (window.updateCardsFromFirebase) {
            window.updateCardsFromFirebase(cards);
          }
        },
        (bibCards) => {
          // Callback when bib cards are updated from Firestore
          console.log('Bibliography cards updated from Firestore:', bibCards.length);
          if (window.updateBibCardsFromFirebase) {
            window.updateBibCardsFromFirebase(bibCards);
          }
        }
      );

      // Migrate local data to Firebase if this is first login
      if (!migrationCompleted) {
        await migrateLocalData();
        migrationCompleted = true;
      }

      // Expose sync function globally so script.js can use it
      window.syncToFirebase = syncCardToFirebase;
      window.syncAllToFirebase = syncAllCardsToFirebase;
      window.deleteFromFirebase = deleteCardFromFirebase;

    } else {
      // User is logged out
      console.log('User logged out');
      updateAuthUI(null);
      stopSync();
      migrationCompleted = false;

      // Remove sync functions
      window.syncToFirebase = null;
      window.syncAllToFirebase = null;
      window.deleteFromFirebase = null;
    }
  });
}

/**
 * Update the authentication UI based on user state
 */
function updateAuthUI(user) {
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const userSection = document.getElementById('userSection');
  const userEmail = document.getElementById('userEmail');

  if (user) {
    // Show user section, hide login/signup buttons
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    userSection.style.display = 'flex';
    userEmail.textContent = user.email;

    // Refresh feather icons
    setTimeout(() => feather.replace(), 100);
  } else {
    // Show login/signup buttons, hide user section
    loginBtn.style.display = 'inline-block';
    signupBtn.style.display = 'inline-block';
    userSection.style.display = 'none';
  }
}

/**
 * Migrate local localStorage data to Firebase
 */
async function migrateLocalData() {
  try {
    // Get data from localStorage
    const localCardsData = localStorage.getItem('notesData');
    const localBibCardsData = localStorage.getItem('bibCardsData');

    let localCards = [];
    let localBibCards = [];

    if (localCardsData) {
      try {
        localCards = JSON.parse(localCardsData);
      } catch (e) {
        console.error('Error parsing local cards data:', e);
      }
    }

    if (localBibCardsData) {
      try {
        localBibCards = JSON.parse(localBibCardsData);
      } catch (e) {
        console.error('Error parsing local bib cards data:', e);
      }
    }

    if (localCards.length > 0 || localBibCards.length > 0) {
      console.log(`Found ${localCards.length} cards and ${localBibCards.length} bibliography cards in localStorage`);

      const result = await migrateLocalDataToFirebase(localCards, localBibCards);

      if (result.migrated > 0) {
        showInfo('Data Migrated', `Successfully migrated ${result.migrated} items to the cloud. Your notes are now synced!`);
      }
    } else {
      console.log('No local data to migrate');

      // Load existing data from Firebase
      const { cards, bibCards } = await loadCardsFromFirebase();
      if (cards.length > 0 || bibCards.length > 0) {
        console.log(`Loaded ${cards.length} cards and ${bibCards.length} bibliography cards from Firebase`);
      }
    }
  } catch (error) {
    console.error('Error during migration:', error);
    showInfo('Migration Error', 'There was an error migrating your data. Your local data is safe. Please try again or contact support.');
  }
}

/**
 * Show a modal
 */
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('visible');
  }
}

/**
 * Hide a modal
 */
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('visible');
  }
}

/**
 * Show error message in a form
 */
function showError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * Hide error message
 */
function hideError(errorId) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

/**
 * Show info modal (reuse existing info modal from script.js)
 */
function showInfo(title, message) {
  const infoModal = document.getElementById('infoModal');
  const infoTitle = document.getElementById('infoModalTitle');
  const infoMessage = document.getElementById('infoModalMessage');

  if (infoModal && infoTitle && infoMessage) {
    infoTitle.textContent = title;
    infoMessage.textContent = message;
    infoModal.classList.add('visible');
  }
}

// Export for other modules if needed
export { getCurrentUser };
