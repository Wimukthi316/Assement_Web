const FIREBASE_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-credential': 'Invalid email or password. Please try again.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Sign-in was cancelled.',
  'auth/unauthorized-domain':
    'This domain is not authorized for Google Sign-In. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
}

export function getFirebaseErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  return FIREBASE_ERROR_MESSAGES[error.code] || error.message || 'Something went wrong. Please try again.'
}
