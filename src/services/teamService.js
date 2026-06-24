import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const teamsCollection = collection(db, "teams");

export function subscribeToTournamentTeams(userId, tournamentId, callback) {
  const teamsQuery = query(
    teamsCollection,
    where("userId", "==", userId),
    where("tournamentId", "==", tournamentId)
  );

  return onSnapshot(teamsQuery, (snapshot) => {
    const teams = snapshot.docs
      .map((item) => item.data())
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return aTime - bTime;
      });

    callback(teams);
  });
}

export function saveTeam(userId, tournamentId, team) {
  return setDoc(
    doc(db, "teams", team.id),
    {
      ...team,
      userId,
      tournamentId,
      createdAt: team.createdAt ?? Date.now()
    },
    { merge: true }
  );
}

export function deleteTeam(userId, teamId) {
  return deleteDoc(doc(db, "teams", teamId));
}
