let signedInName = '';
export const setSignedInUserName = (name: string) => {
  signedInName = String(name || '').trim();
};
export const signedInUserName = (fallback = '') => signedInName || fallback;
