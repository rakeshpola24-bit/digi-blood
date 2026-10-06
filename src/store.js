import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig } from './firebase-config.js';

export const LIVE = !!firebaseConfig.apiKey;
let db = null, auth = null;
if (LIVE) { const app = initializeApp(firebaseConfig); db = getFirestore(app); auth = getAuth(app); }

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function ago(ts) {
  const d = ts && ts.toDate ? ts.toDate() : null; if (!d) return 'just now';
  const m = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000));
  if (m < 60) return m + ' min ago'; const h = Math.round(m / 60);
  if (h < 24) return h + ' hr' + (h > 1 ? 's' : '') + ' ago'; const dd = Math.round(h / 24);
  return dd + ' day' + (dd > 1 ? 's' : '') + ' ago';
}
const initials = n => (n || '?').split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();

export const mappers = {
  requests: (id, x) => ({ id, name: x.name, bg: x.bg, units: x.units, hospital: x.hospital, area: x.area, urgency: x.urgency, status: x.progress || 'open', contact: x.phone, postedAgo: ago(x.createdAt), note: x.note || '' }),
  donors: (id, x) => ({ id, name: x.name, initials: initials(x.name), bg: x.bg, donations: x.donations || 0, last: x.lastDonation || '-', area: x.area }),
  camps: (id, x) => {
    const d = x.date ? new Date(x.date + 'T00:00:00') : null;
    return { id, title: x.title || 'Blood donation camp', organizer: x.organizer || x.org || '', day: d ? String(d.getDate()) : '', mon: d ? MON[d.getMonth()] : '', venue: x.venue, slots: x.slots || 0, registered: x.registered || 0, status: d && d < new Date(new Date().toDateString()) ? 'past' : 'upcoming', contact: x.contact || '' };
  }
};

// Live list of approved records. Public sees only status == "approved".
export function watch(name, cb) {
  if (!LIVE) return () => {};
  const q = query(collection(db, name), where('status', '==', 'approved'));
  return onSnapshot(q, s => cb(s.docs.map(d => mappers[name](d.id, d.data()))), () => {});
}

// Spam guard: max 5 submissions per hour per browser.
function rateOk() {
  try {
    const k = 'db_sub', now = Date.now();
    const a = JSON.parse(localStorage.getItem(k) || '[]').filter(t => now - t < 3600000);
    if (a.length >= 5) return false; a.push(now); localStorage.setItem(k, JSON.stringify(a)); return true;
  } catch (e) { return true; }
}
export function guard(ev) {
  const el = ev.target.elements;
  if (el.consent && !el.consent.checked) { el.consent.setCustomValidity('Please tick the consent box'); el.consent.reportValidity(); el.consent.setCustomValidity(''); return 'consent'; }
  if (el.website && el.website.value) return 'bot';
  if (!rateOk()) return 'rate';
  return 'ok';
}
// kind: donors | requests | camps. Stored as pending until staff approve.
export async function submitRecord(kind, data) {
  if (!LIVE) return;
  if (kind === 'donors') { // phone is kept in a staff-only collection, never in the public donor record
    const { phone, ...pub } = data;
    const ref = await addDoc(collection(db, 'donors'), { ...pub, status: 'pending', createdAt: serverTimestamp() });
    await setDoc(doc(db, 'donorContacts', ref.id), { phone, createdAt: serverTimestamp() });
    return;
  }
  await addDoc(collection(db, kind), { ...data, status: 'pending', createdAt: serverTimestamp() });
}

// ---- staff / admin ----
export const staff = {
  onUser: cb => LIVE ? onAuthStateChanged(auth, cb) : (cb(null), () => {}),
  login: (e, p) => signInWithEmailAndPassword(auth, e, p),
  logout: () => signOut(auth),
  watchAll: (name, cb) => LIVE ? onSnapshot(query(collection(db, name), orderBy('createdAt', 'desc')), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => cb([])) : () => {},
  phone: async id => { try { const d = await getDoc(doc(db, 'donorContacts', id)); return d.exists() ? d.data().phone : ''; } catch (e) { return ''; } },
  setStatus: (name, id, status) => updateDoc(doc(db, name, id), { status }),
  update: (name, id, patch) => updateDoc(doc(db, name, id), patch),
  remove: (name, id) => deleteDoc(doc(db, name, id)),
  add: (name, data) => addDoc(collection(db, name), { ...data, status: 'approved', createdAt: serverTimestamp() })
};
