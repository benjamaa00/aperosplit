import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 5200;
const FADE_START = 4.2;
const FADE_END = 5.2;

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [brandVisible, setBrandVisible] = useState(false);
  const [brandFading, setBrandFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setBrandVisible(true), 3000);
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

    // Spring with clamped output (never overshoots past target for position)
    function springClamp(t: number, damping: number, freq: number) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return 1 - Math.exp(-damping * t * 8) * Math.cos(freq * t * Math.PI * 2.5);
    }

    // ── Logo colors ──
    // Left sphere: deep electric violet → luminous violet
    const LEFT = {
      core:   [109, 74, 255],    // #6D4AFF
      mid:    [138, 99, 255],    // #8A63FF
      light:  [165, 135, 255],   // lighter violet
      pale:   [200, 185, 255],   // cold lavender highlight
    };
    // Right sphere: iced white → lavender → very pale violet (much lighter)
    const RIGHT = {
      core:   [210, 200, 250],   // very pale violet
      mid:    [225, 218, 255],   // lavender-white
      light:  [240, 236, 255],   // iced white
      pale:   [252, 250, 255],   // near-white
    };
    const rgb = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;

    const R = 38;
    // 20% overlap: center distance = 2R * 0.8 = 60.8
    const LOGO_GAP = 61;

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
    //  CHOREOGRAPHY (5.2s total)
    //
    //  0.00 – 0.70s   Single orb materializes from nothing
    //  0.70 – 1.20s   Orb breathes, energy builds
    //  1.20 – 1.65s   Orb stretches horizontally (pre-split)
    //  1.65 – 2.10s   MITOSIS — splits into two, bright flash
    //  2.10 – 2.60s   Two orbs drift apart
    //  2.60 – 3.30s   One orb slides 20% inward (overlap formation)
    //  3.30 – 4.20s   Logo holds: divider line, glassmorphism breathing
    //  4.20 – 5.20s   Canvas fade to pure black
    // ══════════════════════════════════════════════════════════════

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      const globalFade = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;

      // ── Clear ──
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, W, H);

      // ── Compute positions ──
      let o1x = cx, o1y = cy;
      let o2x = cx, o2y = cy;
      let o1a = 0, o2a = 0;
      let o1s = 0, o2s = 0;
      let stretchXS = 1, stretchYS = 1;

      if (t < 0.70) {
        // Phase 0: Single orb appears
        const p = easeOutCubic(clamp01(t / 0.65));
        o1a = p;
        o1s = p;
        o2a = 0;
        o2s = 0;
        o1x = cx; o1y = cy;
      } else if (t < 1.20) {
        // Phase 1: Breathing
        const bp = (t - 0.70) / 0.50;
        const breath = Math.sin(bp * Math.PI * 2.5) * 0.04;
        o1a = 1; o1s = 1 + breath;
        o2a = 0; o2s = 0;
        o1x = cx; o1y = cy;
      } else if (t < 1.65) {
        // Phase 2: Stretch horizontally
        const sp = easeInOutCubic(clamp01((t - 1.20) / 0.45));
        o1a = 1;
        o1s = 1;
        o1x = cx; o1y = cy;
        o2a = 0; o2s = 0;
        stretchXS = 1 + sp * 0.45;
        stretchYS = 1 - sp * 0.12;
      } else if (t < 2.10) {
        // Phase 3: MITOSIS — split
        const mp = clamp01((t - 1.65) / 0.40);
        const splitEase = easeOutCubic(mp);
        const dist = splitEase * 85;
        o1a = 1; o1s = 1;
        o2a = easeOutCubic(clamp01((t - 1.65) / 0.30)); // orb2 fades in quickly
        o2s = o2a;
        o1x = cx - dist; o1y = cy;
        o2x = cx + dist; o2y = cy;
      } else if (t < 2.60) {
        // Phase 4: Drift apart slightly more
        const dp = clamp01((t - 2.10) / 0.50);
        const drift = lerp(85, 95, easeOutCubic(dp));
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - drift; o1y = cy;
        o2x = cx + drift; o2y = cy;
      } else if (t < 3.30) {
        // Phase 5: One orb slides inward — 20% overlap
        const rp = clamp01((t - 2.60) / 0.65);
        const rEase = springClamp(rp, 0.6, 2);
        const gap = lerp(95, LOGO_GAP, rEase);
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
      } else if (t < FADE_START) {
        // Phase 6: Logo hold with subtle breathing
        const hold = t - 3.30;
        const breath = Math.sin(hold * 1.8) * 0.8;
        const gap = LOGO_GAP + breath;
        const scalePulse = 1 + Math.sin(hold * 2.2) * 0.008;
        o1a = 1; o1s = scalePulse; o2a = 1; o2s = scalePulse;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
      } else {
        // Phase 7: Fade
        const gap = LOGO_GAP;
        o1a = globalFade; o1s = 1; o2a = globalFade; o2s = 1;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
      }

      // ── Particles ──
      // Ambient during single orb
      if (t > 0.3 && t < 1.2 && Math.random() < 0.35) {
        spawn(o1x, o1y, LEFT.pale, 1, 10);
      }
      // Energy build before split
      if (t > 0.9 && t < 1.65 && Math.random() < 0.5) {
        spawn(cx, cy, LEFT.mid, 1, 16);
        spawn(cx, cy, RIGHT.light, 1, 12);
      }
      // Split burst
      if (t > 1.60 && t < 2.15) {
        const bProgress = clamp01((t - 1.60) / 0.12);
        const count = bProgress < 0.4 ? Math.floor(bProgress / 0.4 * 15) : Math.floor((1 - (bProgress - 0.4) / 0.6) * 15);
        spawn(cx, cy, [255, 255, 255], count, 40, 2);
        spawn(cx, cy, LEFT.light, Math.floor(count * 0.5), 30, 1.5);
      }
      // During motion
      if (t > 1.8 && t < 2.6 && Math.random() < 0.4) {
        spawn(o1x, o1y, LEFT.core, 1, 12);
        spawn(o2x, o2y, RIGHT.core, 1, 10);
      }
      // Gentle during hold
      if (t > 3.3 && t < FADE_START && Math.random() < 0.15) {
        spawn(o1x, o1y, LEFT.core, 1, 6);
        spawn(o2x, o2y, RIGHT.core, 1, 6);
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

      // ── Draw glassmorphism orb ──
      const drawGlassOrb = (
        ox: number, oy: number, scale: number, alpha: number,
        sx: number, sy: number,
        palette: { core: number[]; mid: number[]; light: number[]; pale: number[] }
      ) => {
        if (alpha <= 0.01 || scale <= 0.01) return;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(sx * scale, sy * scale);

        const r = R;

        // Layer 1: Large diffuse glow (halo in the black void)
        ctx.globalAlpha = alpha * 0.22;
        const halo = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * 6);
        halo.addColorStop(0, `rgba(${rgb(palette.core)},0.35)`);
        halo.addColorStop(0.2, `rgba(${rgb(palette.core)},0.18)`);
        halo.addColorStop(0.5, `rgba(${rgb(palette.mid)},0.06)`);
        halo.addColorStop(1, `rgba(${rgb(palette.core)},0)`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, r * 6, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Mid glow (frosted glass halo)
        ctx.globalAlpha = alpha * 0.4;
        const midGlow = ctx.createRadialGradient(0, -r * 0.05, 0, 0, 0, r * 2.5);
        midGlow.addColorStop(0, `rgba(${rgb(palette.light)},0.45)`);
        midGlow.addColorStop(0.25, `rgba(${rgb(palette.mid)},0.3)`);
        midGlow.addColorStop(0.6, `rgba(${rgb(palette.core)},0.1)`);
        midGlow.addColorStop(1, `rgba(${rgb(palette.core)},0)`);
        ctx.fillStyle = midGlow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Core sphere (glassmorphism body)
        ctx.globalAlpha = alpha * 0.85;
        const core = ctx.createRadialGradient(-r * 0.08, -r * 0.1, 0, 0, 0, r);
        core.addColorStop(0, `rgba(${rgb(palette.pale)},0.95)`);
        core.addColorStop(0.12, `rgba(${rgb(palette.light)},0.9)`);
        core.addColorStop(0.3, `rgba(${rgb(palette.mid)},0.82)`);
        core.addColorStop(0.55, `rgba(${rgb(palette.core)},0.7)`);
        core.addColorStop(0.8, `rgba(${rgb(palette.core.map(c => Math.floor(c * 0.6)))},0.5)`);
        core.addColorStop(1, `rgba(${rgb(palette.core.map(c => Math.floor(c * 0.35)))},0.3)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: Inner translucent rim (glass edge — no visible outline)
        ctx.globalAlpha = alpha * 0.15;
        ctx.strokeStyle = `rgba(${rgb(palette.light)},0.4)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Layer 5: Top-left specular highlight (light source from upper left)
        ctx.globalAlpha = alpha * 0.55;
        const spec = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, -r * 0.18, -r * 0.22, r * 0.48);
        spec.addColorStop(0, `rgba(255,255,255,0.8)`);
        spec.addColorStop(0.25, `rgba(${rgb(palette.pale)},0.4)`);
        spec.addColorStop(0.6, `rgba(${rgb(palette.light)},0.1)`);
        spec.addColorStop(1, `rgba(${rgb(palette.core)},0)`);
        ctx.fillStyle = spec;
        ctx.beginPath();
        ctx.arc(-r * 0.22, -r * 0.28, r * 0.48, 0, Math.PI * 2);
        ctx.fill();

        // Layer 6: Soft bottom shadow (subtle depth)
        ctx.globalAlpha = alpha * 0.12;
        const shadow = ctx.createRadialGradient(0, r * 0.15, r * 0.3, 0, r * 0.2, r * 1.1);
        shadow.addColorStop(0, `rgba(${rgb(palette.core.map(c => Math.floor(c * 0.3)))},0.3)`);
        shadow.addColorStop(1, `rgba(${rgb(palette.core.map(c => Math.floor(c * 0.15)))},0)`);
        ctx.fillStyle = shadow;
        ctx.beginPath();
        ctx.arc(0, r * 0.15, r * 1.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      // Draw orb 1 (left — deep violet)
      drawGlassOrb(o1x, o1y, o1s, o1a, stretchXS, stretchYS, LEFT);
      // Draw orb 2 (right — pale crystal)
      drawGlassOrb(o2x, o2y, o2s, o2a, 1, 1, RIGHT);

      // ── Intersection glow (overlap zone — brighter mix) ──
      if (o1a > 0.5 && o2a > 0.5) {
        const overlapDist = Math.abs(o2x - o1x);
        const maxDist = 2 * R;
        if (overlapDist < maxDist) {
          const overlapAmount = 1 - overlapDist / maxDist; // 0 to 1
          if (overlapAmount > 0.05) {
            const intX = (o1x + o2x) / 2;
            const intY = cy;
            const intR = R * 0.8 * overlapAmount;

            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = overlapAmount * 0.5 * Math.min(o1a, o2a) * globalFade;

            const intG = ctx.createRadialGradient(intX, intY, 0, intX, intY, intR);
            intG.addColorStop(0, `rgba(235,228,255,0.7)`);
            intG.addColorStop(0.3, `rgba(210,200,255,0.4)`);
            intG.addColorStop(0.7, `rgba(${rgb(LEFT.mid)},0.15)`);
            intG.addColorStop(1, `rgba(${rgb(LEFT.core)},0)`);
            ctx.fillStyle = intG;
            ctx.beginPath();
            ctx.arc(intX, intY, intR, 0, Math.PI * 2);
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

        // Core white flash
        ctx.globalAlpha = intensity;
        const fc1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 55);
        fc1.addColorStop(0, "rgba(255,255,255,1)");
        fc1.addColorStop(0.25, `rgba(240,235,255,0.9)`);
        fc1.addColorStop(0.6, `rgba(${rgb(LEFT.mid)},0.35)`);
        fc1.addColorStop(1, `rgba(${rgb(LEFT.core)},0)`);
        ctx.fillStyle = fc1;
        ctx.beginPath();
        ctx.arc(cx, cy, 55, 0, Math.PI * 2);
        ctx.fill();

        // Wide bloom
        ctx.globalAlpha = intensity * 0.45;
        const fc2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
        fc2.addColorStop(0, `rgba(220,215,255,0.5)`);
        fc2.addColorStop(0.3, `rgba(${rgb(LEFT.mid)},0.2)`);
        fc2.addColorStop(0.6, `rgba(${rgb(LEFT.core)},0.06)`);
        fc2.addColorStop(1, `rgba(${rgb(LEFT.core)},0)`);
        ctx.fillStyle = fc2;
        ctx.beginPath();
        ctx.arc(cx, cy, 220, 0, Math.PI * 2);
        ctx.fill();

        // Extreme outer
        ctx.globalAlpha = intensity * 0.18;
        const fc3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.35);
        fc3.addColorStop(0, `rgba(${rgb(LEFT.light)},0.2)`);
        fc3.addColorStop(0.5, `rgba(${rgb(LEFT.core)},0.04)`);
        fc3.addColorStop(1, `rgba(${rgb(LEFT.core)},0)`);
        ctx.fillStyle = fc3;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(W, H) * 0.35, 0, Math.PI * 2);
        ctx.fill();

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
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ── Divider line (appears during hold) ──
      if (t > 3.0 && t < FADE_START + 0.1) {
        const lineIn = smoothstep(3.0, 3.45, t);
        const lineOut = t > FADE_START ? smoothstep(FADE_END, FADE_START, t) : 1;
        const lineH = 100 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = lineIn * lineOut * globalFade;

        ctx.save();

        // Soft glow behind line
        ctx.globalAlpha = lineAlpha * 0.4;
        ctx.shadowColor = "rgba(200,195,255,0.7)";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 1;

        const lg = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.06, "rgba(240,236,255,0.8)");
        lg.addColorStop(0.2, "rgba(225,218,255,0.95)");
        lg.addColorStop(0.5, "rgba(255,255,255,1)");
        lg.addColorStop(0.8, "rgba(225,218,255,0.95)");
        lg.addColorStop(0.94, "rgba(240,236,255,0.8)");
        lg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = lg;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
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
          const ac = i % 2 === 0 ? LEFT.core : RIGHT.core;
          const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, sz * 4);
          ag.addColorStop(0, `rgba(${rgb(ac)},0.5)`);
          ag.addColorStop(0.5, `rgba(${rgb(ac)},0.12)`);
          ag.addColorStop(1, `rgba(${rgb(ac)},0)`);
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(ax, ay, sz * 4, 0, Math.PI * 2);
          ctx.fill();
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

      // ── Final fade overlay (canvas-level, no CSS flash) ──
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
