# Notes - Firebase Integration Guide

This document explains the Firebase authentication and database integration added to Notes.

## What's New

### Features Added

1. **Firebase Authentication**
   - Email/password authentication with reCAPTCHA v3
   - Login and sign-up functionality
   - Persistent authentication (survives browser restarts)
   - User profile display in header

2. **Cloud Database Storage**
   - All notes saved to Firestore as "artifacts"
   - Real-time synchronization across devices
   - Automatic migration of local notes to cloud on first login
   - Offline support with localStorage fallback

3. **Data Syncing**
   - Automatic sync when creating or editing notes
   - Real-time updates from Firestore
   - Conflict resolution (server data takes precedence)
   - No data loss - local storage maintained as backup

## Getting Started

### Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```
   This will start Vite dev server at http://localhost:3000

3. **Build for production**:
   ```bash
   npm run build
   ```
   Output will be in the `dist/` folder

### Firebase Setup

Before the app can fully function, you need to set up Firebase:

1. **Enable Authentication**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: `ourstuff-firebase`
   - Enable Email/Password authentication
   - See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions

2. **Set up Firestore**:
   - Create Firestore database in Firebase Console
   - Deploy security rules: `firebase deploy --only firestore:rules`
   - See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions

3. **Verify reCAPTCHA**:
   - reCAPTCHA v3 is configured with site key: `6LdVslAsAAAAAAwyU1wyjAxIG_K187E82ID2C7Re`
   - Ensure your domain is registered with this key

## Architecture

### File Structure

```
notes.ourstuff.space/
├── src/
│   ├── firebase/
│   │   └── config.js           # Firebase initialization
│   ├── services/
│   │   ├── auth.js             # Authentication service
│   │   ├── recaptcha.js        # reCAPTCHA integration
│   │   ├── artifacts.js        # Firestore CRUD operations
│   │   └── sync.js             # Real-time sync logic
│   └── main.js                 # Main entry point (Firebase integration)
├── index.html                  # Updated with auth UI
├── script.js                   # Original app logic (updated for sync)
├── styles.css                  # Updated with auth styles
├── firestore.rules             # Firestore security rules
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies
```

### Data Flow

1. **User Sign Up/Login**:
   - User enters email/password
   - reCAPTCHA v3 validates the request
   - Firebase Authentication creates/signs in user
   - Migration process checks for local data

2. **Data Migration** (First Login):
   - Existing localStorage notes are detected
   - Each note is converted to artifact format
   - Artifacts are uploaded to Firestore
   - User is notified of successful migration

3. **Creating/Editing Notes**:
   - User creates/edits a note
   - Note is saved to localStorage (immediate)
   - Note is converted to artifact format
   - Artifact is saved to Firestore (async)
   - If user is offline, it will sync when online

4. **Real-time Sync**:
   - Firestore listener monitors user's artifacts
   - When data changes in Firestore (from another device)
   - Local data is updated automatically
   - UI refreshes to show latest data

### Artifact Schema

Notes are stored as "artifacts" with the following structure:

```json
{
  "id": "unique-id",
  "type": "note",
  "title": "Note title",
  "owner": "user-uid",
  "acl": {
    "owners": ["user-uid"],
    "editors": [],
    "viewers": []
  },
  "visibility": "private",
  "status": "active",
  "tags": ["keyword1", "keyword2"],
  "data": {
    "core": {
      "text": "Front content",
      "meta": {
        "noteId": "1111.1",
        "backContent": "Back content"
      }
    },
    "notes": {
      "cardStyle": "note",
      "links": [...]
    }
  },
  "createdAt": "2026-01-25T...",
  "updatedAt": "2026-01-25T..."
}
```

## Usage

### First Time Use

1. **No Account**: Use the app normally with localStorage
2. **Create Account**: Click "Sign Up" in the header
3. **Migration**: Your existing notes will be migrated to the cloud
4. **Multi-device**: Log in from another device to access your notes

### Existing User

1. **Login**: Click "Login" in header
2. **Auto-sync**: Your notes will load from the cloud
3. **Work Offline**: Notes are cached locally
4. **Logout**: Click the logout icon in header

## Security

### Authentication
- Passwords are handled securely by Firebase
- reCAPTCHA v3 prevents bot attacks
- Session tokens stored securely in browser

### Data Access
- Users can only access their own notes
- ACL system supports future sharing features
- Firestore security rules enforce access control

### Best Practices
- Never commit Firebase config with secrets to public repos
- Use environment variables for sensitive data in production
- Regularly review Firebase security rules
- Enable Firebase App Check for production

## Troubleshooting

### Common Issues

1. **"Permission denied" in Firestore**:
   - Ensure Firestore security rules are deployed
   - Check that Email/Password auth is enabled
   - Verify user is logged in

2. **Notes not syncing**:
   - Check browser console for errors
   - Verify internet connection
   - Check Firestore Console for data
   - Ensure user is authenticated

3. **Login fails**:
   - Check Firebase Authentication is enabled
   - Verify email/password are correct
   - Check for reCAPTCHA errors in console

4. **Build errors**:
   - Delete `node_modules` and run `npm install` again
   - Clear Vite cache: `rm -rf node_modules/.vite`
   - Check that all imports are correct

### Debug Mode

Open browser console to see detailed logs:
- Authentication events
- Sync operations
- Firestore operations
- reCAPTCHA validation

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### GitHub Pages

The `dist/` folder needs to be deployed to GitHub Pages:

**Option 1**: Use gh-pages
```bash
npm install -D gh-pages
npx gh-pages -d dist
```

**Option 2**: Manual deployment
1. Build: `npm run build`
2. Copy contents of `dist/` to root or gh-pages branch
3. Push to GitHub

**Option 3**: GitHub Actions
Create `.github/workflows/deploy.yml` for automatic deployment

## Next Steps

### Recommended Enhancements

1. **Password Reset**: Add forgot password functionality
2. **Email Verification**: Verify email addresses
3. **Profile Management**: Allow users to update profile
4. **Social Auth**: Add Google/GitHub sign-in
5. **Offline Mode**: Better offline support with service workers
6. **Conflict Resolution**: More sophisticated conflict handling
7. **Data Export**: Export all notes to JSON/markdown
8. **Sharing**: Implement ACL-based note sharing
9. **Search**: Full-text search in Firestore
10. **Attachments**: Cloud storage for images via Firebase Storage

### Performance Optimization

1. **Lazy Loading**: Load artifacts on demand
2. **Pagination**: Paginate large note collections
3. **Caching**: Implement more aggressive caching
4. **Indexes**: Create Firestore indexes for common queries

## Support

For issues or questions:
- Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for setup help
- Review Firebase Console for authentication/database status
- Check browser console for error messages
- Review Firestore security rules in Firebase Console

## License

Same as the main Notes project.
