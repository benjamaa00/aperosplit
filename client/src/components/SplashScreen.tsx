import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 5400;
const FADE_START = 4.4;
const FADE_END = 5.4;

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandFading, setBrandFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 3200);
    const t2 = setTimeout(() => setBrandFading(true), FADE_START * 1000);
    const t3 = setTimeout(() => onCompleteRef.current(), SPLASH_DURATION + 100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="apple-splash" style={{ background: "#050505" }}>
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

    // ── Helpers ──
    function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function lerp(a: number, b: number, t: number) { return a + (b - a) * clamp01(t); }
    function easeOutCubic(t: number) { const c = 1 - t; return 1 - c * c * c; }
    function easeOutExpo(t: number) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function easeInOutCubic(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function smoothstep(a: number, b: number, t: number) { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); }
    function springClamp(t: number, damping: number, freq: number) {
      if (t <= 0) return 0; if (t >= 1) return 1;
      return 1 - Math.exp(-damping * t * 8) * Math.cos(freq * t * Math.PI * 2.5);
    }

    // ── Logo palette ──
    const LEFT = {
      deep:  [109, 74, 255],    // #6D4AFF — outer edge
      mid:   [138, 99, 255],    // #8A63FF — inner area
      light: [170, 145, 255],   // lighter violet
      pale:  [200, 185, 255],   // cold lavender highlight
    };
    const RIGHT = {
      deep:  [200, 190, 248],   // soft lavender — outer edge
      mid:   [222, 215, 252],   // lavender
      light: [240, 236, 255],   // cold white-violet
      pale:  [250, 248, 255],   // near-white
    };
    const rgb = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;
    function rgbMix(a: number[], b: number[], t: number) {
      return `${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)}`;
    }

    const R = 40;
    // 25% overlap: center distance = 2R * 0.75 = 60 → half = 30
    const LOGO_GAP = 30;

    // ── Particle pool ──
    const MAX_P = 400;
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

    function spawn(x: number, y: number, c: number[], count: number, spread = 14, speedMul = 1) {
      for (let i = 0; i < count && pCount < MAX_P; i++) {
        const idx = pCount;
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 1.2 + 0.2) * speedMul;
        pX[idx] = x + (Math.random() - 0.5) * 6;
        pY[idx] = y + (Math.random() - 0.5) * 6;
        pVX[idx] = Math.cos(angle) * speed;
        pVY[idx] = Math.sin(angle) * speed;
        pLife[idx] = 1;
        pMaxLife[idx] = 30 + Math.random() * 50;
        pSize[idx] = Math.random() * 2.5 + 0.5;
        const j = (Math.random() - 0.5) * spread;
        pCR[idx] = Math.min(255, Math.max(0, c[0] + j));
        pCG[idx] = Math.min(255, Math.max(0, c[1] + j * 0.7));
        pCB[idx] = Math.min(255, Math.max(180, c[2] + j * 0.5));
        pCount++;
      }
    }

    // ══════════════════════════════════════════════════════════════
    //  CHOREOGRAPHY (5.4s total)
    //
    //  0.00 – 0.70s   Single orb materializes from nothing
    //  0.70 – 1.20s   Orb breathes, energy builds
    //  1.20 – 1.65s   Orb stretches horizontally (pre-split)
    //  1.65 – 2.10s   MITOSIS — splits into two, bright flash
    //  2.10 – 2.60s   Two orbs drift apart
    //  2.60 – 3.30s   Orbs slide inward — 25% overlap
    //  3.30 – 3.80s   Logo hold: divider line, gentle breathing
    //  3.80 – 4.40s   Logo perfectly still (frozen)
    //  4.40 – 5.40s   Canvas fade to pure black
    // ══════════════════════════════════════════════════════════════

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      const globalFade = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      // ── Compute positions ──
      let o1x = cx, o1y = cy, o2x = cx, o2y = cy;
      let o1a = 0, o2a = 0, o1s = 0, o2s = 0;
      let stretchXS = 1, stretchYS = 1;

      if (t < 0.70) {
        const p = easeOutCubic(clamp01(t / 0.65));
        o1a = p; o1s = p; o2a = 0; o2s = 0;
        o1x = cx; o1y = cy;
      } else if (t < 1.20) {
        const bp = (t - 0.70) / 0.50;
        const breath = Math.sin(bp * Math.PI * 2.5) * 0.04;
        o1a = 1; o1s = 1 + breath; o2a = 0; o2s = 0;
        o1x = cx; o1y = cy;
      } else if (t < 1.65) {
        const sp = easeInOutCubic(clamp01((t - 1.20) / 0.45));
        o1a = 1; o1s = 1; o1x = cx; o1y = cy;
        o2a = 0; o2s = 0;
        stretchXS = 1 + sp * 0.45;
        stretchYS = 1 - sp * 0.12;
      } else if (t < 2.10) {
        const mp = clamp01((t - 1.65) / 0.40);
        const dist = easeOutCubic(mp) * 85;
        o1a = 1; o1s = 1;
        o2a = easeOutCubic(clamp01((t - 1.65) / 0.30));
        o2s = o2a;
        o1x = cx - dist; o1y = cy;
        o2x = cx + dist; o2y = cy;
      } else if (t < 2.60) {
        const dp = clamp01((t - 2.10) / 0.50);
        const drift = lerp(85, 90, easeOutCubic(dp));
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - drift; o1y = cy;
        o2x = cx + drift; o2y = cy;
      } else if (t < 3.30) {
        const rp = clamp01((t - 2.60) / 0.65);
        const rEase = springClamp(rp, 0.6, 2);
        const gap = lerp(90, LOGO_GAP, rEase);
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
      } else if (t < 3.80) {
        // Gentle breathing
        const hold = t - 3.30;
        const breath = Math.sin(hold * 1.8) * 0.6;
        const gap = LOGO_GAP + breath;
        const sp = 1 + Math.sin(hold * 2.2) * 0.006;
        o1a = 1; o1s = sp; o2a = 1; o2s = sp;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
      } else if (t < FADE_START) {
        // Perfectly still
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      } else {
        // Fade
        o1a = globalFade; o1s = 1; o2a = globalFade; o2s = 1;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      }

      // ── Particles ──
      if (t > 0.3 && t < 1.2 && Math.random() < 0.35) spawn(o1x, o1y, LEFT.pale, 1, 10);
      if (t > 0.9 && t < 1.65 && Math.random() < 0.5) {
        spawn(cx, cy, LEFT.mid, 1, 16);
        spawn(cx, cy, RIGHT.light, 1, 12);
      }
      if (t > 1.60 && t < 2.15) {
        const bP = clamp01((t - 1.60) / 0.12);
        const cnt = bP < 0.4 ? Math.floor(bP / 0.4 * 15) : Math.floor((1 - (bP - 0.4) / 0.6) * 15);
        spawn(cx, cy, [255, 255, 255], cnt, 40, 2);
        spawn(cx, cy, LEFT.light, Math.floor(cnt * 0.5), 30, 1.5);
      }
      if (t > 1.8 && t < 2.6 && Math.random() < 0.4) {
        spawn(o1x, o1y, LEFT.deep, 1, 12);
        spawn(o2x, o2y, RIGHT.deep, 1, 10);
      }
      if (t > 3.3 && t < FADE_START && Math.random() < 0.12) {
        spawn(o1x, o1y, LEFT.deep, 1, 5);
        spawn(o2x, o2y, RIGHT.deep, 1, 5);
      }

      // Update & draw particles
      ctx.globalCompositeOperation = "lighter";
      for (let i = pCount - 1; i >= 0; i--) {
        pX[i] += pVX[i]; pY[i] += pVY[i];
        pVX[i] *= 0.965; pVY[i] *= 0.965;
        pLife[i] -= 1 / pMaxLife[i];
        if (pLife[i] <= 0) {
          const last = pCount - 1;
          pX[i] = pX[last]; pY[i] = pY[last];
          pVX[i] = pVX[last]; pVY[i] = pVY[last];
          pLife[i] = pLife[last]; pMaxLife[i] = pMaxLife[last];
          pSize[i] = pSize[last];
          pCR[i] = pCR[last]; pCG[i] = pCG[last]; pCB[i] = pCB[last];
          pCount--;
          continue;
        }
        const life = pLife[i];
        ctx.globalAlpha = life * life * 0.7 * globalFade;
        ctx.fillStyle = `rgb(${pCR[i]},${pCG[i]},${pCB[i]})`;
        ctx.beginPath();
        ctx.arc(pX[i], pY[i], pSize[i] * life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // ════════════════════════════════════════════════════════
      //  OPTICAL GLASS SPHERE RENDERING
      //
      //  Uses additive blending for glows (merged halo effect)
      //  and screen-like layering for bodies (light transmission)
      // ════════════════════════════════════════════════════════

      const drawOpticalSphere = (
        ox: number, oy: number, scale: number, alpha: number,
        sx: number, sy: number,
        pal: { deep: number[]; mid: number[]; light: number[]; pale: number[] }
      ) => {
        if (alpha <= 0.01 || scale <= 0.01) return;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(sx * scale, sy * scale);

        const r = R;

        // ── LAYER 1: Volumetric glow (large, cinematic) ──
        // Light passes through glass and radiates outward
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.2;
        const vol = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 5);
        vol.addColorStop(0, `rgba(${rgb(pal.deep)},0.45)`);
        vol.addColorStop(0.12, `rgba(${rgb(pal.mid)},0.25)`);
        vol.addColorStop(0.3, `rgba(${rgb(pal.deep)},0.1)`);
        vol.addColorStop(0.55, `rgba(${rgb(pal.deep)},0.03)`);
        vol.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = vol;
        ctx.beginPath();
        ctx.arc(0, 0, r * 5, 0, Math.PI * 2);
        ctx.fill();

        // ── LAYER 2: Mid-range glow (frosted glass halo) ──
        ctx.globalAlpha = alpha * 0.38;
        const midGlow = ctx.createRadialGradient(0, -r * 0.04, r * 0.15, 0, 0, r * 2.4);
        midGlow.addColorStop(0, `rgba(${rgb(pal.light)},0.42)`);
        midGlow.addColorStop(0.25, `rgba(${rgb(pal.mid)},0.28)`);
        midGlow.addColorStop(0.55, `rgba(${rgb(pal.deep)},0.1)`);
        midGlow.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = midGlow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        // ── LAYER 3: Glass body (translucent, no outline) ──
        // Shape defined purely by gradient falloff — edge fades to transparent
        ctx.globalAlpha = alpha * 0.75;
        const body = ctx.createRadialGradient(-r * 0.08, -r * 0.08, 0, 0, 0, r);
        body.addColorStop(0, `rgba(${rgb(pal.pale)},0.92)`);
        body.addColorStop(0.12, `rgba(${rgb(pal.light)},0.88)`);
        body.addColorStop(0.3, `rgba(${rgb(pal.mid)},0.75)`);
        body.addColorStop(0.55, `rgba(${rgb(pal.deep)},0.5)`);
        body.addColorStop(0.78, `rgba(${rgb(pal.deep)},0.2)`);
        body.addColorStop(0.92, `rgba(${rgb(pal.deep)},0.06)`);
        body.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // ── LAYER 4: Subsurface scattering (warm inner light) ──
        ctx.globalAlpha = alpha * 0.15;
        const sss = ctx.createRadialGradient(r * 0.1, r * 0.12, 0, 0, 0, r * 0.85);
        sss.addColorStop(0, `rgba(${rgb(pal.light)},0.5)`);
        sss.addColorStop(0.4, `rgba(${rgb(pal.mid)},0.25)`);
        sss.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = sss;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // ── LAYER 5: Specular highlight (upper-left light source) ──
        ctx.globalAlpha = alpha * 0.5;
        const spec = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, -r * 0.18, -r * 0.22, r * 0.5);
        spec.addColorStop(0, "rgba(255,255,255,0.75)");
        spec.addColorStop(0.2, `rgba(${rgb(pal.pale)},0.4)`);
        spec.addColorStop(0.55, `rgba(${rgb(pal.light)},0.1)`);
        spec.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = spec;
        ctx.beginPath();
        ctx.arc(-r * 0.22, -r * 0.28, r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // ── LAYER 6: Rim light (very subtle edge definition) ──
        ctx.globalAlpha = alpha * 0.08;
        ctx.strokeStyle = `rgba(${rgb(pal.light)},0.35)`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      };

      // Draw both spheres
      drawOpticalSphere(o1x, o1y, o1s, o1a, stretchXS, stretchYS, LEFT);
      drawOpticalSphere(o2x, o2y, o2s, o2a, 1, 1, RIGHT);

      // ════════════════════════════════════════════════════════
      //  INTERSECTION — OPTICAL GLASS MERGE
      //
      //  Not alpha-blended. Simulates light passing through
      //  two overlapping glass spheres and mixing naturally.
      // ════════════════════════════════════════════════════════
      if (o1a > 0.4 && o2a > 0.4) {
        const halfDist = Math.abs(o2x - o1x) / 2;
        if (halfDist < R) {
          const overlapHalf = R - halfDist; // half-width of overlap zone
          const overlapRatio = overlapHalf / R; // 0 to 1
          if (overlapRatio > 0.05) {
            const intX = (o1x + o2x) / 2; // = cx
            const intY = cy;
            const blendA = Math.min(o1a, o2a) * globalFade;

            // ── 1. Merged glow halo around intersection ──
            // Larger and brighter than individual glows
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.25;
            const mergeGlow = ctx.createRadialGradient(intX, intY, 0, intX, intY, R * 3.5);
            mergeGlow.addColorStop(0, `rgba(230,222,255,0.5)`);
            mergeGlow.addColorStop(0.2, `rgba(210,200,255,0.3)`);
            mergeGlow.addColorStop(0.45, `rgba(${rgb(LEFT.mid)},0.12)`);
            mergeGlow.addColorStop(0.7, `rgba(${rgb(LEFT.deep)},0.04)`);
            mergeGlow.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
            ctx.fillStyle = mergeGlow;
            ctx.beginPath();
            ctx.arc(intX, intY, R * 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ── 2. Intersection body — optical material blend ──
            // Shape: lens-like (vesica piscis intersection)
            // Gradient: violet edges → luminous pastel lavender at center
            ctx.save();

            // Clip to the intersection zone (vesica piscis shape)
            ctx.beginPath();
            // Left circle arc
            ctx.arc(o1x, o1y, R, -Math.acos(clamp01(halfDist / R)), Math.acos(clamp01(halfDist / R)));
            // Right circle arc (reversed)
            ctx.arc(o2x, o2y, R, Math.PI - Math.acos(clamp01(halfDist / R)), Math.PI + Math.acos(clamp01(halfDist / R)));
            ctx.closePath();
            ctx.clip();

            // Fill the clipped intersection with a gradient:
            // from left (violet desaturating) → center (brightest pastel) → right (white-violet)
            const intGradW = overlapHalf * 2;
            const intGrad = ctx.createLinearGradient(intX - intGradW / 2, intY, intX + intGradW / 2, intY);

            // Left edge: violet mixing into the intersection
            intGrad.addColorStop(0, `rgba(${rgbMix(LEFT.mid, RIGHT.mid, 0.3)},0.65)`);
            // Left-center: desaturating violet, brightening
            intGrad.addColorStop(0.25, `rgba(${rgbMix(LEFT.mid, RIGHT.light, 0.5)},0.7)`);
            // Center: brightest point — luminous pastel lavender
            intGrad.addColorStop(0.5, `rgba(228,222,252,0.82)`);
            // Right-center: white-violet, still bright
            intGrad.addColorStop(0.75, `rgba(${rgbMix(RIGHT.light, LEFT.light, 0.4)},0.7)`);
            // Right edge: light lavender fading
            intGrad.addColorStop(1, `rgba(${rgbMix(RIGHT.mid, LEFT.mid, 0.3)},0.65)`);

            ctx.globalAlpha = blendA * 0.85;
            ctx.fillStyle = intGrad;
            ctx.fillRect(intX - intGradW / 2 - 5, intY - R, intGradW + 10, R * 2);

            // ── 3. Inner luminosity — brightest at center ──
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.6;
            const innerLum = ctx.createRadialGradient(intX, intY, 0, intX, intY, overlapHalf * 1.2);
            innerLum.addColorStop(0, "rgba(242,238,255,0.8)");
            innerLum.addColorStop(0.35, "rgba(225,218,252,0.45)");
            innerLum.addColorStop(0.7, `rgba(${rgb(LEFT.mid)},0.12)`);
            innerLum.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
            ctx.fillStyle = innerLum;
            ctx.beginPath();
            ctx.arc(intX, intY, overlapHalf * 1.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // ── Split flash (1.55–2.0s) ──
      if (t > 1.55 && t < 2.05) {
        const ft = clamp01((t - 1.55) / 0.50);
        const fa = ft < 0.1 ? ft / 0.1 : Math.pow(1 - (ft - 0.1) / 0.9, 3);
        const intensity = 0.75 * fa * globalFade;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        ctx.globalAlpha = intensity;
        const fc1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55);
        fc1.addColorStop(0, "rgba(255,255,255,1)");
        fc1.addColorStop(0.25, "rgba(240,235,255,0.9)");
        fc1.addColorStop(0.6, `rgba(${rgb(LEFT.mid)},0.35)`);
        fc1.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
        ctx.fillStyle = fc1;
        ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = intensity * 0.45;
        const fc2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
        fc2.addColorStop(0, "rgba(220,215,255,0.5)");
        fc2.addColorStop(0.3, `rgba(${rgb(LEFT.mid)},0.2)`);
        fc2.addColorStop(0.6, `rgba(${rgb(LEFT.deep)},0.06)`);
        fc2.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
        ctx.fillStyle = fc2;
        ctx.beginPath(); ctx.arc(cx, cy, 220, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = intensity * 0.18;
        const fc3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.35);
        fc3.addColorStop(0, `rgba(${rgb(LEFT.light)},0.2)`);
        fc3.addColorStop(0.5, `rgba(${rgb(LEFT.deep)},0.04)`);
        fc3.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
        ctx.fillStyle = fc3;
        ctx.beginPath(); ctx.arc(cx, cy, Math.min(W, H) * 0.35, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }

      // ── Ripple waves at split ──
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let w = 0; w < 3; w++) {
        const ws = 1.70 + w * 0.08;
        if (t > ws && t < ws + 0.85) {
          const rt = (t - ws) / 0.85;
          const rr = easeOutExpo(rt) * Math.min(W, H) * 0.5;
          const ra = (1 - rt * rt) * (0.3 - w * 0.07) * globalFade;
          ctx.globalAlpha = ra;
          const rcolors = [RIGHT.pale, LEFT.light, LEFT.mid];
          ctx.strokeStyle = `rgba(${rgb(rcolors[w])},0.8)`;
          ctx.lineWidth = 2 - w * 0.4;
          ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();

      // ════════════════════════════════════════════════════════
      //  DIVIDER LINE — razor-thin, luminous, axis of symmetry
      // ════════════════════════════════════════════════════════
      if (t > 3.0 && t < FADE_START + 0.1) {
        const lineIn = smoothstep(3.0, 3.5, t);
        const lineOut = t > FADE_START ? smoothstep(FADE_END, FADE_START, t) : 1;
        const lineH = 110 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = lineIn * lineOut * globalFade;

        ctx.save();

        // Outer glow layer (wider, softer)
        ctx.globalAlpha = lineAlpha * 0.3;
        ctx.shadowColor = "rgba(210,205,255,0.6)";
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2;
        const glowLine = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        glowLine.addColorStop(0, "rgba(255,255,255,0)");
        glowLine.addColorStop(0.08, "rgba(230,225,255,0.5)");
        glowLine.addColorStop(0.5, "rgba(255,255,255,0.7)");
        glowLine.addColorStop(0.92, "rgba(230,225,255,0.5)");
        glowLine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = glowLine;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        // Core razor line (1px, bright)
        ctx.shadowBlur = 0;
        ctx.globalAlpha = lineAlpha * 0.9;
        ctx.lineWidth = 1;
        const coreLine = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        coreLine.addColorStop(0, "rgba(255,255,255,0)");
        coreLine.addColorStop(0.05, "rgba(245,242,255,0.85)");
        coreLine.addColorStop(0.15, "rgba(255,255,255,1)");
        coreLine.addColorStop(0.5, "rgba(255,255,255,1)");
        coreLine.addColorStop(0.85, "rgba(255,255,255,1)");
        coreLine.addColorStop(0.95, "rgba(245,242,255,0.85)");
        coreLine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = coreLine;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        ctx.restore();
      }

      // ── Ambient floating orbs ──
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      if (t > 0.4 && t < FADE_START) {
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2 + t * (0.12 + i * 0.03);
          const dist = 55 + i * 12 + Math.sin(t * 0.8 + i) * 8;
          const ax = cx + Math.cos(angle) * dist;
          const ay = cy + Math.sin(angle) * dist * 0.5;
          const aIn = Math.min(1, (t - 0.4) / 0.6);
          const aOut = t > FADE_START - 0.4 ? clamp01((FADE_START - t) / 0.4) : 1;
          const aa = (0.05 + 0.03 * Math.sin(t * 1.5 + i * 1.3)) * aIn * aOut * globalFade;
          if (aa < 0.005) continue;
          ctx.globalAlpha = aa;
          const sz = 1.5 + (i % 3) * 0.8;
          const ac = i % 2 === 0 ? LEFT.deep : RIGHT.deep;
          const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, sz * 4);
          ag.addColorStop(0, `rgba(${rgb(ac)},0.5)`);
          ag.addColorStop(0.5, `rgba(${rgb(ac)},0.12)`);
          ag.addColorStop(1, `rgba(${rgb(ac)},0)`);
          ctx.fillStyle = ag;
          ctx.beginPath(); ctx.arc(ax, ay, sz * 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();

      // ── Vignette ──
      if (t > 0.15) {
        const va = Math.min(0.5, (t - 0.15) * 0.25) * (t < FADE_START ? 1 : globalFade);
        ctx.globalAlpha = va;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.1, cx, cy, Math.max(W, H) * 0.7);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(0.5, "rgba(0,0,0,0.15)");
        vg.addColorStop(1, "rgba(0,0,0,0.65)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Final fade overlay ──
      if (t > FADE_START) {
        ctx.globalAlpha = clamp01((t - FADE_START) / (FADE_END - FADE_START));
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalAlpha = 1;

      if (t >= FADE_END + 0.05) {
        ctx.fillStyle = "#050505";
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
