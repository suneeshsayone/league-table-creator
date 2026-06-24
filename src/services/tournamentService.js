import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const tournamentsCollection = collection(db, "tournaments");
const syncedCollectionNames = ["teams", "fixtures", "standings", "topScorers"];

export function subscribeToUserTournaments(userId, callback) {
  const tournamentsQuery = query(
    tournamentsCollection,
    where("userId", "==", userId)
  );

  return onSnapshot(tournamentsQuery, (snapshot) => {
    const tournaments = snapshot.docs
      .map((item) => item.data())
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime;
      });

    callback(tournaments);
  }, (error) => {
    console.error("Could not subscribe to tournaments:", error);
    callback([], error);
  });
}

export async function saveTournament(userId, tournament) {
  const tournamentRef = doc(db, "tournaments", tournament.id);
  const existingCreatedAt = tournament.createdAt?.toMillis ? tournament.createdAt : null;

  await setDoc(
    tournamentRef,
    {
      ...tournament,
      userId,
      createdAt: existingCreatedAt ?? serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function syncTournamentCollections(userId, tournament, standings = []) {
  const batch = writeBatch(db);

  for (const collectionName of syncedCollectionNames) {
    const existingQuery = query(
      collection(db, collectionName),
      where("userId", "==", userId),
      where("tournamentId", "==", tournament.id)
    );
    const existingSnapshot = await getDocs(existingQuery);
    existingSnapshot.docs.forEach((item) => batch.delete(item.ref));
  }

  tournament.teams.forEach((team) => {
    batch.set(doc(db, "teams", team.id), {
      ...team,
      userId,
      tournamentId: tournament.id,
      createdAt: tournament.createdAt ?? Date.now()
    });
  });

  tournament.matches.forEach((fixture) => {
    batch.set(doc(db, "fixtures", fixture.id), {
      ...fixture,
      userId,
      tournamentId: tournament.id,
      createdAt: tournament.createdAt ?? Date.now()
    });
  });

  standings.forEach((standing) => {
    batch.set(doc(db, "standings", `${tournament.id}-${standing.team.id}`), {
      ...standing,
      teamId: standing.team.id,
      teamName: standing.team.name,
      M: standing.played,
      W: standing.won,
      L: standing.lost,
      GD: standing.goalDifference,
      Pts: standing.points,
      userId,
      tournamentId: tournament.id,
      createdAt: tournament.createdAt ?? Date.now(),
      updatedAt: Date.now()
    });
  });

  tournament.scorers.forEach((scorer) => {
    batch.set(doc(db, "topScorers", scorer.id), {
      ...scorer,
      userId,
      tournamentId: tournament.id,
      createdAt: tournament.createdAt ?? Date.now()
    });
  });

  await batch.commit();
}

export async function deleteTournament(userId, tournamentId) {
  const batch = writeBatch(db);

  batch.delete(doc(db, "tournaments", tournamentId));

  for (const collectionName of syncedCollectionNames) {
    const existingQuery = query(
      collection(db, collectionName),
      where("userId", "==", userId),
      where("tournamentId", "==", tournamentId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    existingSnapshot.docs.forEach((item) => batch.delete(item.ref));
  }

  await batch.commit();
}
