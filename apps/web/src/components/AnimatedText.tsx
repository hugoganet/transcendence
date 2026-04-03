/**
 * @file AnimatedText — reveals text character by character with staggered animation.
 * FR: AnimatedText — révèle le texte caractère par caractère avec une animation décalée.
 */
interface AnimatedTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delayMs?: number;
}

/**
 * Renders text with a per-character reveal animation and configurable delay.
 * FR: Affiche du texte avec une animation de révélation par caractère et un délai configurable.
 */
export function AnimatedText({
  text,
  className = "",
  as: Tag = "h1",
  delayMs = 40,
}: AnimatedTextProps) {
  return (
    <Tag className={`flex flex-wrap justify-center ${className}`}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            animation: "char-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
            animationDelay: `${i * delayMs}ms`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}
