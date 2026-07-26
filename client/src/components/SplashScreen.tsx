import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 3500;

/* Logo-precise palette extracted from AperoSplit_Logo.jpeg:
   Deep violet:  #6030F0  hsl(264, 87%, 59%)
   Mid purple:   #7040F0  hsl(260, 87%, 63%)
   Light violet: #8050F0  hsl(256, 87%, 66%)
   Lavender:     #C0B0F0  hsl(255, 67%, 84%)
   Pale lilac:   #D7CAFB  hsl(255, 82%, 90%)
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
      <div className="apple-splash-fade-overlay" />
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

    function spring(t: number, damping = 0.7, freq = 3) {
      return 1 - Math.exp(-damping * t * 10) * Math.cos(freq * t * Math.PI * 2);
    }
    function easeOutExpo(t: number) {
      return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    // ── Colors exactly matching the logo ──
    const C_DEEP = "96,48,240";      // #6030F0
    const C_MID = "112,64,240";      // #7040F0
    const C_LIGHT = "128,80,240";    // #8050F0
    const C_LAVENDER = "192,176,240"; // #C0B0F0
    const C_PALE = "215,202,251";     // #D7CAFB

    // ── Particle pool ──
    const MAX_PARTICLES = 350;
    const pX = new Float32Array(MAX_PARTICLES);
    const pY = new Float32Array(MAX_PARTICLES);
    const pVX = new Float32Array(MAX_PARTICLES);
    const pVY = new Float32Array(MAX_PARTICLES);
    const pLife = new Float32Array(MAX_PARTICLES);
    const pMaxLife = new Float32Array(MAX_PARTICLES);
    const pSize = new Float32Array(MAX_PARTICLES);
    const pR = new Uint8Array(MAX_PARTICLES);
    const pG = new Uint8Array(MAX_PARTICLES);
    const pB = new Uint8Array(MAX_PARTICLES);
    let pCount = 0;

    function spawn(x: number, y: number, r: number, g: number, b: number, count: number, spread = 20) {
      for (let i = 0; i < count && pCount < MAX_PARTICLES; i++) {
        const idx = pCount;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.8 + 0.3;
        pX[idx] = x + (Math.random() - 0.5) * 8;
        pY[idx] = y + (Math.random() - 0.5) * 8;
        pVX[idx] = Math.cos(angle) * speed;
        pVY[idx] = Math.sin(angle) * speed;
        pLife[idx] = 1;
        pMaxLife[idx] = 18 + Math.random() * 40;
        pSize[idx] = Math.random() * 2.5 + 0.6;
        const jitter = (Math.random() - 0.5) * spread;
        pR[idx] = Math.min(255, Math.max(0, r + jitter * 0.8));
        pG[idx] = Math.min(255, Math.max(0, g + jitter * 0.6));
        pB[idx] = Math.min(255, Math.max(200, b + jitter));
        pCount++;
      }
    }

    // ── Trail ring buffers ──
    const TRAIL_LEN = 22;
    const tr1X = new Float32Array(TRAIL_LEN);
    const tr1Y = new Float32Array(TRAIL_LEN);
    const tr2X = new Float32Array(TRAIL_LEN);
    const tr2Y = new Float32Array(TRAIL_LEN);
    let trIdx = 0;

    // ── Ambient orbs ──
    const ambientOrbs = Array.from({ length: 8 }, (_, i) => ({
      baseAngle: (i / 8) * Math.PI * 2,
      dist: 70 + Math.random() * 70,
      speed: 0.25 + Math.random() * 0.35,
      size: 1.2 + Math.random() * 2.5,
      r: 96 + Math.random() * 80,
      g: 48 + Math.random() * 60,
      b: 200 + Math.random() * 55,
    }));

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;

      // Background
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // ── Orb 1 (deep violet #6030F0) — appears 0-0.3s ──
      const orb1A = Math.min(1, t / 0.3);
      const orb1Pulse = t < 0.6 ? 1 + 0.12 * Math.sin(t * 14) * (1 - t / 0.6) : 1;

      // ── Orb 2 (lavender #C0B0F0) — appears 0.25-0.55s ──
      const orb2A = Math.min(1, Math.max(0, (t - 0.25) / 0.3));
      const orb2Pulse = t > 0.25 && t < 0.85 ? 1 + 0.1 * Math.sin((t - 0.25) * 12) * (1 - (t - 0.25) / 0.6) : (t >= 0.85 ? 1 : 0);

      // ── Phase 1: Converge (0.7-1.5s) ──
      const convT = t < 0.7 ? 0 : Math.min(1, (t - 0.7) / 0.7);
      const convS = convT >= 1 ? 1 : spring(convT, 0.55, 2.5);
      const convOff = 85 * (1 - convS);

      // ── Phase 2: Separate (1.7-2.3s) ──
      const sepT = t < 1.7 ? 0 : Math.min(1, (t - 1.7) / 0.55);
      const sepS = sepT >= 1 ? 1 : spring(sepT, 0.45, 2);
      const sepOff = sepS * 90;

      const orbOff = convOff + sepOff;
      const o1x = cx - orbOff;
      const o1y = cy;
      const o2x = cx + orbOff;
      const o2y = cy;
      const R = 32;

      tr1X[trIdx] = o1x; tr1Y[trIdx] = o1y;
      tr2X[trIdx] = o2x; tr2Y[trIdx] = o2y;
      trIdx = (trIdx + 1) % TRAIL_LEN;

      // ── Draw trails ──
      if (t > 0.15 && t < 3.0) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < TRAIL_LEN; i++) {
          const idx = (trIdx - i - 1 + TRAIL_LEN) % TRAIL_LEN;
          const a = (1 - i / TRAIL_LEN) * 0.4;
          const sz = R * 0.28 * (1 - i / TRAIL_LEN);

          if (orb1A > 0.4) {
            ctx.globalAlpha = a * orb1A;
            const g = ctx.createRadialGradient(tr1X[idx], tr1Y[idx], 0, tr1X[idx], tr1Y[idx], sz);
            g.addColorStop(0, `rgba(${C_DEEP},0.7)`);
            g.addColorStop(1, `rgba(${C_DEEP},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(tr1X[idx], tr1Y[idx], sz, 0, Math.PI * 2);
            ctx.fill();
          }
          if (orb2A > 0.4) {
            ctx.globalAlpha = a * orb2A;
            const g = ctx.createRadialGradient(tr2X[idx], tr2Y[idx], 0, tr2X[idx], tr2Y[idx], sz);
            g.addColorStop(0, `rgba(${C_LAVENDER},0.6)`);
            g.addColorStop(1, `rgba(${C_LAVENDER},0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(tr2X[idx], tr2Y[idx], sz, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ── Particles ──
      if (t > 0.1 && t < 2.8) {
        spawn(o1x, o1y, 96, 48, 240, 2, 15);
        if (orb2A > 0.3) spawn(o2x, o2y, 192, 176, 240, 2, 15);
      }
      if (t > 1.7 && t < 2.0) {
        spawn(o1x, o1y, 112, 64, 240, 5, 20);
        spawn(o2x, o2y, 192, 176, 240, 5, 20);
        spawn(cx, cy, 160, 120, 240, 4, 25);
      }

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
        ctx.globalAlpha = life * life * 0.75;
        ctx.fillStyle = `rgb(${pR[i]},${pG[i]},${pB[i]})`;
        ctx.beginPath();
        ctx.arc(pX[i], pY[i], pSize[i] * life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Draw orbs ──
      const drawOrb = (ox: number, oy: number, scale: number, alpha: number, deepR: number, deepG: number, deepB: number, lightR: number, lightG: number, lightB: number) => {
        if (alpha <= 0) return;

        // Outer glow (deep color, large radius)
        ctx.globalAlpha = alpha * 0.35;
        const outer = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 4);
        outer.addColorStop(0, `rgba(${deepR},${deepG},${deepB},0.45)`);
        outer.addColorStop(0.25, `rgba(${deepR},${deepG},${deepB},0.2)`);
        outer.addColorStop(0.6, `rgba(${deepR},${deepG},${deepB},0.05)`);
        outer.addColorStop(1, `rgba(${deepR},${deepG},${deepB},0)`);
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.arc(ox, oy, R * 4, 0, Math.PI * 2);
        ctx.fill();

        // Mid glow (transition color)
        ctx.globalAlpha = alpha * 0.55;
        const mid = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 2);
        mid.addColorStop(0, `rgba(${lightR},${lightG},${lightB},0.55)`);
        mid.addColorStop(0.4, `rgba(${deepR},${deepG},${deepB},0.35)`);
        mid.addColorStop(1, `rgba(${deepR},${deepG},${deepB},0)`);
        ctx.fillStyle = mid;
        ctx.beginPath();
        ctx.arc(ox, oy, R * 2, 0, Math.PI * 2);
        ctx.fill();

        // Core (bright center with pale highlight)
        ctx.globalAlpha = alpha;
        const core = ctx.createRadialGradient(ox - R * 0.12, oy - R * 0.12, 0, ox, oy, R * scale);
        core.addColorStop(0, `rgba(${lightR},${lightG},${lightB},1)`);
        core.addColorStop(0.2, `rgba(${lightR},${lightG},${lightB},0.95)`);
        core.addColorStop(0.5, `rgba(${deepR},${deepG},${deepB},0.92)`);
        core.addColorStop(0.8, `rgba(${deepR},${deepG},${deepB},0.85)`);
        core.addColorStop(1, `rgba(${Math.floor(deepR * 0.5)},${Math.floor(deepG * 0.5)},${deepB},0.7)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(ox, oy, R * scale, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight (bright white spot)
        ctx.globalAlpha = alpha * 0.65;
        const spec = ctx.createRadialGradient(ox - R * 0.22, oy - R * 0.28, 0, ox - R * 0.12, oy - R * 0.18, R * 0.45);
        spec.addColorStop(0, `rgba(255,255,255,0.8)`);
        spec.addColorStop(0.5, `rgba(${lightR},${lightG},${lightB},0.3)`);
        spec.addColorStop(1, `rgba(${deepR},${deepG},${deepB},0)`);
        ctx.fillStyle = spec;
        ctx.beginPath();
        ctx.arc(ox - R * 0.18, oy - R * 0.22, R * 0.45, 0, Math.PI * 2);
        ctx.fill();
      };

      // Orb 1: deep violet #6030F0 core, lighter #8050F0 highlight
      drawOrb(o1x, o1y, orb1Pulse, orb1A, 96, 48, 240, 160, 120, 245);
      // Orb 2: lavender #C0B0F0 core, pale #D7CAFB highlight
      drawOrb(o2x, o2y, orb2Pulse, orb2A, 192, 176, 240, 225, 215, 252);

      // ── Merge flash (1.3-1.8s) ──
      if (t > 1.3 && t < 1.8) {
        const ft = (t - 1.3) / 0.5;
        const fa = Math.max(0, 0.7 * (1 - ft) * (1 - ft));
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = fa;
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 130);
        fg.addColorStop(0, "rgba(255,255,255,1)");
        fg.addColorStop(0.2, `rgba(${C_PALE},0.8)`);
        fg.addColorStop(0.5, `rgba(${C_LAVENDER},0.4)`);
        fg.addColorStop(0.8, `rgba(${C_MID},0.15)`);
        fg.addColorStop(1, `rgba(${C_DEEP},0)`);
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, cy, 130, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      // ── Divider line (1.7-3.0s) ──
      if (t > 1.7 && t < 3.0) {
        const li = Math.min(1, (t - 1.7) / 0.25);
        const lo = t > 2.6 ? Math.max(0, 1 - (t - 2.6) / 0.4) : 1;
        const lh = 85 * easeOutExpo(li) * lo;
        const la = Math.min(1, li * 2) * lo;

        ctx.globalAlpha = la;
        const lg = ctx.createLinearGradient(cx, cy - lh / 2, cx, cy + lh / 2);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.15, `rgba(${C_PALE},0.9)`);
        lg.addColorStop(0.5, `rgba(${C_LAVENDER},1)`);
        lg.addColorStop(0.85, `rgba(${C_PALE},0.9)`);
        lg.addColorStop(1, "rgba(255,255,255,0)");

        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lh / 2);
        ctx.lineTo(cx, cy + lh / 2);
        ctx.stroke();

        // Line glow
        ctx.globalAlpha = la * 0.5;
        ctx.shadowColor = `rgba(${C_LAVENDER},0.9)`;
        ctx.shadowBlur = 24;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lh / 2);
        ctx.lineTo(cx, cy + lh / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Ripple waves (1.7-2.5s) ──
      ctx.globalCompositeOperation = "lighter";
      for (let w = 0; w < 3; w++) {
        const ws = 1.7 + w * 0.13;
        if (t > ws && t < ws + 1.1) {
          const rt = (t - ws) / 1.1;
          const rr = easeOutExpo(rt) * Math.min(W, H) * 0.55;
          const ra = Math.max(0, (1 - rt)) * (0.35 - w * 0.08);
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

      // ── Ambient floating orbs ──
      ctx.globalCompositeOperation = "lighter";
      if (t > 0.4 && t < 3.0) {
        for (const ao of ambientOrbs) {
          const at = Math.min(1, (t - 0.4) / 0.4);
          const aout = t > 2.6 ? Math.max(0, 1 - (t - 2.6) / 0.4) : 1;
          const angle = ao.baseAngle + t * ao.speed;
          const ax = cx + Math.cos(angle) * ao.dist;
          const ay = cy + Math.sin(angle) * ao.dist * 0.6;
          const aa = (0.1 + 0.05 * Math.sin(t * 2 + ao.baseAngle)) * at * aout;
          ctx.globalAlpha = aa;
          const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, ao.size * 3);
          ag.addColorStop(0, `rgba(${Math.floor(ao.r)},${Math.floor(ao.g)},${Math.floor(ao.b)},0.5)`);
          ag.addColorStop(1, `rgba(${Math.floor(ao.r)},${Math.floor(ao.g)},${Math.floor(ao.b)},0)`);
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(ax, ay, ao.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Vignette ──
      if (t > 0.2) {
        const va = Math.min(0.45, (t - 0.2) * 0.3);
        ctx.globalAlpha = va;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.18, cx, cy, Math.max(W, H) * 0.7);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(0.6, "rgba(0,0,0,0.2)");
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
