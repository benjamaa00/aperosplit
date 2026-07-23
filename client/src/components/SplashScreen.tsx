import { useState, useEffect, memo, useRef } from "react";

const SPLASH_DURATION = 5800;

export const SplashScreen = memo(function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), SPLASH_DURATION);
    const t2 = setTimeout(() => onCompleteRef.current(), SPLASH_DURATION + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (done) return null;

  return (
    <div className="apple-splash">
      <SplashCanvas />
      <div className="apple-splash-brand">
        <div className="apple-splash-logo-text">AperoSplit</div>
        <div className="apple-splash-tagline">Partagez, équilibrez</div>
      </div>
      <div className="apple-splash-fade" />
    </div>
  );
});

SplashScreen.displayName = "SplashScreen";

/* ═══════════════════════════════════════════════════════════════
   Premium Canvas Animation — 120fps, 4K, spring physics, bloom
   ═══════════════════════════════════════════════════════════════ */

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
    let raf = 0;
    let alive = true;

    // ── Spring physics ──
    function spring(t: number, damping = 0.7, freq = 3) {
      return 1 - Math.exp(-damping * t * 10) * Math.cos(freq * t * Math.PI * 2);
    }
    function easeOutExpo(t: number) {
      return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }
    function easeInOutQuart(t: number) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    // ── Particle pool ──
    const MAX_PARTICLES = 300;
    const particlesX = new Float32Array(MAX_PARTICLES);
    const particlesY = new Float32Array(MAX_PARTICLES);
    const particlesVX = new Float32Array(MAX_PARTICLES);
    const particlesVY = new Float32Array(MAX_PARTICLES);
    const particlesLife = new Float32Array(MAX_PARTICLES);
    const particlesMaxLife = new Float32Array(MAX_PARTICLES);
    const particlesSize = new Float32Array(MAX_PARTICLES);
    const particlesHue = new Float32Array(MAX_PARTICLES);
    let particleCount = 0;

    function spawn(x: number, y: number, hue: number, count: number) {
      for (let i = 0; i < count && particleCount < MAX_PARTICLES; i++) {
        const idx = particleCount;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 0.5;
        particlesX[idx] = x + (Math.random() - 0.5) * 6;
        particlesY[idx] = y + (Math.random() - 0.5) * 6;
        particlesVX[idx] = Math.cos(angle) * speed;
        particlesVY[idx] = Math.sin(angle) * speed;
        particlesLife[idx] = 1;
        particlesMaxLife[idx] = 20 + Math.random() * 50;
        particlesSize[idx] = Math.random() * 3 + 0.8;
        particlesHue[idx] = hue + (Math.random() - 0.5) * 20;
        particleCount++;
      }
    }

    // ── Trail points (ring buffer) ──
    const TRAIL_LEN = 24;
    const trail1X = new Float32Array(TRAIL_LEN);
    const trail1Y = new Float32Array(TRAIL_LEN);
    const trail2X = new Float32Array(TRAIL_LEN);
    const trail2Y = new Float32Array(TRAIL_LEN);
    let trailIdx = 0;

    // ── Ambient orbs ──
    const ambientOrbs = Array.from({ length: 6 }, (_, i) => ({
      baseAngle: (i / 6) * Math.PI * 2,
      dist: 80 + Math.random() * 60,
      speed: 0.3 + Math.random() * 0.4,
      size: 1 + Math.random() * 2,
      hue: i % 2 === 0 ? 270 : 290,
    }));

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;

      // Black background
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // ── Orb 1: violet (#7B2FF7 → hue 270) ──
      const orb1Appear = Math.min(1, t / 0.4);
      const orb1Pulse = t < 0.8 ? 1 + 0.15 * Math.sin(t * 12) * (1 - t / 0.8) : 1;

      // ── Orb 2: mauve (#C9A6FF → hue 275) ──
      const orb2Appear = Math.min(1, Math.max(0, (t - 0.5) / 0.4));
      const orb2Pulse = t > 0.5 && t < 1.3 ? 1 + 0.12 * Math.sin((t - 0.5) * 10) * (1 - (t - 0.5) / 0.8) : (t >= 1.3 ? 1 : 0);

      // ── Phase 1: Converge to center (1.2–2.4s) ──
      const convergeT = t < 1.2 ? 0 : Math.min(1, (t - 1.2) / 1.0);
      const convergeSpring = convergeT >= 1 ? 1 : spring(convergeT, 0.6, 2.5);
      const convergeOffset = 80 * (1 - convergeSpring);

      // ── Phase 2: Separate to final positions (2.6–3.4s) ──
      const separateT = t < 2.6 ? 0 : Math.min(1, (t - 2.6) / 0.8);
      const separateSpring = separateT >= 1 ? 1 : spring(separateT, 0.5, 2);
      const separateOffset = separateSpring * 85;

      const orbOffset = convergeOffset + separateOffset;

      const orb1X = cx - orbOffset;
      const orb1Y = cy;
      const orb2X = cx + orbOffset;
      const orb2Y = cy;
      const orbRadius = 30;

      // ── Record trail positions ──
      trail1X[trailIdx] = orb1X;
      trail1Y[trailIdx] = orb1Y;
      trail2X[trailIdx] = orb2X;
      trail2Y[trailIdx] = orb2Y;
      trailIdx = (trailIdx + 1) % TRAIL_LEN;

      // ── Draw trails ──
      if (t > 0.3 && t < 4.2) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < TRAIL_LEN; i++) {
          const idx = (trailIdx - i - 1 + TRAIL_LEN) % TRAIL_LEN;
          const alpha = (1 - i / TRAIL_LEN) * 0.35;
          const size = orbRadius * 0.3 * (1 - i / TRAIL_LEN);

          // Trail 1
          if (orb1Appear > 0.5) {
            ctx.globalAlpha = alpha * orb1Appear;
            const g1 = ctx.createRadialGradient(trail1X[idx], trail1Y[idx], 0, trail1X[idx], trail1Y[idx], size);
            g1.addColorStop(0, "rgba(139, 92, 246, 0.6)");
            g1.addColorStop(1, "rgba(123, 47, 247, 0)");
            ctx.fillStyle = g1;
            ctx.beginPath();
            ctx.arc(trail1X[idx], trail1Y[idx], size, 0, Math.PI * 2);
            ctx.fill();
          }

          // Trail 2
          if (orb2Appear > 0.5) {
            ctx.globalAlpha = alpha * orb2Appear;
            const g2 = ctx.createRadialGradient(trail2X[idx], trail2Y[idx], 0, trail2X[idx], trail2Y[idx], size);
            g2.addColorStop(0, "rgba(201, 166, 255, 0.5)");
            g2.addColorStop(1, "rgba(216, 180, 254, 0)");
            ctx.fillStyle = g2;
            ctx.beginPath();
            ctx.arc(trail2X[idx], trail2Y[idx], size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ── Spawn trail particles ──
      if (t > 0.2 && t < 4.0) {
        spawn(orb1X, orb1Y, 270, 2);
        if (orb2Appear > 0.3) spawn(orb2X, orb2Y, 285, 2);
      }
      // ── Burst particles during separation ──
      if (t > 2.6 && t < 3.0) {
        spawn(orb1X, orb1Y, 270, 4);
        spawn(orb2X, orb2Y, 290, 4);
        spawn(cx, cy, 280, 3);
      }

      // ── Update & draw particles ──
      ctx.globalCompositeOperation = "lighter";
      for (let i = particleCount - 1; i >= 0; i--) {
        particlesX[i] += particlesVX[i];
        particlesY[i] += particlesVY[i];
        particlesVX[i] *= 0.97;
        particlesVY[i] *= 0.97;
        particlesLife[i] -= 1 / particlesMaxLife[i];
        if (particlesLife[i] <= 0) {
          // Swap with last
          particlesX[i] = particlesX[particleCount - 1];
          particlesY[i] = particlesY[particleCount - 1];
          particlesVX[i] = particlesVX[particleCount - 1];
          particlesVY[i] = particlesVY[particleCount - 1];
          particlesLife[i] = particlesLife[particleCount - 1];
          particlesMaxLife[i] = particlesMaxLife[particleCount - 1];
          particlesSize[i] = particlesSize[particleCount - 1];
          particlesHue[i] = particlesHue[particleCount - 1];
          particleCount--;
          continue;
        }
        const life = particlesLife[i];
        const sz = particlesSize[i] * life;
        ctx.globalAlpha = life * life * 0.7;
        ctx.fillStyle = `hsl(${particlesHue[i]}, 65%, 72%)`;
        ctx.beginPath();
        ctx.arc(particlesX[i], particlesY[i], sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Draw orbs ──
      const drawOrb = (ox: number, oy: number, scale: number, alpha: number, hue1: number, hue2: number) => {
        if (alpha <= 0) return;

        // Outer glow
        ctx.globalAlpha = alpha * 0.3;
        const outerG = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbRadius * 3.5);
        outerG.addColorStop(0, `hsla(${hue1}, 60%, 55%, 0.4)`);
        outerG.addColorStop(0.3, `hsla(${hue1}, 55%, 50%, 0.15)`);
        outerG.addColorStop(1, `hsla(${hue1}, 50%, 40%, 0)`);
        ctx.fillStyle = outerG;
        ctx.beginPath();
        ctx.arc(ox, oy, orbRadius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Mid glow
        ctx.globalAlpha = alpha * 0.5;
        const midG = ctx.createRadialGradient(ox, oy, 0, ox, oy, orbRadius * 1.8);
        midG.addColorStop(0, `hsla(${hue2}, 70%, 80%, 0.5)`);
        midG.addColorStop(0.5, `hsla(${hue1}, 60%, 60%, 0.25)`);
        midG.addColorStop(1, `hsla(${hue1}, 55%, 45%, 0)`);
        ctx.fillStyle = midG;
        ctx.beginPath();
        ctx.arc(ox, oy, orbRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.globalAlpha = alpha;
        const coreG = ctx.createRadialGradient(ox - orbRadius * 0.15, oy - orbRadius * 0.15, 0, ox, oy, orbRadius * scale);
        coreG.addColorStop(0, `hsla(${hue2}, 80%, 90%, 1)`);
        coreG.addColorStop(0.3, `hsla(${hue2}, 70%, 75%, 0.95)`);
        coreG.addColorStop(0.7, `hsla(${hue1}, 60%, 55%, 0.9)`);
        coreG.addColorStop(1, `hsla(${hue1}, 55%, 40%, 0.8)`);
        ctx.fillStyle = coreG;
        ctx.beginPath();
        ctx.arc(ox, oy, orbRadius * scale, 0, Math.PI * 2);
        ctx.fill();

        // Specular highlight
        ctx.globalAlpha = alpha * 0.6;
        const specG = ctx.createRadialGradient(ox - orbRadius * 0.25, oy - orbRadius * 0.3, 0, ox - orbRadius * 0.15, oy - orbRadius * 0.2, orbRadius * 0.5);
        specG.addColorStop(0, "rgba(255,255,255,0.7)");
        specG.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = specG;
        ctx.beginPath();
        ctx.arc(ox - orbRadius * 0.2, oy - orbRadius * 0.25, orbRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      };

      // Orb 1 (violet)
      drawOrb(orb1X, orb1Y, orb1Pulse, orb1Appear, 270, 280);
      // Orb 2 (mauve)
      drawOrb(orb2X, orb2Y, orb2Pulse, orb2Appear, 275, 290);

      // ── Merge flash (2.0–2.6s) — at convergence peak ──
      if (t > 2.0 && t < 2.7) {
        const flashT = (t - 2.0) / 0.7;
        const flashAlpha = Math.max(0, 0.6 * (1 - flashT) * (1 - flashT));
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = flashAlpha;
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        fg.addColorStop(0, "rgba(255,255,255,1)");
        fg.addColorStop(0.3, "rgba(220,200,255,0.6)");
        fg.addColorStop(0.6, "rgba(160,120,255,0.3)");
        fg.addColorStop(1, "rgba(123,47,247,0)");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      // ── Divider line (2.5–5.0s) — appears during separation ──
      if (t > 2.5 && t < 5.0) {
        const lineIn = Math.min(1, (t - 2.5) / 0.4);
        const lineOut = t > 4.5 ? Math.max(0, 1 - (t - 4.5) / 0.5) : 1;
        const lineH = 80 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = Math.min(1, lineIn * 2) * lineOut;

        ctx.globalAlpha = lineAlpha;
        const lg = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.2, "rgba(255,255,255,0.85)");
        lg.addColorStop(0.5, "rgba(220,200,255,0.95)");
        lg.addColorStop(0.8, "rgba(255,255,255,0.85)");
        lg.addColorStop(1, "rgba(255,255,255,0)");

        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        // Line glow
        ctx.globalAlpha = lineAlpha * 0.4;
        ctx.shadowColor = "rgba(201, 166, 255, 0.8)";
        ctx.shadowBlur = 20;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Ripple waves (2.6–3.6s) — during separation ──
      ctx.globalCompositeOperation = "lighter";
      for (let wave = 0; wave < 3; wave++) {
        const waveStart = 2.6 + wave * 0.2;
        if (t > waveStart && t < waveStart + 1.5) {
          const rT = (t - waveStart) / 1.5;
          const rR = easeOutExpo(rT) * Math.min(W, H) * 0.55;
          const rA = Math.max(0, (1 - rT)) * (0.4 - wave * 0.1);
          ctx.globalAlpha = rA;
          ctx.strokeStyle = wave === 0 ? "rgba(201,166,255,0.8)" : wave === 1 ? "rgba(139,92,246,0.5)" : "rgba(180,150,255,0.3)";
          ctx.lineWidth = 2 - wave * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, rR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Ambient floating orbs ──
      ctx.globalCompositeOperation = "lighter";
      if (t > 0.8 && t < 5.0) {
        for (const ao of ambientOrbs) {
          const aT = Math.min(1, (t - 0.8) / 0.5);
          const aOut = t > 4.5 ? Math.max(0, 1 - (t - 4.5) / 0.5) : 1;
          const angle = ao.baseAngle + t * ao.speed;
          const ax = cx + Math.cos(angle) * ao.dist;
          const ay = cy + Math.sin(angle) * ao.dist * 0.6;
          const aAlpha = (0.12 + 0.06 * Math.sin(t * 2 + ao.baseAngle)) * aT * aOut;
          ctx.globalAlpha = aAlpha;
          const ag = ctx.createRadialGradient(ax, ay, 0, ax, ay, ao.size * 3);
          ag.addColorStop(0, `hsla(${ao.hue}, 60%, 70%, 0.5)`);
          ag.addColorStop(1, `hsla(${ao.hue}, 50%, 50%, 0)`);
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.arc(ax, ay, ao.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Subtle vignette ──
      if (t > 0.3) {
        const vAlpha = Math.min(0.4, (t - 0.3) * 0.2);
        ctx.globalAlpha = vAlpha;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.2, cx, cy, Math.max(W, H) * 0.7);
        vg.addColorStop(0, "rgba(0,0,0,0)");
        vg.addColorStop(1, "rgba(0,0,0,0.6)");
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
