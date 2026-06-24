import Link from "next/link";
import styles from "./page.module.css";

export default function NotFound() {
  return (
    <main className="app-wrapper">
      <section className={styles.centerStage}>
        <div className={styles.emptyState}>
          <span>League not found</span>
          <Link className={styles.primaryButton} href="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
