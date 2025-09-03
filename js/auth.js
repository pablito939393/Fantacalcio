onAuthStateChanged(auth, user => {
  if (user) {
    const nick = document.getElementById("nickname").value.trim();
    const team = document.getElementById("teamName").value.trim();
    set(ref(db, `users/${user.uid}`), {
      nickname: nick,
      teamName: team,
      budget: 1500,
      roster: { P: [], D: [], C: [], A: [] }
    }).then(() => {
      showSection("auction");
      // NUOVA RIGA: ricarica tabella squadre
      updateTeamsStatus();
    });
  }
});
