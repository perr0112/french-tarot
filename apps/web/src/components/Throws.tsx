import type { Seat } from '@tarot/engine';
import { THROW_ITEMS, type ThrowItem } from '@tarot/protocol';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { Throw } from '../hooks/useThrows';
import { loadGsap } from '../lib/gsap';
import { useMedia } from '../lib/media';
import { useAnimations } from '../lib/theme';
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
              d={`M${x - 4} 33 Q${x - 4} 46 ${x} 50 Q${x + 4} 46 ${x + 4} 33 Z`}
              fill="#FFF6F0"
              stroke="#F3DCCD"
              strokeWidth={1.5}
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

/** A little heart or a snowflake out of a burst, in its colour, with the drawings' ink. */
function BurstShape({ item, color }: { item: 'heart' | 'snowball'; color: string }) {
  return item === 'heart' ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21 C4 15 2 11 2 8 C2 5 4.5 3 7 3 C9 3 11 4.5 12 6 C13 4.5 15 3 17 3 C19.5 3 22 5 22 8 C22 11 20 15 12 21 Z"
        fill={color}
        {...LINE}
        strokeWidth={1.5}
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
          const drips = splat.querySelectorAll('[data-drip]');
          if (drips.length > 0)
            gsap.to(drips, {
              scaleY: 1.3,
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
          Array.from(bits).forEach((bit, i) => {
            if (thrown.item === 'heart') {
              // A rain of little hearts over the badge, swaying down.
              gsap.fromTo(
                bit,
                {
                  x: gsap.utils.random(-60, 60),
                  y: gsap.utils.random(-90, -50),
                  opacity: 0,
                  scale: gsap.utils.random(0.6, 1),
                },
                {
                  keyframes: [
                    { opacity: 1, duration: 0.2 },
                    {
                      y: gsap.utils.random(20, 50),
                      x: `+=${gsap.utils.random(-20, 20)}`,
                      opacity: 0,
                      duration: gsap.utils.random(1.4, 2),
                    },
                  ],
                  delay: i * 0.08,
                  ease: 'sine.in',
                },
              );
              return;
            }
            // Out from the impact, mostly sideways and down: never up over the top bar.
            const angle = gsap.utils.random(-0.3, Math.PI + 0.3);
            const distance = gsap.utils.random(40, 100);
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
                y: Math.sin(angle) * distance * 0.6 + 30,
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
    <div data-throw={thrown.item}>
      {!landed || thrown.item === 'balloon' ? (
        <div ref={projectile} className={`${styles.projectile} ${landed ? styles.popped : ''}`}>
          <ThrowShape item={thrown.item} />
        </div>
      ) : null}
      {landed && target && (
        <>
          <div ref={mark} className={styles.mark} style={{ left: target.x, top: target.y }}>
            <Mark item={thrown.item} />
          </div>
          {colours && !still && (
            <div ref={burst} className={styles.burst} style={{ left: target.x, top: target.y }}>
              {Array.from({ length: 14 }, (_, i) =>
                thrown.item === 'heart' || thrown.item === 'snowball' ? (
                  <span key={i} className={styles.heart}>
                    <BurstShape
                      item={thrown.item}
                      color={colours[i % colours.length] ?? '#FFFFFF'}
                    />
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
  // With less motion asked for, or the « Animations » switch off: the marks alone, no flight.
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const animations = useAnimations();
  const still = reduced || !animations;
  if (throws.length === 0) return null;
  return createPortal(
    <div className={styles.layer} aria-hidden="true" data-still={still ? '' : undefined}>
      {throws.map((thrown) => (
        <Flight key={thrown.id} thrown={thrown} still={still} />
      ))}
    </div>,
    document.body,
  );
}

/** Where a picker opens: under its badge's centre (window coordinates). */
export interface PickerAnchor {
  readonly x: number;
  readonly y: number;
}

/**
 * The six things to throw at `name`, opened under their badge, kept inside the screen; Escape,
 * a click elsewhere or a choice closes it.
 */
export function ThrowPicker({
  name,
  anchor,
  onThrow,
  onClose,
}: {
  name: string;
  anchor: PickerAnchor;
  onThrow: (item: ThrowItem) => void;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      // Its own badge toggles it by itself.
      if (!root.current?.contains(target) && !target.closest?.('[data-throw-anchor]')) onClose();
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [onClose]);
  return createPortal(
    <div
      ref={root}
      className={styles.picker}
      role="group"
      aria-label={fr.throws.title(name)}
      style={{ '--x': `${anchor.x}px`, '--y': `${anchor.y}px` } as CSSProperties}
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
    </div>,
    document.body,
  );
}
