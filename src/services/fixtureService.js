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

const fixturesCollection = collection(db, "fixtures");

export function subscribeToTournamentFixtures(userId, tournamentId, callback) {
  const fixturesQuery = query(
    fixturesCollection,
    where("userId", "==", userId),
    where("tournamentId", "==", tournamentId)
  );

  return onSnapshot(fixturesQuery, (snapshot) => {
    const fixtures = snapshot.docs
      .map((item) => item.data())
      .sort((a, b) => (a.round || 0) - (b.round || 0));

    callback(fixtures);
  });
}

export function saveFixture(userId, tournamentId, fixture) {
  return setDoc(
    doc(db, "fixtures", fixture.id),
    {
      ...fixture,
      userId,
      tournamentId,
      createdAt: fixture.createdAt ?? Date.now()
    },
    { merge: true }
  );
}

export function deleteFixture(userId, fixtureId) {
  return deleteDoc(doc(db, "fixtures", fixtureId));
}
