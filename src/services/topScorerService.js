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

const topScorersCollection = collection(db, "topScorers");

export function subscribeToTournamentTopScorers(userId, tournamentId, callback) {
  const topScorersQuery = query(
    topScorersCollection,
    where("userId", "==", userId),
    where("tournamentId", "==", tournamentId)
  );

  return onSnapshot(topScorersQuery, (snapshot) => {
    const scorers = snapshot.docs
      .map((item) => item.data())
      .sort((a, b) => (b.goals || 0) - (a.goals || 0));

    callback(scorers);
  });
}

export function saveTopScorer(userId, tournamentId, scorer) {
  return setDoc(
    doc(db, "topScorers", scorer.id),
    {
      ...scorer,
      userId,
      tournamentId,
      createdAt: scorer.createdAt ?? Date.now()
    },
    { merge: true }
  );
}

export function deleteTopScorer(userId, scorerId) {
  return deleteDoc(doc(db, "topScorers", scorerId));
}
