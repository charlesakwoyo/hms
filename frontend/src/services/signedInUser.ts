let signedIn = { name: '', role: '' };

export function setSignedInUser(user: { name: string; role: string } | null) {
  signedIn = user ? { name: user.name, role: user.role } : { name: '', role: '' };
}

export function signedInName(): string {
  return signedIn.name;
}

export function signedInLabel(): string {
  return signedIn.name ? (signedIn.role ? `${signedIn.name} (${signedIn.role})` : signedIn.name) : '';
}
