import { db } from "./app.js";
import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";

const chatIn = document.getElementById("chatInput");
const chatBox = document.getElementById("chatMessages");

document.getElementById("btnSend").onclick = () => {
  const msg = chatIn.value.trim();
  if (!msg) return;
  push(ref(db, "chat"), {
    team: document.getElementById("teamName").value,
    text: msg,
    ts: Date.now()
  });
  chatIn.value = "";
};

onValue(ref(db, "chat"), snap => {
  const msgs = Object.values(snap.val()||{}).sort((a,b)=>a.ts-b.ts);
  chatBox.innerHTML = msgs.map(m=>`<p><strong>${m.team}:</strong> ${m.text}</p>`).join("");
  chatBox.scrollTop = chatBox.scrollHeight;
});
