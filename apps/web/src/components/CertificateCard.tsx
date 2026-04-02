import { useEffect, useRef, useState } from "react";
import type { Certificate } from "@transcendence/shared";

interface CertificateCardProps {
  certificate: Certificate;
  userName: string;
  shareUrl: string;
}

export function CertificateCard({ certificate, userName }: CertificateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGlow, setShowGlow] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
      setShowGlow(true);
    };

    const handleMouseLeave = () => {
      setShowGlow(false);
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative max-w-md overflow-hidden rounded-2xl bg-linear-to-br from-purple-500 to-purple-800 p-8 shadow-[0_20px_60px_rgba(102,126,234,0.3)] transition-all duration-300 hover:shadow-[0_30px_80px_rgba(102,126,234,0.5)] hover:scale-105 hover:-translate-y-2"
    >
      {/* Glow effect on mouse move */}
      {showGlow && (
        <div
          className="pointer-events-none absolute h-24 w-24 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)",
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* Diagonal gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-transparent via-transparent to-transparent opacity-10" />

      {/* Content */}
      <div className="relative z-10 text-center text-white">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-90">
          Certificate of Completion
        </div>

        <div className="mb-6 text-3xl font-bold drop-shadow-lg">{certificate.curriculumTitle}</div>

        <div className="mb-6">
          <div className="mb-1 text-xs opacity-80">Awarded to</div>
          <div className="text-xl font-semibold drop-shadow-lg">{userName}</div>
        </div>

        <div className="mb-6 flex justify-center gap-8 border-t border-b border-white/20 py-5">
          <div className="text-center">
            <span className="block text-2xl font-bold">{certificate.totalMissions}</span>
            <div className="mt-1 text-xs opacity-80">Missions</div>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold">{certificate.totalCategories}</span>
            <div className="mt-1 text-xs opacity-80">Categories</div>
          </div>
        </div>

        <div className="text-xs opacity-80">
          Completed on {new Date(certificate.completionDate).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
