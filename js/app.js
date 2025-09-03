import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getDatabase, ref, set, remove } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "TUO_API_KEY",
  authDomain: "TUO_AUTH_DOMAIN",
  databaseURL: "TUO_DATABASE_URL",
  projectId: "TUO_PROJECT_ID",
  storageBucket: "TUO_STORAGE_BUCKET",
  messagingSenderId: "TUO_SENDER_ID",
  appId: "TUO_APP_ID"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export function showSection(name) {
  document.getElementById("login").classList.toggle("hidden", name!=="login");
  document.getElementById("auction").classList.toggle("hidden", name!=="auction");
  document.getElementById("dashboard").classList.toggle("hidden", name!=="dashboard");
  document.getElementById("admin").classList.toggle("hidden", name!=="admin");
}

document.getElementById("btnReset").onclick = () => {
  if (confirm("Confermi reset asta?")) {
    remove(ref(db, 'auction'));
    remove(ref(db, 'bids'));
    remove(ref(db, 'users'));
    remove(ref(db, 'chat'));
    showSection("login");
  }
};

showSection("login");
