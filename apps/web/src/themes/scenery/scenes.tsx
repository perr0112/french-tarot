import type { ReactNode } from 'react';
import type { Season } from '../seasons';

/**
 * The four cartoon landscapes behind the table (DESIGN.md §3.1), drawn by hand in a 1600 × 900
 * box, bottom-anchored: soft round shapes, frank colours, a dark ink outline on what is near.
 * Each is in three layers (`data-depth`: far, mid, near) that drift a little with the pointer,
 * and what moves carries `data-anim` (animateScene.ts). The sky is the shader's (sky.ts).
 */

const INK = '#2B2A3A';
const OUTLINE = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

function Layer({ depth, children }: { depth: 'far' | 'mid' | 'near'; children: ReactNode }) {
  return <g data-depth={depth}>{children}</g>;
}

// ---------------------------------------------------------------- shared pieces

/** A snowy fir: three stacked tiers, snow on each. */
function Fir({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-7" y="-10" width="14" height="22" rx="3" fill="#5B3A29" {...OUTLINE} />
      {[0, 1, 2].map((i) => {
        const w = 62 - i * 14;
        const top = -40 - i * 34;
        return (
          <g key={i}>
            <path
              d={`M${-w} ${top + 44} L0 ${top - 8} L${w} ${top + 44} Z`}
              fill="#24584E"
              {...OUTLINE}
            />
            <path
              d={`M${-w * 0.6} ${top + 24} Q0 ${top + 6} ${w * 0.6} ${top + 24} L0 ${top - 6} Z`}
              fill="#F4F8FF"
            />
          </g>
        );
      })}
    </g>
  );
}

/** A round tree: a trunk and a canopy of three blobs, swaying from its foot. */
function RoundTree({
  x,
  y,
  s = 1,
  leaves,
  shade,
}: {
  x: number;
  y: number;
  s?: number;
  leaves: string;
  shade: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 0 Q-6 -50 -4 -90 L4 -90 Q6 -50 9 0 Z" fill="#6B4430" {...OUTLINE} />
      <g data-anim="sway">
        <circle cx="-34" cy="-104" r="38" fill={shade} {...OUTLINE} />
        <circle cx="32" cy="-108" r="40" fill={shade} {...OUTLINE} />
        <circle cx="0" cy="-140" r="50" fill={leaves} {...OUTLINE} />
        <circle cx="-14" cy="-156" r="12" fill="#FFFFFF" opacity="0.25" />
      </g>
    </g>
  );
}

/** A meadow flower on its stem, nodding in the wind. */
function Flower({ x, y, petals, s = 1 }: { x: number; y: number; petals: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 0 Q-3 -18 0 -34"
        fill="none"
        stroke="#3E7A34"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <g data-anim="nod" transform="translate(0 -36)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-8"
            rx="6"
            ry="8"
            fill={petals}
            transform={`rotate(${a})`}
            {...OUTLINE}
            strokeWidth={2}
          />
        ))}
        <circle r="5" fill="#FFD23F" stroke={INK} strokeWidth="2" />
      </g>
    </g>
  );
}

// ---------------------------------------------------------------- winter

function Winter() {
  return (
    <>
      <Layer depth="far">
        <path
          d="M0 560 L170 400 L290 480 L460 300 L640 470 L790 360 L960 500 L1130 320 L1300 470 L1450 380 L1600 460 V900 H0 Z"
          fill="#33386A"
        />
        {[
          [170, 400],
          [460, 300],
          [790, 360],
          [1130, 320],
          [1450, 380],
        ].map(([x = 0, y = 0]) => (
          <path
            key={x}
            d={`M${x - 46} ${y + 50} L${x} ${y} L${x + 46} ${y + 50} Q${x + 20} ${y + 40} ${x} ${y + 56} Q${x - 22} ${y + 40} ${x - 46} ${y + 50} Z`}
            fill="#E9EEFF"
          />
        ))}
      </Layer>
      <Layer depth="mid">
        <path d="M0 650 Q300 560 620 630 T1220 600 T1600 610 V900 H0 Z" fill="#B9C8EC" />
        <Fir x={520} y={640} s={0.8} />
        <Fir x={600} y={655} s={0.65} />
        <Fir x={1060} y={620} s={0.75} />
        <Fir x={1150} y={640} s={0.95} />
        <Fir x={1520} y={630} s={0.8} />
        {/* The cabin: logs, a snowy roof, lit windows, smoke from the chimney. */}
        <g transform="translate(250 700)">
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              data-anim="smoke"
              cx="76"
              cy={-250 - i * 4}
              r={12 + i * 3}
              fill="#E7E9F3"
              opacity="0"
            />
          ))}
          <rect x="62" y="-238" width="30" height="58" fill="#8A4B3A" {...OUTLINE} />
          <rect x="-150" y="-140" width="300" height="140" rx="8" fill="#9A6440" {...OUTLINE} />
          {[-110, -80, -50, -20].map((y) => (
            <path key={y} d={`M-150 ${y} H150`} stroke="#6E4329" strokeWidth="3" />
          ))}
          <path d="M-180 -132 L0 -250 L180 -132 Z" fill="#7A2E33" {...OUTLINE} />
          <path
            d="M-188 -128 Q-160 -150 -120 -160 L0 -258 L120 -160 Q160 -150 188 -128 Q150 -118 120 -134 Q90 -116 60 -134 Q30 -114 0 -134 Q-30 -114 -60 -134 Q-90 -116 -120 -134 Q-150 -118 -188 -128 Z"
            fill="#F5F8FF"
            {...OUTLINE}
          />
          <rect x="-30" y="-92" width="60" height="92" rx="6" fill="#5A3322" {...OUTLINE} />
          <circle cx="18" cy="-46" r="4" fill="#E9C46A" />
          {[-110, 70].map((x) => (
            <g key={x}>
              <rect
                data-anim="glow"
                x={x}
                y="-108"
                width="44"
                height="44"
                rx="4"
                fill="#FFD66B"
                {...OUTLINE}
              />
              <path d={`M${x + 22} -108 V-64 M${x} -86 H${x + 44}`} stroke={INK} strokeWidth="3" />
            </g>
          ))}
        </g>
      </Layer>
      <Layer depth="near">
        <path d="M0 770 Q360 700 760 760 T1600 740 V900 H0 Z" fill="#EEF3FF" {...OUTLINE} />
        {/* The snowman: a scarf, a carrot, coal eyes that blink. */}
        <g transform="translate(1320 790)">
          <ellipse cx="0" cy="-10" rx="70" ry="14" fill="#D7DFF2" />
          <circle cx="0" cy="-60" r="62" fill="#FFFFFF" {...OUTLINE} />
          <circle cx="0" cy="-160" r="46" fill="#FFFFFF" {...OUTLINE} />
          <circle cx="0" cy="-238" r="36" fill="#FFFFFF" {...OUTLINE} />
          <path
            d="M-44 -168 L-110 -200 M-96 -193 L-104 -214"
            fill="none"
            stroke="#6B4430"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M44 -168 L108 -206 M94 -198 L112 -190"
            fill="none"
            stroke="#6B4430"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M-38 -206 Q0 -186 38 -206 L40 -194 Q0 -174 -40 -194 Z"
            fill="#D64545"
            {...OUTLINE}
          />
          <path d="M20 -196 L30 -150 L46 -152 L34 -196 Z" fill="#D64545" {...OUTLINE} />
          <path d="M-2 -236 L46 -228 L-2 -222 Z" fill="#F08A24" {...OUTLINE} />
          <g data-anim="blink" style={{ transformOrigin: '0px -250px' }}>
            <circle cx="-13" cy="-250" r="5" fill={INK} />
            <circle cx="13" cy="-250" r="5" fill={INK} />
          </g>
          <path
            d="M-16 -222 Q0 -212 16 -222"
            fill="none"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {[-150, -120, -90].map((y) => (
            <circle key={y} cx="0" cy={y} r="5" fill={INK} />
          ))}
          <rect x="-30" y="-292" width="60" height="22" rx="3" fill="#2E2E3F" {...OUTLINE} />
          <rect x="-44" y="-274" width="88" height="10" rx="4" fill="#2E2E3F" {...OUTLINE} />
        </g>
        <Fir x={120} y={830} s={1.1} />
      </Layer>
    </>
  );
}

// ---------------------------------------------------------------- autumn

function Autumn() {
  return (
    <>
      <Layer depth="far">
        <path
          d="M0 560 L200 420 L360 500 L560 380 L760 500 L940 410 L1120 520 L1320 400 L1600 520 V900 H0 Z"
          fill="#6E5A94"
        />
        <path
          d="M0 600 L240 500 L440 570 L700 480 L900 580 L1140 490 L1400 580 L1600 520 V900 H0 Z"
          fill="#8C6FA8"
        />
      </Layer>
      <Layer depth="mid">
        <path d="M0 640 Q260 560 560 620 T1100 600 T1600 620 V900 H0 Z" fill="#D9883E" />
        <path d="M0 700 Q400 620 820 690 T1600 670 V900 H0 Z" fill="#B8642F" />
        {/* The river, winding down from the hills; its glints run along it. */}
        <path
          d="M1010 600 Q960 640 1010 680 Q1080 730 960 780 Q820 840 900 900 H1080 Q1000 840 1120 790 Q1240 730 1120 680 Q1060 640 1070 600 Z"
          fill="#5DA9E9"
          {...OUTLINE}
        />
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            data-anim="flow"
            d="M1040 610 Q1000 650 1050 690 Q1120 740 1000 790 Q900 840 980 900"
            fill="none"
            stroke="#DFF2FF"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="18 70"
            opacity={0.8 - i * 0.2}
            transform={`translate(${i * 14 - 14} 0)`}
          />
        ))}
        <RoundTree x={300} y={690} s={0.9} leaves="#E8A33D" shade="#C8743A" />
        <RoundTree x={470} y={705} s={0.7} leaves="#D9542E" shade="#A8432A" />
        <RoundTree x={1330} y={690} s={0.85} leaves="#F2C14E" shade="#D9A441" />
        <RoundTree x={1480} y={710} s={0.7} leaves="#C8743A" shade="#8E4A2B" />
      </Layer>
      <Layer depth="near">
        <path d="M0 790 Q420 730 820 790 T1600 770 V900 H0 Z" fill="#8E5A2B" {...OUTLINE} />
        <RoundTree x={130} y={860} s={1.25} leaves="#D9542E" shade="#B5532F" />
        {/* Fallen leaves on the ground. */}
        {[
          [520, 830, '#E8A33D'],
          [610, 850, '#D9542E'],
          [700, 820, '#F2C14E'],
          [1260, 820, '#E8A33D'],
          [1380, 850, '#D9542E'],
        ].map(([x, y, c]) => (
          <ellipse
            key={`${x}`}
            cx={x}
            cy={y}
            rx="12"
            ry="6"
            fill={String(c)}
            transform={`rotate(-20 ${x} ${y})`}
          />
        ))}
      </Layer>
    </>
  );
}

// ---------------------------------------------------------------- summer

function Summer() {
  return (
    <>
      <Layer depth="far">
        {/* The sun, high on the left, its rays turning slowly (the shader adds its glow). */}
        <g transform="translate(256 150)">
          <g data-anim="spin">
            {Array.from({ length: 12 }, (_, i) => (
              <path
                key={i}
                d="M0 -92 L12 -66 L-12 -66 Z"
                fill="#FFD23F"
                transform={`rotate(${i * 30})`}
                {...OUTLINE}
                strokeWidth={2}
              />
            ))}
          </g>
          <circle r="56" fill="#FFE066" {...OUTLINE} />
          <circle cx="-18" cy="-6" r="5" fill={INK} />
          <circle cx="18" cy="-6" r="5" fill={INK} />
          <path
            d="M-18 14 Q0 30 18 14"
            fill="none"
            stroke={INK}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="-32" cy="10" r="8" fill="#FF9F80" opacity="0.6" />
          <circle cx="32" cy="10" r="8" fill="#FF9F80" opacity="0.6" />
        </g>
        <path d="M0 600 Q300 500 640 580 T1300 540 T1600 560 V900 H0 Z" fill="#A6D98A" />
      </Layer>
      <Layer depth="mid">
        <path d="M0 680 Q380 590 800 660 T1600 640 V900 H0 Z" fill="#74C25C" />
        <RoundTree x={360} y={690} s={1} leaves="#5BB54A" shade="#3E9A3A" />
        <RoundTree x={1180} y={670} s={0.85} leaves="#6CC255" shade="#47A042" />
        <RoundTree x={1400} y={700} s={1.05} leaves="#5BB54A" shade="#3E9A3A" />
      </Layer>
      <Layer depth="near">
        <path d="M0 780 Q420 720 840 780 T1600 760 V900 H0 Z" fill="#5FAE4C" {...OUTLINE} />
        {[
          [80, 850, '#FF6B6B'],
          [170, 830, '#FFFFFF'],
          [260, 860, '#B983FF'],
          [520, 840, '#FFD23F'],
          [610, 860, '#FF6B6B'],
          [980, 850, '#FFFFFF'],
          [1080, 830, '#B983FF'],
          [1250, 860, '#FF6B6B'],
          [1350, 840, '#FFD23F'],
          [1500, 855, '#FFFFFF'],
        ].map(([x, y, c]) => (
          <Flower key={`${x}`} x={Number(x)} y={Number(y)} petals={String(c)} />
        ))}
        {/* Butterflies, each fluttering along its own wandering path. */}
        {[
          [420, 600, '#FF8FB1'],
          [900, 520, '#7CC6FE'],
          [1250, 580, '#FFD23F'],
          [650, 700, '#B983FF'],
        ].map(([x, y, c]) => (
          <g key={`${x}`} data-anim="butterfly" transform={`translate(${x} ${y})`}>
            <g data-anim="wings">
              <ellipse
                cx="-11"
                cy="-6"
                rx="12"
                ry="15"
                fill={String(c)}
                {...OUTLINE}
                strokeWidth={2}
              />
              <ellipse
                cx="11"
                cy="-6"
                rx="12"
                ry="15"
                fill={String(c)}
                {...OUTLINE}
                strokeWidth={2}
              />
              <ellipse
                cx="-8"
                cy="10"
                rx="8"
                ry="9"
                fill={String(c)}
                {...OUTLINE}
                strokeWidth={2}
              />
              <ellipse cx="8" cy="10" rx="8" ry="9" fill={String(c)} {...OUTLINE} strokeWidth={2} />
            </g>
            <rect x="-2.5" y="-14" width="5" height="28" rx="2.5" fill={INK} />
          </g>
        ))}
      </Layer>
    </>
  );
}

// ---------------------------------------------------------------- spring

function Spring() {
  return (
    <>
      <Layer depth="far">
        {/* A rainbow after the shower, breathing in and out. */}
        <g data-anim="rainbow" opacity="0.55" fill="none" strokeWidth="18">
          {['#FF6B6B', '#FFA94D', '#FFE066', '#8CE99A', '#74C0FC', '#B197FC'].map((c, i) => (
            <path
              key={c}
              d={`M${380 + i * 18} 640 A${520 - i * 18} ${420 - i * 18} 0 0 1 ${1420 - i * 18} 640`}
              stroke={c}
            />
          ))}
        </g>
        <path d="M0 610 Q320 520 660 590 T1320 560 T1600 580 V900 H0 Z" fill="#B5E0A0" />
        {/* Birds crossing the sky, wings beating. */}
        {[
          [300, 260],
          [360, 300],
          [1100, 220],
        ].map(([x, y]) => (
          <g key={`${x}`} data-anim="bird" transform={`translate(${x} ${y})`}>
            <path
              data-anim="flap"
              d="M-16 0 Q-8 -10 0 0 Q8 -10 16 0"
              fill="none"
              stroke={INK}
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ))}
      </Layer>
      <Layer depth="mid">
        <path d="M0 680 Q360 600 780 670 T1600 650 V900 H0 Z" fill="#8FD07A" />
        <RoundTree x={300} y={690} s={0.95} leaves="#F9C9D8" shade="#F2A7BF" />
        <RoundTree x={1320} y={680} s={0.9} leaves="#FBD5E1" shade="#F4B3C8" />
        {/* The pond and its ducks. */}
        <ellipse cx="820" cy="760" rx="250" ry="48" fill="#7EC8E3" {...OUTLINE} />
        <ellipse cx="760" cy="752" rx="90" ry="8" fill="#BFE6F3" opacity="0.8" />
        {[
          [740, 752],
          [900, 760],
        ].map(([x, y]) => (
          <g key={`${x}`} data-anim="duck" transform={`translate(${x} ${y})`}>
            <path
              d="M-26 0 Q-26 -20 0 -18 Q18 -18 22 -6 Q26 4 -26 0 Z"
              fill="#FFE066"
              {...OUTLINE}
              strokeWidth={2.5}
            />
            <circle cx="14" cy="-28" r="12" fill="#FFE066" {...OUTLINE} strokeWidth={2.5} />
            <path d="M24 -30 L36 -27 L24 -23 Z" fill="#F08A24" stroke={INK} strokeWidth="2" />
            <circle cx="17" cy="-31" r="2.5" fill={INK} />
          </g>
        ))}
      </Layer>
      <Layer depth="near">
        <path d="M0 790 Q420 730 840 790 T1600 770 V900 H0 Z" fill="#7BC266" {...OUTLINE} />
        {[
          [90, 855, '#FF8FB1'],
          [200, 840, '#FFD23F'],
          [330, 860, '#FFFFFF'],
          [1230, 845, '#FF8FB1'],
          [1340, 860, '#FFFFFF'],
          [1470, 840, '#FFD23F'],
        ].map(([x, y, c]) => (
          <Flower key={`${x}`} x={Number(x)} y={Number(y)} petals={String(c)} s={1.1} />
        ))}
      </Layer>
    </>
  );
}

const SCENES: Readonly<Record<Season, () => ReactNode>> = {
  spring: Spring,
  summer: Summer,
  autumn: Autumn,
  winter: Winter,
};

/** The season's landscape, filling the window from the bottom (the sky shows above it). */
export function Landscape({ season }: { season: Season }) {
  const Scene = SCENES[season];
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      data-scene={season}
    >
      <Scene />
    </svg>
  );
}
