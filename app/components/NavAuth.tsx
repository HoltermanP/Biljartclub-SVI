'use client';

import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';

export default function NavAuth() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />;
  }

  return (
    <SignInButton mode="modal">
      <button
        type="button"
        className="min-h-[44px] min-w-[44px] px-4"
        style={{ backgroundColor: '#c9a84c', color: '#0d2b1e', fontWeight: 700, padding: '0.35rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
        Inloggen
      </button>
    </SignInButton>
  );
}
