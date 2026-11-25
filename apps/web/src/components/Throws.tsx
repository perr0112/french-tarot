import type { Seat } from '@tarot/engine';
import { THROW_ITEMS, type ThrowItem } from '@tarot/protocol';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Throw } from '../hooks/useThrows';
import { loadGsap } from '../lib/gsap';
import { useMedia } from '../lib/media';
import { fr } from '../strings/fr';
import styles from './Throws.module.css';

const INK = '#2B2A3A';
const LINE = {
  stroke: INK,
  strokeWidth: 2.5,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

/** Each thing to throw, drawn as a cartoon in a 48 × 48 box. */
export function ThrowShape({ item }: { item: ThrowItem }) {
  switch (item) {
    case 'cake':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M8 30 L40 20 L40 36 L8 42 Z" fill="#F6D6A8" {...LINE} />
          <path d="M8 30 L40 20 L40 25 L8 35 Z" fill="#F38BA0" {...LINE} />
          <path
            d="M6 28 Q14 22 24 24 Q34 18 42 18 Q40 24 34 22 Q28 28 22 26 Q14 32 6 28 Z"
            fill="#FFFFFF"
            {...LINE}
          />
          <circle cx="30" cy="14" r="5" fill="#E63946" {...LINE} />
          <path d="M30 9 Q33 4 37 4" fill="none" {...LINE} />
        </svg>
      );
    case 'tomato':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="27" r="16" fill="#E63946" {...LINE} />
          <path d="M16 13 L24 17 L32 13 L28 20 L20 20 Z" fill="#4CAF50" {...LINE} />
          <ellipse cx="18" cy="22" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.5" />
        </svg>
      );
    case 'balloon':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 36 Q20 42 26 46" fill="none" {...LINE} strokeWidth={1.5} />
          <ellipse cx="24" cy="20" rx="14" ry="17" fill="#FF6B9A" {...LINE} />
          <path d="M21 36 L27 36 L24 32 Z" fill="#FF6B9A" {...LINE} />
          <ellipse cx="18" cy="13" rx="3.5" ry="5" fill="#FFFFFF" opacity="0.55" />
        </svg>
      );
    case 'snowball':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="16" fill="#FFFFFF" {...LINE} />
          <path
            d="M14 30 Q24 38 36 28"
            fill="none"
            stroke="#BFD6E6"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="19" cy="18" r="3" fill="#E6F0F8" />
        </svg>
      );
    case 'heart':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            d="M24 40 C10 30 6 22 6 16 C6 10 11 6 16 6 C20 6 23 9 24 12 C25 9 28 6 32 6 C37 6 42 10 42 16 C42 22 38 30 24 40 Z"
            fill="#FF4D7D"
            {...LINE}
          />
          <ellipse cx="15" cy="14" rx="3" ry="4" fill="#FFFFFF" opacity="0.5" />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path d="M34 24 L46 14 L44 24 L46 34 Z" fill="#4DA3FF" {...LINE} />
          <ellipse cx="22" cy="24" rx="16" ry="11" fill="#7CC6FE" {...LINE} />
          <circle cx="13" cy="21" r="2.5" fill={INK} />
          <path d="M10 28 Q13 30 16 28" fill="none" {...LINE} strokeWidth={1.5} />
          <path d="M22 16 Q26 24 22 32" fill="none" stroke="#4DA3FF" strokeWidth="2" />
        </svg>
      );
  }
}

/** What each thing leaves on its target. */
function Mark({ item }: { item: ThrowItem }) {
  switch (item) {
    case 'cake':
      // Cream on the badge, dripping.
      return (
        <svg viewBox="0 0 80 60" aria-hidden="true">
          <path
            d="M6 22 Q12 6 30 10 Q40 0 54 8 Q74 6 74 24 Q78 34 66 36 Q60 40 50 36 Q40 42 30 36 Q16 40 10 32 Q2 30 6 22 Z"
            fill="#FFF6F0"
            {...LINE}
          />
          {[20, 38, 58].map((x) => (
            <path
              key={x}
              data-drip=""
              d={`M${x} 34 Q${x + 2} 46 ${x} 52 Q${x - 3} 46 ${x - 2} 34 Z`}
              fill="#FFF6F0"
              {...LINE}
              strokeWidth={2}
            />
          ))}
          <circle cx="44" cy="14" r="5" fill="#E63946" {...LINE} />
          <path
            d="M18 20 l6 -2 M52 22 l6 2 M34 24 l4 -3"
            stroke="#F38BA0"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'tomato':
      return (
        <svg viewBox="0 0 80 60" aria-hidden="true">
          <path
            d="M10 30 Q4 18 18 16 Q22 4 36 12 Q48 2 56 14 Q74 12 70 28 Q80 38 64 42 Q60 56 46 48 Q34 58 26 46 Q8 48 14 38 Q2 36 10 30 Z"
            fill="#E63946"
            {...LINE}
          />
          {[
            [30, 26],
            [44, 30],
            [36, 38],
            [52, 22],
          ].map(([x, y]) => (
            <ellipse key={`${x}`} cx={x} cy={y} rx="2.5" ry="1.6" fill="#FFE8A3" />
          ))}
        </svg>
      );
    case 'snowball':
      return (
        <svg viewBox="0 0 80 60" aria-hidden="true">
          <path
            d="M12 30 Q8 18 22 18 Q28 8 40 14 Q54 6 60 18 Q74 18 70 32 Q76 44 60 44 Q52 54 40 46 Q26 54 20 44 Q6 42 12 30 Z"
            fill="#FFFFFF"
            {...LINE}
          />
          <path
            d="M24 36 Q40 44 58 34"
            fill="none"
            stroke="#BFD6E6"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'fish':
      // The fish itself lands and wriggles (Flight).
      return <ThrowShape item="fish" />;
    case 'balloon':
    case 'heart':
      // A burst of confetti or of little hearts (Flight), no mark.
      return null;
  }
}

/** Confetti and little hearts flying out of an impact. */
const BURST_COLOURS: Readonly<Partial<Record<ThrowItem, readonly string[]>>> = {
  balloon: ['#FF6B9A', '#FFD23F', '#7CC6FE', '#8CE99A', '#B983FF'],
  heart: ['#FF4D7D', '#FF8FB1', '#FFC2D4'],
  snowball: ['#FFFFFF', '#E6F0F8'],
  tomato: ['#E63946', '#C92A3A'],
};

const centreOf = (seat: Seat): { x: number; y: number } | null => {
  const badge = document.querySelector(`[data-seat="${seat}"]`);
  if (!badge) return null;
  const box = badge.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/**
 * One throw: the thing flies in an arc from the thrower's badge to the target's (a balloon
 * floats up first), lands — a splat of cream or tomato, a puff of snow, a wriggling fish — and
 * bursts into confetti, snow, tomato drops or little hearts; then it all fades. Seen at once,
 * with no flight, when the system asks for less motion.
 */
function Flight({ thrown, still }: { thrown: Throw; still: boolean }) {
  const projectile = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const burst = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(still);
  const target = centreOf(thrown.to);

  useEffect(() => {
    const ball = projectile.current;
    const start = centreOf(thrown.from);
    const end = centreOf(thrown.to);
    if (still || !ball || !start || !end) return;
    let stopped = false;
    let undo: (() => void) | null = null;
    void loadGsap().then((gsap) => {
      if (stopped) return;
      const context = gsap.context(() => {
        const height = Math.max(120, Math.abs(end.x - start.x) * 0.35);
        const balloon = thrown.item === 'balloon';
        gsap.set(ball, { x: start.x, y: start.y, xPercent: -50, yPercent: -50, scale: 0.6 });
        gsap
          .timeline({ onComplete: () => setLanded(true) })
          .to(
            ball,
            { x: end.x, duration: balloon ? 1.2 : 0.8, ease: balloon ? 'sine.inOut' : 'none' },
            0,
          )
          .to(
            ball,
            {
              keyframes: [
                // Its arc stays on the screen, however far it goes.
                { y: Math.max(48, Math.min(start.y, end.y) - height), ease: 'power2.out' },
                { y: end.y, ease: balloon ? 'sine.in' : 'power2.in' },
              ],
              duration: balloon ? 1.2 : 0.8,
            },
            0,
          )
          .to(
            ball,
            { scale: 1, rotation: balloon ? 0 : 540, duration: balloon ? 1.2 : 0.8, ease: 'none' },
            0,
          )
          // A balloon swells over its target before it pops.
          .to(ball, {
            scale: balloon ? 1.8 : 1,
            duration: balloon ? 0.35 : 0,
            ease: 'back.out(3)',
          });
      });
      undo = () => context.revert();
    });
    return () => {
      stopped = true;
      undo?.();
    };
  }, [thrown, still]);

  useEffect(() => {
    if (!landed || still) return;
    let stopped = false;
    let undo: (() => void) | null = null;
    void loadGsap().then((gsap) => {
      if (stopped) return;
      const context = gsap.context(() => {
        const splat = mark.current;
        if (splat) {
          gsap.fromTo(
            splat,
            { scale: 0.2, opacity: 1 },
            { scale: 1, duration: 0.35, ease: 'back.out(2.4)' },
          );
          gsap.to(splat.querySelectorAll('[data-drip]'), {
            scaleY: 1.6,
            transformOrigin: '50% 0%',
            duration: 2,
            ease: 'sine.in',
            stagger: 0.2,
          });
          if (thrown.item === 'fish') {
            gsap.fromTo(
              splat,
              { rotation: -18 },
              { rotation: 18, duration: 0.16, yoyo: true, repeat: 9, ease: 'sine.inOut' },
            );
          }
          gsap.to(splat, { opacity: 0, duration: 0.8, delay: 2.4 });
        }
        const bits = burst.current?.children;
        if (bits) {
          Array.from(bits).forEach((bit) => {
            const angle = gsap.utils.random(0, Math.PI * 2);
            const distance = gsap.utils.random(40, 110);
            const hearts = thrown.item === 'heart';
            gsap.fromTo(
              bit,
              {
                x: 0,
                y: 0,
                opacity: 1,
                scale: gsap.utils.random(0.6, 1.2),
                rotation: gsap.utils.random(0, 360),
              },
              {
                x: Math.cos(angle) * distance,
                y: hearts ? -gsap.utils.random(60, 140) : Math.sin(angle) * distance + 40,
                rotation: `+=${gsap.utils.random(-180, 180)}`,
                opacity: 0,
                duration: gsap.utils.random(1, 1.8),
                ease: 'power2.out',
              },
            );
          });
        }
      });
      undo = () => context.revert();
    });
    return () => {
      stopped = true;
      undo?.();
    };
  }, [landed, still, thrown.item]);

  const colours = BURST_COLOURS[thrown.item];
  return (
    <div className={styles.throw} data-throw={thrown.item}>
      {!landed || thrown.item === 'balloon' ? (
        <div
          ref={projectile}
          className={`${styles.projectile} ${landed ? styles.popped : ''}`}
          style={landed && target ? { left: target.x, top: target.y } : undefined}
        >
          <ThrowShape item={thrown.item} />
        </div>
      ) : null}
      {landed && target && (
        <>
          <div ref={mark} className={styles.mark} style={{ left: target.x, top: target.y }}>
            <Mark item={thrown.item} />
          </div>
          {colours && (
            <div ref={burst} className={styles.burst} style={{ left: target.x, top: target.y }}>
              {Array.from({ length: 14 }, (_, i) =>
                thrown.item === 'heart' ? (
                  <span
                    key={i}
                    className={styles.heart}
                    style={{ color: colours[i % colours.length] }}
                  >
                    <ThrowShape item="heart" />
                  </span>
                ) : (
                  <span
                    key={i}
                    className={styles.bit}
                    style={{ background: colours[i % colours.length] }}
                  />
                ),
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Everything thrown across the table, over the seats and under nothing that takes input. */
export function ThrowLayer({ throws }: { throws: readonly Throw[] }) {
  const still = useMedia('(prefers-reduced-motion: reduce)');
  if (throws.length === 0) return null;
  return createPortal(
    <div className={styles.layer} aria-hidden="true">
      {throws.map((thrown) => (
        <Flight key={thrown.id} thrown={thrown} still={still} />
      ))}
    </div>,
    document.body,
  );
}

/** The six things to throw at `name`, opened from their badge. */
export function ThrowPicker({
  name,
  onThrow,
  onClose,
}: {
  name: string;
  onThrow: (item: ThrowItem) => void;
  onClose: () => void;
}) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => first.current?.focus(), []);
  return (
    <div
      className={styles.picker}
      role="group"
      aria-label={fr.throws.title(name)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      {THROW_ITEMS.map((item, i) => (
        <button
          key={item}
          ref={i === 0 ? first : undefined}
          type="button"
          className={styles.choice}
          aria-label={fr.throws.items[item]}
          title={fr.throws.items[item]}
          onClick={() => onThrow(item)}
        >
          <ThrowShape item={item} />
        </button>
      ))}
    </div>
  );
}
