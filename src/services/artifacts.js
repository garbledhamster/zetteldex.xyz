import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { getCurrentUser } from './auth.js';

const ARTIFACTS_COLLECTION = 'artifacts';

/**
 * Generate a ULID-like ID (26 characters)
 * Format: Timestamp (10 chars) + Random (16 chars)
 */
function generateId() {
  const timestamp = Date.now().toString(36).toUpperCase().padStart(10, '0');
  const randomPart = Array.from({ length: 16 }, () =>
    '0123456789ABCDEFGHJKMNPQRSTVWXYZ'[Math.floor(Math.random() * 32)]
  ).join('');
  return timestamp + randomPart;
}

/**
 * Create an artifact object from a note card
 * @param {Object} card - The note card object
 * @param {string} userId - The user ID
 * @returns {Object} Artifact object
 */
export function createNoteArtifact(card, userId) {
  const now = new Date().toISOString();
  const isNewArtifact = !card.artifactId;

  const artifact = {
    id: card.artifactId || generateId(),
    type: 'note',
    title: card.name || 'Untitled Note',

    owner: userId,

    acl: {
      owners: [userId],
      editors: [],
      viewers: []
    },

    visibility: 'private',

    primaryProjectId: null,
    projectIds: [],

    tags: card.keywords ? card.keywords.split(',').map(k => k.trim()).filter(k => k) : [],

    schemaVersion: 1,

    createdAt: card.createdAt || now,
    updatedAt: now,

    refs: {
      assets: [],
      sources: [],
      links: card.connections ? card.connections.split(',').map(c => c.trim()).filter(c => c) : []
    },

    data: {
      core: {
        text: card.front || '',
        context: {
          source: '',
          location: '',
          url: ''
        },
        assetIds: [],
        meta: {
          noteId: card.index || '',
          backContent: card.back || ''
        }
      },

      notes: {
        cardStyle: 'note',
        links: card.connections ? card.connections.split(',').map(c => ({
          rel: 'related',
          targetId: c.trim(),
          label: ''
        })).filter(l => l.targetId) : [],
        prompts: []
      }
    },

    extraAttributes: {
      extraAttribute1: null,
      extraAttribute2: null,
      extraAttribute3: null,
      extraAttribute4: null,
      extraAttribute5: null
    }
  };

  // Only set status for new artifacts to avoid overwriting 'trashed' status
  if (isNewArtifact) {
    artifact.status = 'active';
  }

  return artifact;
}

/**
 * Create an artifact object from a bibliography card
 * @param {Object} bibCard - The bibliography card object
 * @param {string} userId - The user ID
 * @returns {Object} Artifact object
 */
export function createBibliographyArtifact(bibCard, userId) {
  const now = new Date().toISOString();
  const isNewArtifact = !bibCard.artifactId;

  const artifact = {
    id: bibCard.artifactId || generateId(),
    type: 'book',
    title: bibCard.title || 'Untitled Book',

    owner: userId,

    acl: {
      owners: [userId],
      editors: [],
      viewers: []
    },

    visibility: 'private',

    primaryProjectId: null,
    projectIds: [],

    tags: ['bibliography'],

    schemaVersion: 1,

    createdAt: bibCard.createdAt || now,
    updatedAt: now,

    refs: {
      assets: [],
      sources: [],
      links: []
    },

    data: {
      core: {
        text: bibCard.summary || '',
        context: {
          source: bibCard.author || '',
          location: '',
          url: ''
        },
        assetIds: [],
        meta: {
          author: bibCard.author || '',
          subtitle: bibCard.subtitle || '',
          year: bibCard.year || '',
          goal: bibCard.goal || ''
        }
      },

      bibliography: {
        author: bibCard.author || '',
        subtitle: bibCard.subtitle || '',
        year: bibCard.year || '',
        summary: bibCard.summary || '',
        goal: bibCard.goal || ''
      }
    },

    extraAttributes: {
      extraAttribute1: null,
      extraAttribute2: null,
      extraAttribute3: null,
      extraAttribute4: null,
      extraAttribute5: null
    }
  };

  // Only set status for new artifacts to avoid overwriting 'trashed' status
  if (isNewArtifact) {
    artifact.status = 'active';
  }

  return artifact;
}

/**
 * Convert an artifact back to a note card
 * @param {Object} artifact
 * @returns {Object} Card object
 */
export function artifactToCard(artifact) {
  if (artifact.type === 'note') {
    return {
      artifactId: artifact.id,
      index: artifact.data?.core?.meta?.noteId || artifact.data?.core?.meta?.zettelId || '',
      name: artifact.title,
      front: artifact.data?.core?.text || '',
      back: artifact.data?.core?.meta?.backContent || '',
      keywords: artifact.tags?.join(', ') || '',
      connections: artifact.refs?.links?.join(', ') || '',
      createdAt: artifact.createdAt,
      updatedAt: artifact.updatedAt
    };
  } else if (artifact.type === 'book') {
    return {
      artifactId: artifact.id,
      author: artifact.data?.bibliography?.author || '',
      title: artifact.title,
      subtitle: artifact.data?.bibliography?.subtitle || '',
      year: artifact.data?.bibliography?.year || '',
      summary: artifact.data?.bibliography?.summary || '',
      goal: artifact.data?.bibliography?.goal || '',
      createdAt: artifact.createdAt,
      updatedAt: artifact.updatedAt
    };
  }
  return null;
}

/**
 * Save a note artifact to Firestore
 * @param {Object} artifact
 */
export async function saveArtifact(artifact) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated to save artifacts');
  }

  try {
    const artifactRef = doc(db, ARTIFACTS_COLLECTION, artifact.id);
    await setDoc(artifactRef, {
      ...artifact,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true, id: artifact.id };
  } catch (error) {
    console.error('Error saving artifact:', error);
    throw error;
  }
}

/**
 * Get a single artifact by ID
 * @param {string} artifactId
 */
export async function getArtifact(artifactId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }

  try {
    const artifactRef = doc(db, ARTIFACTS_COLLECTION, artifactId);
    const artifactSnap = await getDoc(artifactRef);

    if (artifactSnap.exists()) {
      return artifactSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting artifact:', error);
    throw error;
  }
}

/**
 * Get all artifacts for the current user
 * @param {string} type - Optional type filter ('note', 'book', etc.)
 */
export async function getUserArtifacts(type = null) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }

  try {
    let q;
    if (type) {
      q = query(
        collection(db, ARTIFACTS_COLLECTION),
        where('owner', '==', user.uid),
        where('type', '==', type),
        where('status', '==', 'active')
      );
    } else {
      q = query(
        collection(db, ARTIFACTS_COLLECTION),
        where('owner', '==', user.uid),
        where('status', '==', 'active')
      );
    }

    const querySnapshot = await getDocs(q);
    const artifacts = [];
    querySnapshot.forEach((doc) => {
      artifacts.push(doc.data());
    });

    return artifacts;
  } catch (error) {
    console.error('Error getting user artifacts:', error);
    throw error;
  }
}

/**
 * Delete an artifact (soft delete by setting status to 'trashed')
 * @param {string} artifactId
 */
export async function deleteArtifact(artifactId) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }

  try {
    const artifactRef = doc(db, ARTIFACTS_COLLECTION, artifactId);
    await setDoc(artifactRef, {
      status: 'trashed',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error deleting artifact:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time updates for user's artifacts
 * @param {Function} callback - Callback function that receives the artifacts array
 * @param {string} type - Optional type filter
 * @returns {Function} Unsubscribe function
 */
export function subscribeToArtifacts(callback, type = null) {
  const user = getCurrentUser();
  if (!user) {
    throw new Error('User must be authenticated');
  }

  let q;
  if (type) {
    q = query(
      collection(db, ARTIFACTS_COLLECTION),
      where('owner', '==', user.uid),
      where('type', '==', type),
      where('status', '==', 'active')
    );
  } else {
    q = query(
      collection(db, ARTIFACTS_COLLECTION),
      where('owner', '==', user.uid),
      where('status', '==', 'active')
    );
  }

  return onSnapshot(q, (querySnapshot) => {
    const artifacts = [];
    querySnapshot.forEach((doc) => {
      artifacts.push(doc.data());
    });
    callback(artifacts);
  }, (error) => {
    console.error('Error in artifacts subscription:', error);
  });
}
