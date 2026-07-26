import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 4200;

/* Logo palette:
   Deep violet:  #6030F0   96,48,240
   Mid purple:   #7040F0  112,64,240
   Light violet: #8050F0  128,80,240
   Lavender:     #C0B0F0  192,176,240
   Pale lilac:   #D7CAFB  215,202,251
*/

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), SPLASH_DURATION - 600);
    const t2 = setTimeout(() => onCompleteRef.current(), SPLASH_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={`apple-splash ${fading ? "apple-splash-fading" : ""}`}>
      <SplashCanvas />
      <div className="apple-splash-brand">
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
    const cy = H / 2 - 30;
    const start = performance.now();
    let alive = true;
    let raf = 0;

    function spring(t: number, damping: number, freq: number) {
      return 1 - Math.exp(-damping * t * 10) * Math.cos(freq * t * Math.PI * 2);
    }
    function easeOutExpo(t: number) {
      return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    const C_DEEP = "96,48,240";
    const C_MID = "112,64,240";
    const C_LIGHT = "128,80,240";
    const C_LAVENDER = "192,176,240";
    const C_PALE = "215,202,251";

    const R = 34;
    const LOGO_GAP = 44;

    // Particle pool
    const MAX_P = 400;
    const pX = new Float32Array(MAX_P);
    const pY = new Float32Array(MAX_P);
    const pVX = new Float32Array(MAX_P);
    const pVY = new Float32Array(MAX_P);
    const pLife = new Float32Array(MAX_P);
    const pMaxLife = new Float32Array(MAX_P);
    const pSize = new Float32Array(MAX_P);
    const pR = new Uint8Array(MAX_P);
    const pG = new Uint8Array(MAX_P);
    const pB = new Uint8Array(MAX_P);
    let pCount = 0;

    function spawn(x: number, y: number, r: number, g: number, b: number, count: number, spread = 18) {
      for (let i = 0; i < count && pCount < MAX_P; i++) {
        const idx = pCount;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.2;
        pX[idx] = x + (Math.random() - 0.5) * 6;
        pY[idx] = y + (Math.random() - 0.5) * 6;
        pVX[idx] = Math.cos(angle) * speed;
        pVY[idx] = Math.sin(angle) * speed;
        pLife[idx] = 1;
        pMaxLife[idx] = 20 + Math.random() * 45;
        pSize[idx] = Math.random() * 2.2 + 0.5;
        const j = (Math.random() - 0.5) * spread;
        pR[idx] = Math.min(255, Math.max(0, r + j * 0.7));
        pG[idx] = Math.min(255, Math.max(0, g + j * 0.5));
        pB[idx] = Math.min(255, Math.max(200, b + j));
        pCount++;
      }
    }

    // Trail
    const TRAIL = 24;
    const tr1X = new Float32Array(TRAIL);
    const tr1Y = new Float32Array(TRAIL);
    const tr2X = new Float32Array(TRAIL);
    const tr2Y = new Float32Array(TRAIL);
    let trIdx = 0;

    // Ambient orbs
    const ambients = Array.from({ length: 10 }, (_, i) => ({
      baseAngle: (i / 10) * Math.PI * 2,
      dist: 60 + Math.random() * 80,
      speed: 0.2 + Math.random() * 0.3,
      size: 1 + Math.random() * 2.5,
      r: 96 + Math.random() * 80,
      g: 48 + Math.random() * 60,
      b: 200 + Math.random() * 55,
    }));

    // ──────────────────────────────────────────────
    // PHASE TIMELINE (4.2s total)
    //   0.0-0.4s  : Fly in from corners
    //   0.4-1.0s  : Orbit around center
    //   1.0-1.4s  : Converge to center → merge flash
    //   1.4-1.8s  : Separate outward
    //   1.8-2.4s  : Re-converge to logo gap (the key move)
    //   2.4-3.2s  : Hold logo, divider line appears, breathing
    //   3.2-4.2s  : Fade out
    // ──────────────────────────────────────────────

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // ── Orb appearance ──
      const orb1A = Math.min(1, t / 0.35);
      const orb2A = Math.min(1, Math.max(0, (t - 0.15) / 0.35));

      // ── Orb positions through phases ──
      let ox: number, oy: number;
      let orbR = R;

      if (t < 0.4) {
        // Phase 0: Fly in from corners
        const flyT = easeOutExpo(Math.min(1, t / 0.35));
        const startX = cx - W * 0.6;
        const startY = cy + H * 0.4;
        ox = lerp(startX, cx - 10, flyT);
        oy = lerp(startY, cy, flyT);
      } else if (t < 1.0) {
        // Phase 1: Gentle orbit around center
        const orbitT = (t - 0.4) / 0.6;
        const orbitAngle = orbitT * Math.PI * 1.5 + Math.PI * 0.75;
        const orbitR = lerp(10, 25, Math.sin(orbitT * Math.PI));
        ox = cx + Math.cos(orbitAngle) * orbitR;
        oy = cy + Math.sin(orbitAngle) * orbitR * 0.5;
      } else if (t < 1.4) {
        // Phase 2: Converge to center
        const convT = Math.min(1, (t - 1.0) / 0.35);
        const convS = spring(convT, 0.6, 3);
        const fromDist = 25;
        ox = lerp(cx + 25, cx, convS);
        oy = cy;
      } else if (t < 1.8) {
        // Phase 3: Separate outward (bounce)
        const sepT = Math.min(1, (t - 1.4) / 0.35);
        const sepS = spring(sepT, 0.4, 2.2);
        ox = cx + sepS * 90;
        oy = cy;
      } else if (t < 2.4) {
        // Phase 4: Re-converge to logo gap (smooth settle)
        const reconvT = Math.min(1, (t - 1.8) / 0.55);
        const reconvS = spring(reconvT, 0.5, 2);
        ox = lerp(90, LOGO_GAP, reconvS);
        oy = cy;
      } else {
        // Phase 5: Hold at logo position with subtle breathing
        const breathe = Math.sin((t - 2.4) * 1.8) * 1.5;
        ox = LOGO_GAP + breathe;
        oy = cy;
        // Gentle scale pulse
        orbR = R * (1 + Math.sin((t - 2.4) * 2.2) * 0.015);
      }

      // Orb 2 mirrors orb 1
      const o1x = t < 1.4 ? ox : cx - (ox - cx);
      const o1y = t < 1.4 ? oy : oy;
      const o2x = t < 1.4 ? cx - (ox - cx) : ox;
      const o2y = t < 1.4 ? cy - (oy - cy) * 0.3 : oy;

      // For fly-in phase, orb2 is below
      let finalO1x: number, finalO1y: number, finalO2x: number, finalO2y: number;
      if (t < 1.0) {
        // During fly-in and orbit: orb1 on the left/top, orb2 on right/bottom
        finalO1x = o1x;
        finalO1y = o1y;
        finalO2x = cx - (o1x - cx);
        finalO2y = cy + (cy - o1y) * 0.6;
      } else if (t < 1.4) {
        // Converge: both move to center
        const convT = Math.min(1, (t - 1.0) / 0.35);
        const convS = spring(convT, 0.6, 3);
        finalO1x = lerp(cx - 25, cx - 2, convS);
        finalO1y = cy;
        finalO2x = lerp(cx + 25, cx + 2, convS);
        finalO2y = cy;
      } else if (t < 1.8) {
        // Separate
        const sepT = Math.min(1, (t - 1.4) / 0.35);
        const sepS = spring(sepT, 0.4, 2.2);
        finalO1x = cx - sepS * 90;
        finalO1y = cy;
        finalO2x = cx + sepS * 90;
        finalO2y = cy;
      } else if (t < 2.4) {
        // Re-converge to logo gap
        const reconvT = Math.min(1, (t - 1.8) / 0.55);
        const reconvS = spring(reconvT, 0.5, 2);
        const gap = lerp(90, LOGO_GAP, reconvS);
        finalO1x = cx - gap;
        finalO1y = cy;
        finalO2x = cx + gap;
        finalO2y = cy;
      } else {
        // Hold with breathing
        const breathe = Math.sin((t - 2.4) * 1.8) * 1.5;
        const gap = LOGO_GAP + breathe;
        finalO1x = cx - gap;
        finalO1y = cy;
        finalO2x = cx + gap;
        finalO2y = cy;
      }

      // Orb pulse
      const orb1Pulse = t < 0.5 ? 1 + 0.1 * Math.sin(t * 16) * (1 - t / 0.5) : 1;
      const orb2Pulse = t > 0.15 && t < 0.7 ? 1 + 0.08 * Math.sin((t - 0.15) * 14) * (1 - (t - 0.15) / 0.55) : 1;

      // Trails
      tr1X[trIdx] = finalO1x; tr1Y[trIdx] = finalO1y;
      tr2X[trIdx] = finalO2x; tr2Y[trIdx] = finalO2y;
      trIdx = (trIdx + 1) % TRAIL;

      // Draw trails
      if (t > 0.15 && t < 3.5) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < TRAIL; i++) {
          const idx = (trIdx - i - 1 + TRAIL) % TRAIL;
          const a = (1 - i / TRAIL) * 0.35;
          const sz = R * 0.25 * (1 - i / TRAIL);

          if (orb1A > 0.3) {
            ctx.globalAlpha = a * orb1A;
            const g = ctx.createRadialGradient(tr1X[idx], tr1Y[idx], 0, tr1X[idx], tr1Y[idx], sz);
            g.addColorStop(0, `rgba(${C_DEEP},0.65)`);
            g.addColorStop(1, `rgba(${C_DEEP},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(tr1X[idx], tr1Y[idx], sz, 0, Math.PI * 2);
            ctx.fill();
          }
          if (orb2A > 0.3) {
            ctx.globalAlpha = a * orb2A;
            const g = ctx.createRadialGradient(tr2X[idx], tr2Y[idx], 0, tr2X[idx], tr2Y[idx], sz);
            g.addColorStop(0, `rgba(${C_LAVENDER},0.55)`);
            g.addColorStop(1, `rgba(${C_LAVENDER},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(tr2X[idx], tr2Y[idx], sz, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // Particles: during motion
      if (t > 0.1 && t < 1.4) {
        spawn(finalO1x, finalO1y, 96, 48, 240, 1, 12);
        if (orb2A > 0.3) spawn(finalO2x, finalO2y, 192, 176, 240, 1, 12);
      }
      // Burst at merge
      if (t > 1.2 && t < 1.5) {
        spawn(cx, cy, 160, 120, 240, 6, 25);
        spawn(cx, cy, 215, 202, 251, 4, 30);
      }
      // Particles during separation
      if (t > 1.4 && t < 1.8) {
        spawn(finalO1x, finalO1y, 112, 64, 240, 3, 18);
        spawn(finalO2x, finalO2y, 192, 176, 240, 3, 18);
      }
      // Gentle particles during logo hold
      if (t > 2.4 && t < 3.5 && Math.random() < 0.3) {
        spawn(finalO1x, finalO1y, 96, 48, 240, 1, 8);
        spawn(finalO2x, finalO2y, 192, 176, 240, 1, 8);
      }

      // Update & draw particles
      ctx.globalCompositeOperation = "lighter";
      for (let i = pCount - 1; i >= 0; i--) {
        pX[i] += pVX[i];
        pY[i] += pVY[i];
        pVX[i] *= 0.97;
        pVY[i] *= 0.97;
        pLife[i] -= 1 / pMaxLife[i];
        if (pLife[i] <= 0) {
          pX[i] = pX[pCount - 1]; pY[i] = pY[pCount - 1];
          pVX[i] = pVX[pCount - 1]; pVY[i] = pVY[pCount - 1];
          pLife[i] = pLife[pCount - 1]; pMaxLife[i] = pMaxLife[pCount - 1];
          pSize[i] = pSize[pCount - 1];
          pR[i] = pR[pCount - 1]; pG[i] = pG[pCount - 1]; pB[i] = pB[pCount - 1];
          pCount--;
          continue;
        }
        const life = pLife[i];
        ctx.globalAlpha = life * life * 0.7;
        ctx.fillStyle = `rgb(${pR[i]},${pG[i]},${pB[i]})`;
        ctx.beginPath();
        ctx.arc(pX[i], pY[i], pSize[i] * life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Draw orb ──
      const drawOrb = (ox: number, oy: number, scale: number, alpha: number, dR: number, dG: number, dB: number, lR: number, lG: number, lB: number) => {
        if (alpha <= 0) return;

        // Outer glow
        ctx.globalAlpha = alpha * 0.35;
        const outer = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 4.5);
        outer.addColorStop(0, `rgba(${dR},${dG},${dB},0.45)`);
        outer.addColorStop(0.2, `rgba(${dR},${dG},${dB},0.22)`);
        outer.addColorStop(0.5, `rgba(${dR},${dG},${dB},0.06)`);
        outer.addColorStop(1, `rgba(${dR},${dG},${dB},0)`);
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.arc(ox, oy, R * 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Mid glow
        ctx.globalAlpha = alpha * 0.55;
        const mid = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 2);
        mid.addColorStop(0, `rgba(${lR},${lG},${lB},0.5)`);
        mid.addColorStop(0.4, `rgba(${dR},${dG},${dB},0.35)`);
        mid.addColorStop(1, `rgba(${dR},${dG},${dB},0)`);
        ctx.fillStyle = mid;
        ctx.beginPath();
        ctx.arc(ox, oy, R * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = alpha;
        const core = ctx.createRadialGradient(ox - R * 0.12, oy - R * 0.12, 0, ox, oy, R * scale);
        core.addColorStop(0, `rgba(${lR},${lG},${lB},1)`);
        core.addColorStop(0.2, `rgba(${lR},${lG},${lB},0.95)`);
        core.addColorStop(0.5, `rgba(${dR},${dG},${dB},0.92)`);
        core.addColorStop(0.8, `rgba(${dR},${dG},${dB},0.85)`);
        core.addColorStop(1, `rgba(${Math.floor(dR * 0.5)},${Math.floor(dG * 0.5)},${dB},0.7)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(ox, oy, R * scale, 0, Math.PI * 2);
        ctx.fill();

        // Specular
        ctx.globalAlpha = alpha * 0.6;
        const spec = ctx.createRadialGradient(ox - R * 0.22, oy - R * 0.28, 0, ox - R * 0.12, oy - R * 0.18, R * 0.45);
        spec.addColorStop(0, "rgba(255,255,255,0.8)");
        spec.addColorStop(0.5, `rgba(${lR},${lG},${lB},0.3)`);
        spec.addColorStop(1, `rgba(${dR},${dG},${dB},0)`);
        ctx.fillStyle = spec;
        ctx.beginPath();
        ctx.arc(ox - R * 0.18, oy - R * 0.22, R * 0.45, 0, Math.PI * 2);
        ctx.fill();
      };

      drawOrb(finalO1x, finalO1y, orb1Pulse, orb1A, 96, 48, 240, 160, 120, 245);
      drawOrb(finalO2x, finalO2y, orb2Pulse, orb2A, 192, 176, 240, 225, 215, 252);

      // ── Merge flash (1.15-1.55s) ──
      if (t > 1.15 && t < 1.55) {
        const ft = (t - 1.15) / 0.4;
        const fa = Math.max(0, 0.75 * (1 - ft) * (1 - ft));
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = fa;
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 140);
        fg.addColorStop(0, "rgba(255,255,255,1)");
        fg.addColorStop(0.15, `rgba(${C_PALE},0.85)`);
        fg.addColorStop(0.4, `rgba(${C_LAVENDER},0.45)`);
        fg.addColorStop(0.7, `rgba(${C_MID},0.15)`);
        fg.addColorStop(1, `rgba(${C_DEEP},0)`);
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      // ── Divider line (appears during re-converge and holds) ──
      if (t > 2.0 && t < 3.6) {
        const lineIn = Math.min(1, (t - 2.0) / 0.4);
        const lineOut = t > 3.2 ? Math.max(0, 1 - (t - 3.2) / 0.4) : 1;
        const lineH = 90 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = Math.min(1, lineIn * 1.8) * lineOut;

        ctx.globalAlpha = lineAlpha;
        const lg = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.12, `rgba(${C_PALE},0.92)`);
        lg.addColorStop(0.5, `rgba(${C_LAVENDER},1)`);
        lg.addColorStop(0.88, `rgba(${C_PALE},0.92)`);
        lg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        // Glow
        ctx.globalAlpha = lineAlpha * 0.5;
        ctx.shadowColor = `rgba(${C_LAVENDER},0.85)`;
        ctx.shadowBlur = 22;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Ripple waves at merge ──
      ctx.globalCompositeOperation = "lighter";
      for (let w = 0; w < 3; w++) {
        const ws = 1.2 + w * 0.12;
        if (t > ws && t < ws + 1.0) {
          const rt = (t - ws) / 1.0;
          const rr = easeOutExpo(rt) * Math.min(W, H) * 0.5;
          const ra = Math.max(0, (1 - rt)) * (0.3 - w * 0.07);
          ctx.globalAlpha = ra;
          const colors = [`rgba(${C_LAVENDER},0.8)`, `rgba(${C_MID},0.5)`, `rgba(${C_DEEP},0.3)`];
          ctx.strokeStyle = colors[w];
          ctx.lineWidth = 2 - w * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Ambient orbs ──
      ctx.globalCompositeOperation = "lighter";
      if (t > 0.3 && t < 3.5) {
        for (const ao of ambients) {
          const aIn = Math.min(1, (t - 0.3) / 0.4);
          const aOut = t > 3.0 ? Math.max(0, 1 - (t - 3.0) / 0.5) : 1;
          const angle = ao.baseAngle + t * ao.speed;
          const ax = cx + Math.cos(angle) * ao.dist;
          const ay = cy + Math.sin(angle) * ao.dist * 0.55;
          const aa = (0.08 + 0.04 * Math.sin(t * 2 + ao.baseAngle)) * aIn * aOut;
          ctx.globalAlpha = aa;
          const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, ao.size * 3);
          ag.addColorStop(0, `rgba(${Math.floor(ao.r)},${Math.floor(ao.g)},${Math.floor(ao.b)},0.45)`);
          ag.addColorStop(1, `rgba(${Math.floor(ao.r)},${Math.floor(ao.g)},${Math.floor(ao.b)},0)`);
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(ax, ay, ao.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Vignette ──
      if (t > 0.15) {
        const va = Math.min(0.5, (t - 0.15) * 0.35);
        ctx.globalAlpha = va;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.15, cx, cy, Math.max(W, H) * 0.7);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(0.5, "rgba(0,0,0,0.15)");
        vg.addColorStop(1, "rgba(0,0,0,0.65)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={ref} className="apple-splash-canvas" />;
}
