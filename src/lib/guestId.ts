const STORAGE_KEY = 'medstudent_guest_id';

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest_anon';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = 'guest_' + crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
