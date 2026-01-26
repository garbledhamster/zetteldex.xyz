import {
  saveArtifact,
  getUserArtifacts,
  subscribeToArtifacts,
  createNoteArtifact,
  createBibliographyArtifact,
  artifactToCard,
  deleteArtifact
} from './artifacts.js';
import { getCurrentUser } from './auth.js';

let syncEnabled = false;
let unsubscribeArtifacts = null;
let syncCallbacks = {
  onCardsUpdate: null,
  onBibCardsUpdate: null
};

/**
 * Initialize sync service and set up real-time listeners
 * @param {Function} onCardsUpdate - Callback when cards are updated
 * @param {Function} onBibCardsUpdate - Callback when bibliography cards are updated
 */
export function initializeSync(onCardsUpdate, onBibCardsUpdate) {
  syncCallbacks.onCardsUpdate = onCardsUpdate;
  syncCallbacks.onBibCardsUpdate = onBibCardsUpdate;

  const user = getCurrentUser();
  if (!user) {
    console.log('No user authenticated, sync disabled');
    return;
  }

  syncEnabled = true;
  console.log('Sync initialized for user:', user.uid);

  // Subscribe to real-time updates
  setupRealtimeListeners();
}

/**
 * Set up real-time Firestore listeners
 */
function setupRealtimeListeners() {
  const user = getCurrentUser();
  if (!user) return;

  // Unsubscribe from previous listeners
  if (unsubscribeArtifacts) {
    unsubscribeArtifacts();
  }

  // Subscribe to all artifacts for the user
  unsubscribeArtifacts = subscribeToArtifacts((artifacts) => {
    console.log(`Received ${artifacts.length} artifacts from Firestore`);

    // Separate notes and bibliography
    const noteArtifacts = artifacts.filter(a => a.type === 'note');
    const bibArtifacts = artifacts.filter(a => a.type === 'book');

    // Convert to card format
    const cards = noteArtifacts.map(artifactToCard).filter(c => c);
    const bibCards = bibArtifacts.map(artifactToCard).filter(c => c);

    // Sort cards by index
    cards.sort((a, b) => {
      const indexA = a.index || '';
      const indexB = b.index || '';
      return indexA.localeCompare(indexB);
    });

    // Trigger callbacks
    if (syncCallbacks.onCardsUpdate) {
      syncCallbacks.onCardsUpdate(cards);
    }
    if (syncCallbacks.onBibCardsUpdate) {
      syncCallbacks.onBibCardsUpdate(bibCards);
    }
  });
}

/**
 * Stop sync and clean up listeners
 */
export function stopSync() {
  if (unsubscribeArtifacts) {
    unsubscribeArtifacts();
    unsubscribeArtifacts = null;
  }
  syncEnabled = false;
  console.log('Sync stopped');
}

/**
 * Migrate localStorage data to Firebase
 * This is called once when a user first logs in
 */
export async function migrateLocalDataToFirebase(localCards, localBibCards) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to migrate data');
  }

  console.log(`Migrating ${localCards.length} cards and ${localBibCards.length} bibliography cards to Firebase...`);

  try {
    // Get existing artifacts from Firebase to avoid duplicates
    const existingArtifacts = await getUserArtifacts();
    const existingIds = new Set(existingArtifacts.map(a => a.data?.core?.meta?.noteId || a.data?.core?.meta?.zettelId || a.id));

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate note cards
    for (const card of localCards) {
      // Skip if already exists in Firebase (by note index)
      if (card.index && existingIds.has(card.index)) {
        console.log(`Skipping card ${card.index} - already exists in Firebase`);
        skippedCount++;
        continue;
      }

      const artifact = createNoteArtifact(card, user.uid);
      await saveArtifact(artifact);
      migratedCount++;
    }

    // Migrate bibliography cards
    for (const bibCard of localBibCards) {
      const artifact = createBibliographyArtifact(bibCard, user.uid);
      await saveArtifact(artifact);
      migratedCount++;
    }

    console.log(`Migration complete: ${migratedCount} items migrated, ${skippedCount} skipped`);
    return {
      success: true,
      migrated: migratedCount,
      skipped: skippedCount
    };
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

/**
 * Save a single card to Firebase
 * @param {Object} card
 * @param {string} type - 'note' or 'bibliography'
 */
export async function syncCardToFirebase(card, type = 'note') {
  if (!syncEnabled) {
    console.log('Sync disabled, skipping save');
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    console.log('No user authenticated, skipping save');
    return;
  }

  try {
    let artifact;
    if (type === 'note') {
      artifact = createNoteArtifact(card, user.uid);
    } else {
      artifact = createBibliographyArtifact(card, user.uid);
    }

    await saveArtifact(artifact);
    console.log(`Card synced to Firebase: ${artifact.id}`);
    return { success: true, id: artifact.id };
  } catch (error) {
    console.error('Error syncing card to Firebase:', error);
    throw error;
  }
}

/**
 * Sync all local cards to Firebase
 * @param {Array} cards
 * @param {Array} bibCards
 */
export async function syncAllCardsToFirebase(cards, bibCards) {
  if (!syncEnabled) {
    console.log('Sync disabled, skipping sync all');
    return;
  }

  const user = getCurrentUser();
  if (!user) {
    console.log('No user authenticated, skipping sync all');
    return;
  }

  console.log(`Syncing ${cards.length} cards and ${bibCards.length} bibliography cards...`);

  try {
    // Sync all note cards
    for (const card of cards) {
      const artifact = createNoteArtifact(card, user.uid);
      await saveArtifact(artifact);
    }

    // Sync all bibliography cards
    for (const bibCard of bibCards) {
      const artifact = createBibliographyArtifact(bibCard, user.uid);
      await saveArtifact(artifact);
    }

    console.log('All cards synced to Firebase');
    return { success: true };
  } catch (error) {
    console.error('Error syncing all cards:', error);
    throw error;
  }
}

/**
 * Load all cards from Firebase
 * @returns {Object} { cards, bibCards }
 */
export async function loadCardsFromFirebase() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to load cards');
  }

  try {
    const artifacts = await getUserArtifacts();

    const noteArtifacts = artifacts.filter(a => a.type === 'note');
    const bibArtifacts = artifacts.filter(a => a.type === 'book');

    const cards = noteArtifacts.map(artifactToCard).filter(c => c);
    const bibCards = bibArtifacts.map(artifactToCard).filter(c => c);

    // Sort cards by index
    cards.sort((a, b) => {
      const indexA = a.index || '';
      const indexB = b.index || '';
      return indexA.localeCompare(indexB);
    });

    console.log(`Loaded ${cards.length} cards and ${bibCards.length} bibliography cards from Firebase`);

    return { cards, bibCards };
  } catch (error) {
    console.error('Error loading cards from Firebase:', error);
    throw error;
  }
}

/**
 * Check if sync is enabled
 */
export function isSyncEnabled() {
  return syncEnabled;
}

/**
 * Delete a card from Firebase
 * @param {Object} card - The card object with artifactId
 * @param {string} type - Type of card: 'note' or 'bibliography'
 * @returns {Promise<Object>} Result of deletion
 */
export async function deleteCardFromFirebase(card, type = 'note') {
  const user = getCurrentUser();
  if (!user) {
    console.warn('User not authenticated, skipping Firebase deletion');
    return { success: false, reason: 'not_authenticated' };
  }

  if (!card) {
    console.warn('No card provided, cannot delete from Firebase');
    return { success: false, reason: 'no_card' };
  }

  try {
    let artifactIdToDelete = card.artifactId;

    // If card doesn't have artifactId, search for it in Firebase
    // Note: This is a fallback for the rare case where a user deletes a card
    // immediately after creation, before the real-time sync has completed.
    // We fetch all active artifacts of the given type to find a match.
    // This is acceptable since: 1) it's a rare case, 2) most users won't have
    // thousands of notes, 3) Firestore doesn't easily support queries on nested
    // fields without indexes.
    if (!artifactIdToDelete) {
      console.log('Card has no artifactId, searching Firebase for matching artifact...');
      const artifacts = await getUserArtifacts(type);
      
      // Find the artifact by matching the card's unique identifier
      let matchingArtifact;
      if (type === 'note') {
        // Match by index for note cards
        // Check both noteId (current) and zettelId (legacy) for backward compatibility
        matchingArtifact = artifacts.find(a => 
          a.data?.core?.meta?.noteId === card.index || 
          a.data?.core?.meta?.zettelId === card.index
        );
      } else {
        // Match by author and title for bibliography cards
        matchingArtifact = artifacts.find(a =>
          a.data?.bibliography?.author === card.author &&
          a.title === card.title
        );
      }

      if (matchingArtifact) {
        artifactIdToDelete = matchingArtifact.id;
        console.log(`Found matching artifact in Firebase: ${artifactIdToDelete}`);
      } else {
        console.warn('No matching artifact found in Firebase');
        return { success: false, reason: 'not_found_in_firebase' };
      }
    }

    await deleteArtifact(artifactIdToDelete);
    console.log(`Deleted card ${artifactIdToDelete} from Firebase`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting card from Firebase:', error);
    throw error;
  }
}
