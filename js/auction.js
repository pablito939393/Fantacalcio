import { db } from "./app.js";
import { ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";

let playersByRole = {}, currentPlayer = null;

// Carica CSV con colonne Id,R,Nome,Squadra,QuotaIniziale
async function loadPlayers() {
  const res = await fetch("data/players.csv");
  const text = await res.text();
  text.trim().split("\n").slice(1).forEach(line => {
    const [id, role, nome, squadra, quota] = line.split(",");
    playersByRole[role] = playersByRole[role]||[];
    playersByRole[role].push({ id, nome, squadra, quota: +quota });
  });
}

export async function initAuction() {
  await loadPlayers();
  document.getElementById("btnNext").onclick = () => nextPlayer();
  document.querySelectorAll(".bid-btn").forEach(btn => {
    btn.onclick = () => placeBid(+btn.dataset.incr);
  });
  document.getElementById("btnAssign").onclick = assignPlayer;
  document.getElementById("btnDiscard").onclick = discardPlayer;
  updateStatus();
}

function nextPlayer() {
  const role = document.getElementById("roleSelect").value;
  const list = playersByRole[role];
  if (!list || !list.length) return alert("Nessun giocatore rimasto");
  const idx = Math.floor(Math.random()*list.length);
  currentPlayer = list.splice(idx,1)[0];
  document.getElementById("playerName").textContent = `${currentPlayer.nome} (${currentPlayer.squadra})`;
  document.getElementById("playerQuota").textContent = `Base: ${currentPlayer.quota}`;
  document.getElementById("historyList").innerHTML = "";
}

function placeBid(incr) {
  if (!currentPlayer) return;
  const bidRef = ref(db, `bids/${currentPlayer.id}`);
  push(bidRef, {
    team: document.getElementById("teamName").value,
    amount: (currentPlayer.quota += incr),
    timestamp: Date.now()
  });
  showHistory();
}

function showHistory() {
  const hlist = document.getElementById("historyList");
  onValue(ref(db, `bids/${currentPlayer.id}`), snap => {
    const vals = Object.values(snap.val()||{}).sort((a,b)=>b.timestamp-a.timestamp).slice(0,5);
    hlist.innerHTML = vals.map(v=>`<li>${v.team}: ${v.amount}</li>`).join("");
  });
}

function assignPlayer() {
  onValue(ref(db, `bids/${currentPlayer.id}`), snap => {
    const bids = Object.values(snap.val()||{});
    if (!bids.length) return alert("Nessuna offerta");
    const winner = bids.sort((a,b)=>b.amount-a.amount)[0];
    push(ref(db, `users/${winner.team}/roster/${currentPlayer.role}`), {
      id: currentPlayer.id,
      nome: currentPlayer.nome,
      squadra: currentPlayer.squadra,
      quota: winner.amount
    });
    update(ref(db, `users/${winner.team}`), { budget: -winner.amount });
    nextPlayer();
  }, { onlyOnce:true });
}

function discardPlayer() {
  push(ref(db, `discarded/${currentPlayer.role}`), currentPlayer.id);
  nextPlayer();
}

function updateStatus() {
  const statusBody = document.querySelector("#statusTable tbody");
  onValue(ref(db, "users"), snap => {
    statusBody.innerHTML = Object.values(snap.val()||{}).map(u=>
      `<tr><td>${u.teamName}</td><td>${u.budget}</td></tr>`
    ).join("");
  });
}

initAuction();
