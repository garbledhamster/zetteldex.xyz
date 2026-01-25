# Firebase Setup Instructions

This document explains how to set up Firebase for the Zettel Dex application.

## Prerequisites

1. Firebase account (https://firebase.google.com/)
2. Firebase CLI installed (`npm install -g firebase-tools`)

## Setup Steps

### 1. Firebase Project Setup

The application is already configured to use the following Firebase project:
- Project ID: `ourstuff-firebase`
- Auth Domain: `ourstuff-firebase.firebaseapp.com`

### 2. Enable Authentication

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `ourstuff-firebase`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Email/Password** authentication
5. Click on **Email/Password** and toggle it to **Enabled**
6. Save changes

### 3. Create Firestore Database

1. In Firebase Console, navigate to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we have security rules)
4. Select your preferred region (e.g., `us-central1`)
5. Click **Enable**

### 4. Deploy Firestore Security Rules

The security rules are defined in `firestore.rules`. To deploy them:

```bash
# Login to Firebase CLI
firebase login

# Initialize Firebase in this project (if not already done)
firebase init firestore

# When prompted, select:
# - Use an existing project: ourstuff-firebase
# - Firestore Rules: firestore.rules
# - Firestore Indexes: firestore.indexes.json (create empty file if needed)

# Deploy the rules
firebase deploy --only firestore:rules
```

### 5. Verify reCAPTCHA v3

The application is configured with reCAPTCHA v3 site key: `6LdVslAsAAAAAAwyU1wyjAxIG_K187E82ID2C7Re`

Verify this is set up in your Google Cloud Console:
1. Go to https://www.google.com/recaptcha/admin
2. Ensure the site key is registered for your domain

## Security Rules Explanation

The Firestore security rules ensure:

- **Authentication Required**: All operations require user authentication
- **Owner Access**: Users can only access their own artifacts (notes/books)
- **ACL Support**: Access Control Lists (ACL) support for sharing (owners, editors, viewers)
- **Visibility Control**: Artifacts can be private, unlisted, or public
- **Data Integrity**: Owner field cannot be changed after creation

## Testing

1. Build the application: `npm run build`
2. Run locally: `npm run dev`
3. Open browser and test:
   - Sign up with a new account
   - Create some notes
   - Verify they appear in Firestore Console
   - Log out and log back in
   - Verify notes are synced

## Firestore Collection Structure

The application uses a single collection:

### `artifacts` Collection

Each document in the `artifacts` collection represents a note or bibliography entry:

```json
{
  "id": "<unique-id>",
  "type": "note" | "book",
  "title": "Note title",
  "owner": "<user-uid>",
  "acl": {
    "owners": ["<uid>"],
    "editors": [],
    "viewers": []
  },
  "visibility": "private" | "unlisted" | "public",
  "status": "active" | "archived" | "trashed",
  "data": {
    "core": { ... },
    "notes": { ... }
  },
  "createdAt": "2026-01-25T...",
  "updatedAt": "2026-01-25T..."
}
```

## Troubleshooting

### Issue: "Permission denied" errors in Firestore

**Solution**: Ensure security rules are deployed correctly:
```bash
firebase deploy --only firestore:rules
```

### Issue: Authentication not working

**Solution**:
1. Check that Email/Password auth is enabled in Firebase Console
2. Verify the Firebase config in `src/firebase/config.js` matches your project

### Issue: reCAPTCHA errors

**Solution**:
1. Verify the reCAPTCHA site key is correct
2. Ensure your domain is registered with the reCAPTCHA key
3. Check browser console for specific error messages

## Support

For Firebase-specific issues, refer to:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
