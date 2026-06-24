import {
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const standingsCollection = collection(db, "standings");

export function subscribeToTournamentStandings(userId, tournamentId, callback) {
  const standingsQuery = query(
    standingsCollection,
    where("userId", "==", userId),
    where("tournamentId", "==", tournamentId)
  );

  return onSnapshot(standingsQuery, (snapshot) => {
    const standings = snapshot.docs
      .map((item) => item.data())
      .sort((a, b) => {
        const bPoints = b.Pts ?? b.points ?? 0;
        const aPoints = a.Pts ?? a.points ?? 0;
        const bGoalDifference = b.GD ?? b.goalDifference ?? 0;
        const aGoalDifference = a.GD ?? a.goalDifference ?? 0;
        const bWins = b.W ?? b.won ?? 0;
        const aWins = a.W ?? a.won ?? 0;

        if (bPoints !== aPoints) return bPoints - aPoints;
        if (bGoalDifference !== aGoalDifference) return bGoalDifference - aGoalDifference;
        if (bWins !== aWins) return bWins - aWins;
        return (a.teamName || a.team?.name || "").localeCompare(b.teamName || b.team?.name || "");
      });

    callback(standings);
  });
}

export function saveStanding(userId, tournamentId, standing) {
  return setDoc(
    doc(db, "standings", `${tournamentId}-${standing.team.id}`),
    {
      ...standing,
      teamId: standing.team.id,
      teamName: standing.team.name,
      M: standing.played,
      W: standing.won,
      L: standing.lost,
      GD: standing.goalDifference,
      Pts: standing.points,
      userId,
      tournamentId,
      updatedAt: Date.now(),
      createdAt: standing.createdAt ?? Date.now()
    }
  );
}
