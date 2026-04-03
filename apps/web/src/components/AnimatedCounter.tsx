/**
 * @file AnimatedCounter — animates a number from 0 to a target value on scroll into view.
 * FR: AnimatedCounter — anime un nombre de 0 à une valeur cible lorsqu'il apparaît à l'écran.
 */
import { useState, useEffect, useRef } from "react";

/** Props for AnimatedCounter. / FR: Props pour AnimatedCounter. */
interface AnimatedCounterProps {
  target: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * Counts up from 0 to a target number with an animation triggered by IntersectionObserver.
 * FR: Compte de 0 jusqu'à un nombre cible avec une animation déclenchée par IntersectionObserver.
 */
export function AnimatedCounter({
  target,
  duration = 1500,
  className = "",
  prefix = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    hasAnimated.current = false;
    setCount(0);
    if (target <= 0) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const increment = Math.ceil(target / (duration / 16));
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              start = target;
              clearInterval(timer);
            }
            setCount(start);
          }, 16);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}
