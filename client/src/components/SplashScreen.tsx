import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 4800;
const FADE_START = 4.0;
const FADE_END = 4.8;

/* Logo palette:
   Deep violet:  #6030F0   96,48,240
   Mid purple:   #7040F0  112,64,240
   Light violet: #8050F0  128,80,240
   Lavender:     #C0B0F0  192,176,240
   Pale lilac:   #D7CAFB  215,202,251
*/

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandFading, setBrandFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 2800);
    const t2 = setTimeout(() => setBrandFading(true), FADE_START * 1000);
    const t3 = setTimeout(() => onCompleteRef.current(), SPLASH_DURATION + 100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="apple-splash" style={{ background: "#000" }}>
      <SplashCanvas />
      <div className={`apple-splash-brand ${brandVisible ? "visible" : ""} ${brandFading ? "fading" : ""}`}>
        <div className="apple-splash-logo-text">AperoSplit</div>
        <div className="apple-splash-tagline">Partagez, équilibrez</div>
      </div>
    </div>
  );
});

SplashScreen.displayName = "SplashScreen";

function SplashCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2 - 20;
    const start = performance.now();
    let alive = true;
    let raf = 0;

    function spring(t: number, d: number, f: number) {
      return 1 - Math.exp(-d * t * 10) * Math.cos(f * t * Math.PI * 2);
    }
    function easeOutExpo(t: number) {
      return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * Math.max(0, Math.min(1, t));
    }
    function clamp01(t: number) {
      return Math.max(0, Math.min(1, t));
    }

    // Colors
    const C_DEEP = [96, 48, 240];
    const C_MID = [112, 64, 240];
    const C_LIGHT = [128, 80, 240];
    const C_LAV = [192, 176, 240];
    const C_PALE = [215, 202, 251];
    const rgb = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;

    const R = 36;
    const LOGO_GAP = 46;

    // ── Particle pool ──
    const MAX_P = 500;
    const pX = new Float32Array(MAX_P);
    const pY = new Float32Array(MAX_P);
    const pVX = new Float32Array(MAX_P);
    const pVY = new Float32Array(MAX_P);
    const pLife = new Float32Array(MAX_P);
    const pMaxLife = new Float32Array(MAX_P);
    const pSize = new Float32Array(MAX_P);
    const pCR = new Uint8Array(MAX_P);
    const pCG = new Uint8Array(MAX_P);
    const pCB = new Uint8Array(MAX_P);
    let pCount = 0;

    function spawn(x: number, y: number, c: number[], count: number, spread = 18, speedMul = 1) {
      for (let i = 0; i < count && pCount < MAX_P; i++) {
        const idx = pCount;
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 1.8 + 0.3) * speedMul;
        pX[idx] = x + (Math.random() - 0.5) * 8;
        pY[idx] = y + (Math.random() - 0.5) * 8;
        pVX[idx] = Math.cos(angle) * speed;
        pVY[idx] = Math.sin(angle) * speed;
        pLife[idx] = 1;
        pMaxLife[idx] = 25 + Math.random() * 50;
        pSize[idx] = Math.random() * 2.8 + 0.6;
        const j = (Math.random() - 0.5) * spread;
        pCR[idx] = Math.min(255, Math.max(0, c[0] + j * 0.8));
        pCG[idx] = Math.min(255, Math.max(0, c[1] + j * 0.5));
        pCB[idx] = Math.min(255, Math.max(180, c[2] + j));
        pCount++;
      }
    }

    // ── Trails ──
    const TRAIL = 28;
    const tr1X = new Float32Array(TRAIL);
    const tr1Y = new Float32Array(TRAIL);
    const tr2X = new Float32Array(TRAIL);
    const tr2Y = new Float32Array(TRAIL);
    let trIdx = 0;

    // ── Ambient particles ──
    const ambients = Array.from({ length: 12 }, (_, i) => ({
      baseAngle: (i / 12) * Math.PI * 2,
      dist: 50 + Math.random() * 100,
      speed: 0.15 + Math.random() * 0.35,
      size: 1 + Math.random() * 3,
      c: [
        96 + Math.random() * 100,
        48 + Math.random() * 80,
        200 + Math.random() * 55,
      ] as number[],
    }));

    // ════════════════════════════════════════════════════
    //  CHOREOGRAPHY (4.8s total)
    //
    //  0.0 – 0.6s   ONE orb materializes, grows from 0
    //  0.6 – 1.1s   Orb breathes, glows, pulses energy
    //  1.1 – 1.5s   Orb stretches horizontally (pre-split)
    //  1.5 – 1.9s   MITOSIS — splits into two, bright flash
    //  1.9 – 2.4s   Two orbs separate with trails + particles
    //  2.4 – 3.0s   Re-converge to logo gap (smooth spring)
    //  3.0 – 3.8s   Logo holds: divider line, gentle breathing
    //  3.8 – 4.8s   Canvas fade to black, brand text fades
    // ════════════════════════════════════════════════════

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      const globalFade = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;

      // ── Clear to black ──
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // ── Orb 1 position & state ──
      let o1x = cx, o1y = cy, o1sx = 1, o1sy = 1, o1a = 0;
      // ── Orb 2 position & state ──
      let o2x = cx, o2y = cy, o2sx = 1, o2sy = 1, o2a = 0;
      // Whether we're in single-orb mode
      let splitProgress = 0; // 0 = one orb, 1 = fully split

      if (t < 0.6) {
        // Phase 0: Single orb appears
        const p = spring(t / 0.6, 0.5, 2.5);
        o1a = p;
        o1sx = p;
        o1sy = p;
        o1x = cx;
        o1y = cy;
      } else if (t < 1.1) {
        // Phase 1: Single orb breathes and pulses
        const bp = (t - 0.6) / 0.5;
        o1a = 1;
        o1x = cx;
        o1y = cy;
        o1sx = 1 + Math.sin(bp * Math.PI * 3) * 0.06;
        o1sy = 1 + Math.sin(bp * Math.PI * 3 + 1) * 0.04;
      } else if (t < 1.5) {
        // Phase 2: Stretch horizontally (pre-split)
        const sp = easeInOutCubic(clamp01((t - 1.1) / 0.4));
        o1a = 1;
        o1x = cx;
        o1y = cy;
        o1sx = 1 + sp * 0.5; // widen
        o1sy = 1 - sp * 0.15; // slightly compress vertically
      } else if (t < 1.9) {
        // Phase 3: MITOSIS — split into two
        const mp = spring(clamp01((t - 1.5) / 0.35), 0.5, 2.5);
        splitProgress = mp;
        o1a = 1;
        o2a = mp;
        const splitDist = mp * 75;
        o1x = cx - splitDist;
        o1y = cy;
        o1sx = 1 + (1 - mp) * 0.3 * (1 - mp); // shrink back from stretch
        o1sy = 1 + (1 - mp) * 0.1;
        o2x = cx + splitDist;
        o2y = cy;
        o2sx = mp > 0.1 ? lerp(1.3, 1, mp) : 0;
        o2sy = mp > 0.1 ? lerp(0.85, 1, mp) : 0;
      } else if (t < 2.4) {
        // Phase 4: Separate outward with momentum
        const sepP = clamp01((t - 1.9) / 0.5);
        const sepS = spring(sepP, 0.35, 2);
        o1a = 1;
        o2a = 1;
        const sepDist = lerp(75, 110, sepS);
        o1x = cx - sepDist;
        o1y = cy;
        o2x = cx + sepDist;
        o2y = cy;
        o1sx = 1; o1sy = 1;
        o2sx = 1; o2sy = 1;
        splitProgress = 1;
      } else if (t < 3.0) {
        // Phase 5: Re-converge to logo gap
        const rcP = clamp01((t - 2.4) / 0.55);
        const rcS = spring(rcP, 0.45, 2);
        const gap = lerp(110, LOGO_GAP, rcS);
        o1a = 1; o2a = 1;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
        o1sx = 1; o1sy = 1; o2sx = 1; o2sy = 1;
        splitProgress = 1;
      } else if (t < FADE_START) {
        // Phase 6: Logo hold with breathing
        const breathe = Math.sin((t - 3.0) * 2) * 1.2;
        const gap = LOGO_GAP + breathe;
        o1a = 1; o2a = 1;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
        o1sx = 1 + Math.sin((t - 3.0) * 2.5) * 0.012;
        o1sy = 1 + Math.sin((t - 3.0) * 2.5 + 0.5) * 0.008;
        o2sx = o1sx; o2sy = o1sy;
        splitProgress = 1;
      } else {
        // Phase 7: Fade out
        const gap = LOGO_GAP;
        o1a = globalFade; o2a = globalFade;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
        o1sx = 1; o1sy = 1; o2sx = 1; o2sy = 1;
        splitProgress = 1;
      }

      // ── Trails ──
      tr1X[trIdx] = o1x; tr1Y[trIdx] = o1y;
      tr2X[trIdx] = o2x; tr2Y[trIdx] = o2y;
      trIdx = (trIdx + 1) % TRAIL;

      // Draw trails
      if (t > 0.1 && t < FADE_START && splitProgress > 0) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < TRAIL; i++) {
          const idx = (trIdx - i - 1 + TRAIL) % TRAIL;
          const trailAlpha = (1 - i / TRAIL) * 0.4;
          const sz = R * 0.28 * (1 - i / TRAIL);

          if (o1a > 0.3) {
            ctx.globalAlpha = trailAlpha * o1a * globalFade;
            const g = ctx.createRadialGradient(tr1X[idx], tr1Y[idx], 0, tr1X[idx], tr1Y[idx], sz);
            g.addColorStop(0, `rgba(${rgb(C_DEEP)},0.6)`);
            g.addColorStop(1, `rgba(${rgb(C_DEEP)},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(tr1X[idx], tr1Y[idx], sz, 0, Math.PI * 2);
            ctx.fill();
          }
          if (o2a > 0.3) {
            ctx.globalAlpha = trailAlpha * o2a * globalFade;
            const g = ctx.createRadialGradient(tr2X[idx], tr2Y[idx], 0, tr2X[idx], tr2Y[idx], sz);
            g.addColorStop(0, `rgba(${rgb(C_LAV)},0.5)`);
            g.addColorStop(1, `rgba(${rgb(C_LAV)},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(tr2X[idx], tr2Y[idx], sz, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ── Particles ──
      if (t > 0.2 && t < 1.1 && Math.random() < 0.4) {
        spawn(o1x, o1y, C_PALE, 1, 10);
      }
      // Pre-split energy
      if (t > 0.8 && t < 1.5 && Math.random() < 0.6) {
        spawn(cx, cy, C_LAV, 1, 14);
        spawn(cx, cy, C_PALE, 1, 20);
      }
      // Split burst
      if (t > 1.4 && t < 1.9) {
        const burstI = clamp01((t - 1.4) / 0.15);
        const burstCount = Math.floor(burstI < 0.5 ? burstI * 2 * 12 : (1 - burstI) * 12);
        spawn(cx, cy, C_PALE, burstCount, 35, 1.5);
        spawn(cx, cy, [255, 255, 255], Math.floor(burstCount * 0.6), 25, 1.8);
      }
      // During separation
      if (t > 1.7 && t < 2.4) {
        spawn(o1x, o1y, C_MID, 2, 16);
        spawn(o2x, o2y, C_LAV, 2, 16);
      }
      // Gentle during hold
      if (t > 3.0 && t < FADE_START && Math.random() < 0.25) {
        spawn(o1x, o1y, C_DEEP, 1, 8);
        spawn(o2x, o2y, C_LAV, 1, 8);
      }

      // Update & draw particles
      ctx.globalCompositeOperation = "lighter";
      for (let i = pCount - 1; i >= 0; i--) {
        pX[i] += pVX[i];
        pY[i] += pVY[i];
        pVX[i] *= 0.96;
        pVY[i] *= 0.96;
        pLife[i] -= 1 / pMaxLife[i];
        if (pLife[i] <= 0) {
          pX[i] = pX[pCount - 1]; pY[i] = pY[pCount - 1];
          pVX[i] = pVX[pCount - 1]; pVY[i] = pVY[pCount - 1];
          pLife[i] = pLife[pCount - 1]; pMaxLife[i] = pMaxLife[pCount - 1];
          pSize[i] = pSize[pCount - 1];
          pCR[i] = pCR[pCount - 1]; pCG[i] = pCG[pCount - 1]; pCB[i] = pCB[pCount - 1];
          pCount--;
          continue;
        }
        const life = pLife[i];
        ctx.globalAlpha = life * life * 0.8 * globalFade;
        ctx.fillStyle = `rgb(${pCR[i]},${pCG[i]},${pCB[i]})`;
        ctx.beginPath();
        ctx.arc(pX[i], pY[i], pSize[i] * life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Draw orb ──
      const drawOrb = (
        ox: number, oy: number, sx: number, sy: number, alpha: number,
        deep: number[], mid: number[], light: number[], pale: number[]
      ) => {
        if (alpha <= 0.01) return;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(sx, sy);

        const drawGlow = (rMul: number, aMul: number, colors: number[][], stops: number[]) => {
          ctx.globalAlpha = alpha * aMul;
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * rMul);
          colors.forEach((c, i) => g.addColorStop(stops[i], `rgba(${rgb(c)},${i < colors.length - 1 ? stops[i + 1] > 0 ? 0.9 - i * 0.2 : 0 : 0})`));
          // Rebuild with proper stops
        };

        // Outer glow (large, soft)
        ctx.globalAlpha = alpha * 0.32;
        const outer = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 5);
        outer.addColorStop(0, `rgba(${rgb(deep)},0.5)`);
        outer.addColorStop(0.15, `rgba(${rgb(deep)},0.3)`);
        outer.addColorStop(0.4, `rgba(${rgb(mid)},0.12)`);
        outer.addColorStop(0.7, `rgba(${rgb(deep)},0.03)`);
        outer.addColorStop(1, `rgba(${rgb(deep)},0)`);
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.arc(0, 0, R * 5, 0, Math.PI * 2);
        ctx.fill();

        // Mid glow
        ctx.globalAlpha = alpha * 0.55;
        const midG = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 2.2);
        midG.addColorStop(0, `rgba(${rgb(light)},0.55)`);
        midG.addColorStop(0.3, `rgba(${rgb(mid)},0.4)`);
        midG.addColorStop(0.7, `rgba(${rgb(deep)},0.15)`);
        midG.addColorStop(1, `rgba(${rgb(deep)},0)`);
        ctx.fillStyle = midG;
        ctx.beginPath();
        ctx.arc(0, 0, R * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Core sphere
        ctx.globalAlpha = alpha;
        const core = ctx.createRadialGradient(-R * 0.12, -R * 0.12, 0, 0, 0, R);
        core.addColorStop(0, `rgba(${rgb(pale)},1)`);
        core.addColorStop(0.15, `rgba(${rgb(light)},0.97)`);
        core.addColorStop(0.35, `rgba(${rgb(mid)},0.94)`);
        core.addColorStop(0.6, `rgba(${rgb(deep)},0.9)`);
        core.addColorStop(0.85, `rgba(${Math.floor(deep[0] * 0.5)},${Math.floor(deep[1] * 0.4)},${deep[2]},0.8)`);
        core.addColorStop(1, `rgba(${Math.floor(deep[0] * 0.3)},${Math.floor(deep[1] * 0.2)},${Math.floor(deep[2] * 0.9)},0.65)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.globalAlpha = alpha * 0.7;
        const spec = ctx.createRadialGradient(-R * 0.25, -R * 0.3, 0, -R * 0.15, -R * 0.2, R * 0.5);
        spec.addColorStop(0, "rgba(255,255,255,0.85)");
        spec.addColorStop(0.3, `rgba(${rgb(pale)},0.45)`);
        spec.addColorStop(0.7, `rgba(${rgb(light)},0.12)`);
        spec.addColorStop(1, `rgba(${rgb(deep)},0)`);
        ctx.fillStyle = spec;
        ctx.beginPath();
        ctx.arc(-R * 0.2, -R * 0.25, R * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      // Draw orbs — single orb mode uses deep palette, split orb 2 uses lavender palette
      if (o1a > 0.01) {
        drawOrb(o1x, o1y, o1sx, o1sy, o1a, C_DEEP, C_MID, C_LIGHT, C_PALE);
      }
      if (o2a > 0.01) {
        drawOrb(o2x, o2y, o2sx, o2sy, o2a, C_MID, C_LAV, C_PALE, C_PALE);
      }

      // ── Split flash (1.4–1.85s) — bright, professional ──
      if (t > 1.35 && t < 1.85) {
        const ft = clamp01((t - 1.35) / 0.5);
        // Sharp rise, exponential decay
        const fa = ft < 0.15 ? ft / 0.15 : Math.pow(1 - (ft - 0.15) / 0.85, 2.5);
        const intensity = 0.85 * fa * globalFade;

        ctx.globalCompositeOperation = "lighter";

        // Inner white core flash
        ctx.globalAlpha = intensity;
        const fc1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
        fc1.addColorStop(0, "rgba(255,255,255,1)");
        fc1.addColorStop(0.3, `rgba(${rgb(C_PALE)},0.9)`);
        fc1.addColorStop(0.7, `rgba(${rgb(C_LAV)},0.4)`);
        fc1.addColorStop(1, `rgba(${rgb(C_MID)},0)`);
        ctx.fillStyle = fc1;
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.fill();

        // Wide lavender bloom
        ctx.globalAlpha = intensity * 0.6;
        const fc2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
        fc2.addColorStop(0, `rgba(${rgb(C_PALE)},0.7)`);
        fc2.addColorStop(0.25, `rgba(${rgb(C_LAV)},0.35)`);
        fc2.addColorStop(0.5, `rgba(${rgb(C_MID)},0.12)`);
        fc2.addColorStop(1, `rgba(${rgb(C_DEEP)},0)`);
        ctx.fillStyle = fc2;
        ctx.beginPath();
        ctx.arc(cx, cy, 200, 0, Math.PI * 2);
        ctx.fill();

        // Extreme outer bloom
        ctx.globalAlpha = intensity * 0.25;
        const fc3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.4);
        fc3.addColorStop(0, `rgba(${rgb(C_LAV)},0.3)`);
        fc3.addColorStop(0.4, `rgba(${rgb(C_DEEP)},0.08)`);
        fc3.addColorStop(1, `rgba(${rgb(C_DEEP)},0)`);
        ctx.fillStyle = fc3;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(W, H) * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
      }

      // ── Divider line (3.0–4.0s) ──
      if (t > 2.8 && t < FADE_START + 0.2) {
        const lineIn = clamp01((t - 2.8) / 0.35);
        const lineOut = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;
        const lineH = 95 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = Math.min(1, lineIn * 2) * lineOut * globalFade;

        // Glow layer
        ctx.globalAlpha = lineAlpha * 0.6;
        ctx.shadowColor = `rgba(${rgb(C_LAV)},0.9)`;
        ctx.shadowBlur = 25;
        ctx.lineWidth = 1;

        const lg = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.08, `rgba(${rgb(C_PALE)},0.85)`);
        lg.addColorStop(0.3, `rgba(${rgb(C_LAV)},1)`);
        lg.addColorStop(0.5, `rgba(255,255,255,0.95)`);
        lg.addColorStop(0.7, `rgba(${rgb(C_LAV)},1)`);
        lg.addColorStop(0.92, `rgba(${rgb(C_PALE)},0.85)`);
        lg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = lg;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Ripple waves at split moment ──
      ctx.globalCompositeOperation = "lighter";
      for (let w = 0; w < 3; w++) {
        const ws = 1.55 + w * 0.1;
        if (t > ws && t < ws + 0.9) {
          const rt = (t - ws) / 0.9;
          const rr = easeOutExpo(rt) * Math.min(W, H) * 0.55;
          const ra = Math.max(0, (1 - rt * rt)) * (0.35 - w * 0.08) * globalFade;
          ctx.globalAlpha = ra;
          const colors = [C_PALE, C_LAV, C_MID];
          ctx.strokeStyle = `rgba(${rgb(colors[w])},0.9)`;
          ctx.lineWidth = 2.5 - w * 0.6;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Ambient orbs ──
      ctx.globalCompositeOperation = "lighter";
      if (t > 0.3 && t < FADE_START) {
        for (const ao of ambients) {
          const aIn = Math.min(1, (t - 0.3) / 0.5);
          const aOut = t > FADE_START - 0.5 ? clamp01((FADE_START - t) / 0.5 + 1) : 1;
          const angle = ao.baseAngle + t * ao.speed;
          const ax = cx + Math.cos(angle) * ao.dist;
          const ay = cy + Math.sin(angle) * ao.dist * 0.55;
          const aa = (0.06 + 0.04 * Math.sin(t * 1.8 + ao.baseAngle)) * aIn * globalFade;
          ctx.globalAlpha = aa;
          const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, ao.size * 3.5);
          ag.addColorStop(0, `rgba(${rgb(ao.c)},0.5)`);
          ag.addColorStop(0.5, `rgba(${rgb(ao.c)},0.12)`);
          ag.addColorStop(1, `rgba(${rgb(ao.c)},0)`);
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(ax, ay, ao.size * 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Vignette ──
      if (t > 0.1) {
        const va = Math.min(0.55, (t - 0.1) * 0.3) * (t < FADE_START ? 1 : globalFade);
        ctx.globalAlpha = va;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.12, cx, cy, Math.max(W, H) * 0.72);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(0.5, "rgba(0,0,0,0.2)");
        vg.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Final fade overlay (canvas-level, prevents any flash) ──
      if (t > FADE_START) {
        const fadeAlpha = clamp01((t - FADE_START) / (FADE_END - FADE_START));
        ctx.globalAlpha = fadeAlpha;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalAlpha = 1;

      // Done
      if (t >= FADE_END + 0.05) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        return;
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={ref} className="apple-splash-canvas" />;
}
