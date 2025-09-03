// File: js/auction.js

import { db } from "./app.js";
import { ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";
import { updateTeamsStatus } from "./app.js";

// Elementi DOM
const roleSelectEl   = document.getElementById("roleSelect");
const playerNameEl   = document.getElementById("playerName");
const playerQuotaEl  = document.getElementById("playerQuota");
const historyListEl  = document.getElementById("historyList");
const lastBidderEl   = document.getElementById("lastBidder");

// Strutture dati
let playersByRole = { P: [], D: [], C: [], A: [] };
let currentPlayer = null;

// 1) Carica CSV con Id,R,Nome,Squadra,QuotaIniziale
export async function initAuction() {
  await loadPlayers();
  bindControls();
  updateTeamsStatus();
}

// Funzione per leggere il CSV
async function loadPlayers() {
  const res  = await fetch("data/players.csv");
  const text = await res.text();
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",");
  const idx = {
    Id:            headers.indexOf("Id"),
    R:             headers.indexOf("R"),
    Nome:          headers.indexOf("Nome"),
    Squadra:       headers.indexOf("Squadra"),
    QuotaIniziale: headers.indexOf("QuotaIniziale")
  };
  lines.slice(1).forEach(line => {
    if (!line) return;
    const cols = line.split(",");
    const rec = {
      id:      cols[idx.Id],
      role:    cols[idx.R],
      nome:    cols[idx.Nome],
      squadra: cols[idx.Squadra],
      quota:   Number(cols[idx.QuotaIniziale])
    };
    playersByRole[rec.role].push(rec);
  });
}

// Associa i bottoni alle funzioni
function bindControls() {
  document.getElementById("btnNext").onclick    = pickNextPlayer;
  document.querySelectorAll(".bid-btn").forEach(btn =>
    btn.onclick = () => placeBid(+btn.dataset.incr)
  );
  document.getElementById("btnAssign").onclick   = assignPlayer;
  document.getElementById("btnDiscard").onclick  = discardPlayer;
}

// Estrai un giocatore casuale per ruolo
function pickNextPlayer() {
  const role = roleSelectEl.value;
  const list = playersByRole[role] || [];
  if (!list.length) {
    alert("Nessun giocatore rimasto per questo ruolo");
    return;
  }
  const i = Math.floor(Math.random() * list.length);
  currentPlayer = list.splice(i, 1)[0];
  playerNameEl.textContent  = `${currentPlayer.nome} (${currentPlayer.squadra})`;
  playerQuotaEl.textContent = `Base: ${currentPlayer.quota}`;
  historyListEl.innerHTML   = "";
  lastBidderEl.textContent  = "";
}

// Registra un rilancio in Firebase e aggiorna la storia
function placeBid(incr) {
  if (!currentPlayer) return;
  currentPlayer.quota += incr;
  const bidRef = ref(db, `bids/${currentPlayer.id}`);
  push(bidRef, {
    team:   document.getElementById("teamName").value,
    amount: currentPlayer.quota,
    ts:     Date.now()
  }).then(refreshHistory);
}

// Legge gli ultimi 5 rilanci e mostra storia + ultima offerta
function refreshHistory() {
  const bidRef = ref(db, `bids/${currentPlayer.id}`);
  onValue(bidRef, snap => {
    const arr = Object.values(snap.val() || {})
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5);
    historyListEl.innerHTML = arr
      .map(b => `<li>${b.team}: ${b.amount}</li>`)
      .join("");
    const last = arr[0];
    lastBidderEl.textContent = last
      ? `Ultima offerta: ${last.team} – ${last.amount}`
      : "";
  });
}

// Assegna il giocatore al vincitore e aggiorna budget
function assignPlayer() {
  if (!currentPlayer) return;
  const bidRef = ref(db, `bids/${currentPlayer.id}`);
  onValue(bidRef, snap => {
    const bids = Object.values(snap.val() || {});
    if (!bids.length) {
      alert("Nessuna offerta registrata");
      return;
    }
    const winner = bids.sort((a,b) => b.amount - a.amount)[0];
    // Trova UID del team vincente
    onValue(ref(db, "users"), usersSnap => {
      const users = usersSnap.val() || {};
      const uid = Object.keys(users).find(k =>
        users[k].teamName === winner.team
      );
      if (!uid) {
        alert("Impossibile trovare l'utente vincitore");
        return;
      }
      // Aggiungi al roster e sottrai budget
      push(ref(db, `users/${uid}/roster/${currentPlayer.role}`), {
        id:      currentPlayer.id,
        nome:    currentPlayer.nome,
        squadra: currentPlayer.squadra,
        quota:   winner.amount
      });
      update(ref(db, `users/${uid}`), {
        budget: users[uid].budget - winner.amount
      }).then(() => {
        updateTeamsStatus();
        pickNextPlayer();
      });
    }, { onlyOnce: true });
  }, { onlyOnce: true });
}

// Scarta il giocatore corrente
function discardPlayer() {
  if (!currentPlayer) return;
  push(ref(db, `discarded/${currentPlayer.role}`), currentPlayer.id)
    .then(pickNextPlayer);
}

