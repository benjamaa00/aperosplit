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
    <div className="apple-splash" style={{ background: "#050507" }}>
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

    const rgb = (c: number[]) => `${c[0]},${c[1]},${c[2]}`;
    function rgbMix(a: number[], b: number[], t: number) {
      return `${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)}`;
    }

    // ── Logo palette — premium, well-edited luminosity ──
    const LEFT = {
      body0: [162, 122, 255],   // center — bright luminous violet
      body1: [134, 85, 255],    // 32% — rich violet
      body2: [112, 62, 248],    // 68% — deep saturated
      body3: [95, 48, 230],     // 88% — edge approach
      edge:  [120, 90, 255],    // 100% — edge fade
      deep:  [88, 44, 228],     // glow deep
      mid:   [120, 78, 252],    // glow mid
      light: [150, 115, 255],   // highlight — luminous
      pale:  [192, 175, 255],   // pale lavender
    };
    const RIGHT = {
      body0: [248, 245, 255],   // center — clean lavender-white
      body1: [238, 233, 255],   // 34% — bright
      body2: [220, 210, 255],   // 67% — warm lavender
      body3: [198, 185, 250],   // 88% — edge approach
      edge:  [208, 196, 255],   // 100% — edge fade
      deep:  [185, 168, 245],   // glow deep
      mid:   [218, 210, 255],   // glow mid
      light: [235, 230, 255],   // highlight
      pale:  [250, 248, 255],   // near-white
    };

    const R = 40;
    const LOGO_GAP = 30;

    // ── Background gradient (spec §2) ──
    function drawBackground(alpha: number) {
      // Base fill
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "source-over";
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
      bg.addColorStop(0, "#0B0B12");
      bg.addColorStop(0.35, "#090910");
      bg.addColorStop(0.65, "#070709");
      bg.addColorStop(1, "#050507");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // ══════════════════════════════════════════════════════════════
    //  CHOREOGRAPHY (5.4s total)
    //
    //  0.00 – 0.70s   Single orb materializes
    //  0.70 – 1.20s   Orb breathes, energy builds
    //  1.20 – 1.65s   Orb stretches horizontally (pre-split)
    //  1.65 – 2.10s   MITOSIS — splits into two, bright flash
    //  2.10 – 2.60s   Two orbs drift apart
    //  2.60 – 3.30s   Orbs slide inward — 25% overlap
    //  3.30 – 3.80s   Logo hold: divider line, gentle breathing
    //  3.80 – 4.40s   Logo perfectly still (frozen)
    //  4.40 – 5.40s   Canvas fade to dark
    // ══════════════════════════════════════════════════════════════

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      const globalFade = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;

      drawBackground(globalFade);

      // ── Compute positions ──
      let o1x = cx, o1y = cy, o2x = cx, o2y = cy;
      let o1a = 0, o2a = 0, o1s = 0, o2s = 0;
      let stretchXS = 1, stretchYS = 1;

      if (t < 0.70) {
        const p = easeOutCubic(clamp01(t / 0.65));
        o1a = p; o1s = p; o2a = 0; o2s = 0;
      } else if (t < 1.20) {
        const bp = (t - 0.70) / 0.50;
        const breath = Math.sin(bp * Math.PI * 2.5) * 0.04;
        o1a = 1; o1s = 1 + breath; o2a = 0; o2s = 0;
      } else if (t < 1.65) {
        const sp = easeInOutCubic(clamp01((t - 1.20) / 0.45));
        o1a = 1; o1s = 1;
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
        const hold = t - 3.30;
        const sp = 1 + Math.sin(hold * 2.2) * 0.015;
        o1a = 1; o1s = sp; o2a = 1; o2s = sp;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      } else if (t < FADE_START) {
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      } else {
        o1a = globalFade; o1s = 1; o2a = globalFade; o2s = 1;
        o1x = cx - LOGO_GAP; o1y = cy;
        o2x = cx + LOGO_GAP; o2y = cy;
      }

      // ══════════════════════════════════════════════════════════════
      //  SPHERE RENDERING — Premium optical glass (spec §5, §6, §7, §8, §10, §11)
      //
      //  No particles, no small specular dots, no texture noise.
      //  Large diffused highlights only. Clean anti-aliased edges.
      // ══════════════════════════════════════════════════════════════

      const drawSphere = (
        ox: number, oy: number, scale: number, alpha: number,
        sx: number, sy: number,
        pal: typeof LEFT
      ) => {
        if (alpha <= 0.01 || scale <= 0.01) return;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(sx * scale, sy * scale);

        // ── GLOW ZONE A: Close glow — rich, luminous ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.26;
        const closeGlow = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, r * 1.12);
        closeGlow.addColorStop(0, `rgba(${rgb(pal.mid)},0.40)`);
        closeGlow.addColorStop(0.5, `rgba(${rgb(pal.deep)},0.14)`);
        closeGlow.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = closeGlow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.12, 0, Math.PI * 2);
        ctx.fill();

        // ── GLOW ZONE B: Medium glow — soft atmospheric ──
        ctx.globalAlpha = alpha * 0.12;
        const midGlow = ctx.createRadialGradient(0, 0, r * 0.75, 0, 0, r * 1.5);
        midGlow.addColorStop(0, `rgba(${rgb(pal.mid)},0.20)`);
        midGlow.addColorStop(0.5, `rgba(${rgb(pal.deep)},0.07)`);
        midGlow.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = midGlow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        // ── GLASS BODY — premium multi-stop radial ──
        ctx.globalAlpha = alpha;
        const body = ctx.createRadialGradient(
          -r * 0.06, -r * 0.06, 0,
          0, 0, r
        );
        body.addColorStop(0, `rgba(${rgb(pal.body0)},0.97)`);
        body.addColorStop(0.25, `rgba(${rgb(pal.body1)},0.95)`);
        body.addColorStop(0.50, `rgba(${rgb(pal.body2)},0.93)`);
        body.addColorStop(0.75, `rgba(${rgb(pal.body3)},0.85)`);
        body.addColorStop(0.90, `rgba(${rgb(pal.edge)},0.45)`);
        body.addColorStop(1, `rgba(${rgb(pal.edge)},0.08)`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // ── BROAD DIFFUSED HIGHLIGHT — large, luminous, upper-left ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.42;
        const diffusedHL = ctx.createRadialGradient(
          -r * 0.26, -r * 0.30, 0,
          -r * 0.14, -r * 0.16, r * 0.45
        );
        diffusedHL.addColorStop(0, "rgba(255,255,255,0.45)");
        diffusedHL.addColorStop(0.25, `rgba(${rgb(pal.pale)},0.26)`);
        diffusedHL.addColorStop(0.55, `rgba(${rgb(pal.light)},0.08)`);
        diffusedHL.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = diffusedHL;
        ctx.beginPath();
        ctx.arc(-r * 0.18, -r * 0.20, r * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // ── LOWER SUBSURFACE LIFT — warm inner glow ──
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.14;
        const sss = ctx.createRadialGradient(
          r * 0.10, r * 0.12, 0,
          r * 0.06, r * 0.08, r * 0.52
        );
        sss.addColorStop(0, `rgba(${rgb(pal.pale)},0.35)`);
        sss.addColorStop(0.45, `rgba(${rgb(pal.light)},0.12)`);
        sss.addColorStop(1, `rgba(${rgb(pal.deep)},0)`);
        ctx.fillStyle = sss;
        ctx.beginPath();
        ctx.arc(r * 0.06, r * 0.08, r * 0.52, 0, Math.PI * 2);
        ctx.fill();

        // ── RIM LIGHT — minimal, 0.5-0.8px, 6-10% opacity (spec §8) ──
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = alpha * 0.07;
        ctx.strokeStyle = `rgba(${rgb(pal.pale)},0.25)`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      };

      const r = R;

      // Draw spheres
      drawSphere(o1x, o1y, o1s, o1a, stretchXS, stretchYS, LEFT);
      drawSphere(o2x, o2y, o2s, o2a, 1, 1, RIGHT);

      // ══════════════════════════════════════════════════════════════
      //  AMBIENT BACKGROUND GLOW — subtle atmospheric depth (spec §2, §14)
      // ══════════════════════════════════════════════════════════════
      if (o1a > 0.3 || o2a > 0.3) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(o1a, o2a) * 0.08 * globalFade;
        const atmoGlow = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 3.5);
        atmoGlow.addColorStop(0, `rgba(130,100,240,0.18)`);
        atmoGlow.addColorStop(0.4, `rgba(100,70,220,0.06)`);
        atmoGlow.addColorStop(1, `rgba(80,50,200,0)`);
        ctx.fillStyle = atmoGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ══════════════════════════════════════════════════════════════
      //  INTERSECTION — vesica piscis, wide soft lavender (spec §9)
      // ══════════════════════════════════════════════════════════════
      if (o1a > 0.4 && o2a > 0.4) {
        const halfDist = Math.abs(o2x - o1x) / 2;
        if (halfDist < R) {
          const overlapHalf = R - halfDist;
          const overlapRatio = overlapHalf / R;
          if (overlapRatio > 0.05) {
            const intX = (o1x + o2x) / 2;
            const intY = cy;
            const blendA = Math.min(o1a, o2a) * globalFade;

            // ── Merged glow around intersection — violet-dominant ──
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.26;
            const mergeGlow = ctx.createRadialGradient(intX, intY, 0, intX, intY, R * 3.5);
            mergeGlow.addColorStop(0, `rgba(190,165,255,0.48)`);
            mergeGlow.addColorStop(0.2, `rgba(160,130,255,0.28)`);
            mergeGlow.addColorStop(0.45, `rgba(${rgb(LEFT.mid)},0.12)`);
            mergeGlow.addColorStop(0.7, `rgba(${rgb(LEFT.deep)},0.04)`);
            mergeGlow.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
            ctx.fillStyle = mergeGlow;
            ctx.beginPath();
            ctx.arc(intX, intY, R * 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // ── Intersection body — vesica piscis clip, violet-dominant ──
            ctx.save();
            ctx.beginPath();
            ctx.arc(o1x, o1y, R, -Math.acos(clamp01(halfDist / R)), Math.acos(clamp01(halfDist / R)));
            ctx.arc(o2x, o2y, R, Math.PI - Math.acos(clamp01(halfDist / R)), Math.PI + Math.acos(clamp01(halfDist / R)));
            ctx.closePath();
            ctx.clip();

            // Horizontal optical gradient — violet dominates center
            const intGradW = overlapHalf * 2;
            const intGrad = ctx.createLinearGradient(intX - intGradW / 2, intY, intX + intGradW / 2, intY);
            intGrad.addColorStop(0, "rgba(158,130,255,0.72)");
            intGrad.addColorStop(0.2, "rgba(175,150,255,0.78)");
            intGrad.addColorStop(0.4, "rgba(192,168,255,0.82)");
            intGrad.addColorStop(0.55, "rgba(205,185,255,0.80)");
            intGrad.addColorStop(0.75, "rgba(215,205,255,0.76)");
            intGrad.addColorStop(1, "rgba(210,198,255,0.72)");

            ctx.globalAlpha = blendA * 0.88;
            ctx.fillStyle = intGrad;
            ctx.fillRect(intX - intGradW / 2 - 5, intY - R, intGradW + 10, R * 2);

            // ── Inner luminosity — violet-core, not white ──
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.52;
            const innerLum = ctx.createRadialGradient(intX, intY, 0, intX, intY, overlapHalf * 1.2);
            innerLum.addColorStop(0, "rgba(210,195,255,0.70)");
            innerLum.addColorStop(0.3, "rgba(185,165,255,0.38)");
            innerLum.addColorStop(0.65, `rgba(${rgb(LEFT.mid)},0.10)`);
            innerLum.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
            ctx.fillStyle = innerLum;
            ctx.beginPath();
            ctx.arc(intX, intY, overlapHalf * 1.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // ── Split flash (1.55–2.0s) — subtle, not particle-based ──
      if (t > 1.55 && t < 2.05) {
        const ft = clamp01((t - 1.55) / 0.50);
        const fa = ft < 0.1 ? ft / 0.1 : Math.pow(1 - (ft - 0.1) / 0.9, 3);
        const intensity = 0.65 * fa * globalFade;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        ctx.globalAlpha = intensity;
        const fc1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
        fc1.addColorStop(0, "rgba(255,255,255,0.85)");
        fc1.addColorStop(0.3, "rgba(240,235,255,0.5)");
        fc1.addColorStop(0.65, `rgba(${rgb(LEFT.mid)},0.15)`);
        fc1.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
        ctx.fillStyle = fc1;
        ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = intensity * 0.35;
        const fc2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180);
        fc2.addColorStop(0, "rgba(220,215,255,0.3)");
        fc2.addColorStop(0.4, `rgba(${rgb(LEFT.mid)},0.10)`);
        fc2.addColorStop(1, `rgba(${rgb(LEFT.deep)},0)`);
        ctx.fillStyle = fc2;
        ctx.beginPath(); ctx.arc(cx, cy, 180, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }

      // ══════════════════════════════════════════════════════════════
      //  DIVIDER LINE — thin, elegant, not dominant (spec §12)
      // ══════════════════════════════════════════════════════════════
      if (t > 3.0 && t < FADE_START + 0.1) {
        const lineIn = smoothstep(3.0, 3.5, t);
        const lineOut = t > FADE_START ? smoothstep(FADE_END, FADE_START, t) : 1;
        const lineH = 100 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = lineIn * lineOut * globalFade;

        ctx.save();

        // Outer glow — 2px, 14-20% opacity (spec §12)
        ctx.globalAlpha = lineAlpha * 0.16;
        ctx.shadowColor = "rgba(210,205,255,0.4)";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        const glowLine = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        glowLine.addColorStop(0, "rgba(255,255,255,0)");
        glowLine.addColorStop(0.10, "rgba(230,225,255,0.35)");
        glowLine.addColorStop(0.5, "rgba(255,255,255,0.5)");
        glowLine.addColorStop(0.90, "rgba(230,225,255,0.35)");
        glowLine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = glowLine;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        // Core — 1px, 72-84% opacity (spec §12)
        ctx.shadowBlur = 0;
        ctx.globalAlpha = lineAlpha * 0.78;
        ctx.lineWidth = 1;
        const coreLine = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        coreLine.addColorStop(0, "rgba(255,255,255,0)");
        coreLine.addColorStop(0.06, "rgba(245,242,255,0.70)");
        coreLine.addColorStop(0.18, "rgba(255,255,255,0.84)");
        coreLine.addColorStop(0.5, "rgba(255,255,255,0.84)");
        coreLine.addColorStop(0.82, "rgba(255,255,255,0.84)");
        coreLine.addColorStop(0.94, "rgba(245,242,255,0.70)");
        coreLine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = coreLine;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        ctx.restore();
      }

      // ── Vignette — subtle (spec §2) ──
      if (t > 0.15) {
        const va = Math.min(0.35, (t - 0.15) * 0.20) * (t < FADE_START ? 1 : globalFade);
        ctx.globalAlpha = va;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.12, cx, cy, Math.max(W, H) * 0.68);
        vg.addColorStop(0, "rgba(5,5,7,0)");
        vg.addColorStop(0.5, "rgba(5,5,7,0.10)");
        vg.addColorStop(1, "rgba(5,5,7,0.50)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Final fade overlay ──
      if (t > FADE_START) {
        ctx.globalAlpha = clamp01((t - FADE_START) / (FADE_END - FADE_START));
        ctx.fillStyle = "#050507";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalAlpha = 1;

      if (t >= FADE_END + 0.05) {
        ctx.fillStyle = "#050507";
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
