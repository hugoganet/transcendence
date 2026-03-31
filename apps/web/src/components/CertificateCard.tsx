import { useEffect, useRef } from "react";
import type { Certificate } from "@transcendence/shared";
import styles from "./CertificateCard.module.css";

interface CertificateCardProps {
  certificate: Certificate;
  userName: string;
  shareUrl: string;
}

export function CertificateCard({
  certificate,
  userName
}: CertificateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    };

    card.addEventListener("mousemove", handleMouseMove);
    return () => card.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={cardRef} className={styles.certificateCard}>
      <div className={styles.certificateContent}>
        <div className={styles.certificateTitle}>Certificate of Completion</div>
        <div className={styles.certificateCurriculum}>
          {certificate.curriculumTitle}
        </div>

        <div className={styles.certificateUser}>
          <div className={styles.certificateUserLabel}>Awarded to</div>
          <div className={styles.certificateUserName}>{userName}</div>
        </div>

        <div className={styles.certificateStats}>
          <div className={styles.certificateStat}>
            <span className={styles.certificateStatValue}>
              {certificate.totalMissions}
            </span>
            <div className={styles.certificateStatLabel}>Missions</div>
          </div>
          <div className={styles.certificateStat}>
            <span className={styles.certificateStatValue}>
              {certificate.totalCategories}
            </span>
            <div className={styles.certificateStatLabel}>Categories</div>
          </div>
        </div>

        <div className={styles.certificateDate}>
          Completed on{" "}
          {new Date(certificate.completionDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}