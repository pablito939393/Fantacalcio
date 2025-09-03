import { db } from "./app.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-database.js";

document.getElementById("btnExport").onclick = () => {
  onValue(ref(db, "users"), snap => {
    const rows = [["Squadra","IdGiocatore","Crediti"]];
    Object.values(snap.val()||{}).forEach(u => {
      ["P","D","C","A"].forEach(role => {
        (u.roster[role]||[]).forEach(id => {
          rows.push([u.teamName, id, 0]); // se vuoi anche crediti pagati, salvali in DB e sostituisci 0
        });
      });
    });
    downloadCSV(rows, "export_rosters.csv");
  }, { onlyOnce:true });
};

function downloadCSV(rows, filename) {
  const csv = rows.map(r=>r.join(",")).join("\\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
