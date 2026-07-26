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
    <div className="apple-splash" style={{ background: "#0C0C0E" }}>
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

    const R = Math.min(W, H) * 0.12;
    const LOGO_GAP = R * 0.76;

    // LEFT SPHERE — Deep dark purple
    const LEFT = {
      c0: [88, 40, 180],
      c1: [95, 50, 195],
      c2: [100, 55, 200],
      c3: [108, 62, 210],
      c4: [78, 35, 170],
      c5: [65, 28, 145],
      edge: [45, 18, 110],
      glowInner: [80, 45, 175],
      glowMid: [105, 70, 200],
      glowOuter: [55, 25, 130],
      highlight: [120, 85, 210],
      subsurface: [90, 50, 185],
    };

    // RIGHT SPHERE — Deep dark mauve
    const RIGHT = {
      c0: [130, 105, 180],
      c1: [140, 115, 195],
      c2: [145, 120, 198],
      c3: [138, 112, 190],
      c4: [125, 100, 175],
      c5: [110, 88, 155],
      edge: [85, 65, 125],
      glowInner: [135, 110, 185],
      glowMid: [155, 130, 205],
      glowOuter: [100, 78, 145],
      highlight: [150, 125, 195],
      subsurface: [120, 95, 170],
    };

    function drawBackground(alpha: number) {
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "source-over";
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.72);
      bg.addColorStop(0, "#0C0C0E");
      bg.addColorStop(0.30, "#0B0B0D");
      bg.addColorStop(0.60, "#080809");
      bg.addColorStop(1, "#060607");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    function draw(now: number) {
      if (!alive) return;
      const t = (now - start) / 1000;
      const globalFade = t > FADE_START ? clamp01(1 - (t - FADE_START) / (FADE_END - FADE_START)) : 1;

      drawBackground(globalFade);

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
        o1a = 1; o1s = 1; o2a = 0; o2s = 0;
        stretchXS = 1 + sp * 0.45;
        stretchYS = 1 - sp * 0.12;
      } else if (t < 2.10) {
        const mp = clamp01((t - 1.65) / 0.40);
        const dist = easeOutCubic(mp) * R * 2.1;
        o1a = 1; o1s = 1;
        o2a = easeOutCubic(clamp01((t - 1.65) / 0.30));
        o2s = o2a;
        o1x = cx - dist; o1y = cy;
        o2x = cx + dist; o2y = cy;
      } else if (t < 2.60) {
        const dp = clamp01((t - 2.10) / 0.50);
        const drift = lerp(R * 2.1, R * 2.2, easeOutCubic(dp));
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - drift; o1y = cy;
        o2x = cx + drift; o2y = cy;
      } else if (t < 3.30) {
        const rp = clamp01((t - 2.60) / 0.65);
        const rEase = springClamp(rp, 0.6, 2);
        const gap = lerp(R * 2.2, LOGO_GAP, rEase);
        o1a = 1; o1s = 1; o2a = 1; o2s = 1;
        o1x = cx - gap; o1y = cy;
        o2x = cx + gap; o2y = cy;
      } else if (t < 3.80) {
        const hold = t - 3.30;
        const sp = 1 + Math.sin(hold * 2.2) * 0.012;
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

      const drawSphere = (
        ox: number, oy: number, scale: number, alpha: number,
        sx: number, sy: number,
        pal: typeof LEFT
      ) => {
        if (alpha <= 0.01 || scale <= 0.01) return;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(sx * scale, sy * scale);

        // Ambient glow
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.04;
        const ambGlow = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 2.8);
        ambGlow.addColorStop(0, `rgba(${rgb(pal.glowInner)},0.08)`);
        ambGlow.addColorStop(0.5, `rgba(${rgb(pal.glowOuter)},0.02)`);
        ambGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = ambGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Medium glow
        ctx.globalAlpha = alpha * 0.10;
        const midGlow = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R * 1.5);
        midGlow.addColorStop(0, `rgba(${rgb(pal.glowMid)},0.15)`);
        midGlow.addColorStop(0.5, `rgba(${rgb(pal.glowOuter)},0.05)`);
        midGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = midGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Close glow
        ctx.globalAlpha = alpha * 0.16;
        const closeGlow = ctx.createRadialGradient(0, 0, R * 0.35, 0, 0, R * 1.10);
        closeGlow.addColorStop(0, `rgba(${rgb(pal.glowInner)},0.22)`);
        closeGlow.addColorStop(0.5, `rgba(${rgb(pal.glowMid)},0.08)`);
        closeGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = closeGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R * 1.10, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";

        // Glass body
        ctx.globalAlpha = alpha;
        const body = ctx.createRadialGradient(-R * 0.05, -R * 0.05, 0, 0, 0, R);
        body.addColorStop(0.00, `rgba(${rgb(pal.c0)},0.95)`);
        body.addColorStop(0.15, `rgba(${rgb(pal.c1)},0.93)`);
        body.addColorStop(0.30, `rgba(${rgb(pal.c2)},0.90)`);
        body.addColorStop(0.48, `rgba(${rgb(pal.c3)},0.85)`);
        body.addColorStop(0.65, `rgba(${rgb(pal.c4)},0.75)`);
        body.addColorStop(0.80, `rgba(${rgb(pal.c5)},0.55)`);
        body.addColorStop(0.92, `rgba(${rgb(pal.edge)},0.28)`);
        body.addColorStop(1.00, `rgba(${rgb(pal.edge)},0.04)`);
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // Diffused highlight
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.22;
        const hl = ctx.createRadialGradient(-R * 0.22, -R * 0.25, 0, -R * 0.10, -R * 0.12, R * 0.42);
        hl.addColorStop(0.00, `rgba(${rgb(pal.highlight)},0.28)`);
        hl.addColorStop(0.25, `rgba(${rgb(pal.highlight)},0.14)`);
        hl.addColorStop(0.55, `rgba(${rgb(pal.glowInner)},0.04)`);
        hl.addColorStop(0.85, `rgba(${rgb(pal.glowOuter)},0.01)`);
        hl.addColorStop(1.00, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = hl;
        ctx.beginPath();
        ctx.arc(-R * 0.14, -R * 0.16, R * 0.42, 0, Math.PI * 2);
        ctx.fill();

        // Top shadow
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = alpha * 0.55;
        const topShadow = ctx.createRadialGradient(0, -R * 0.92, R * 0.08, 0, -R * 0.20, R * 0.85);
        topShadow.addColorStop(0, `rgba(${rgb(pal.edge)},0.60)`);
        topShadow.addColorStop(0.30, `rgba(${rgb(pal.glowOuter)},0.25)`);
        topShadow.addColorStop(0.60, `rgba(${rgb(pal.glowOuter)},0.04)`);
        topShadow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = topShadow;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // Bottom luminosity
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.16;
        const bottomGlow = ctx.createRadialGradient(0, R * 0.82, R * 0.06, 0, R * 0.40, R * 0.60);
        bottomGlow.addColorStop(0, `rgba(${rgb(pal.highlight)},0.28)`);
        bottomGlow.addColorStop(0.25, `rgba(${rgb(pal.subsurface)},0.12)`);
        bottomGlow.addColorStop(0.55, `rgba(${rgb(pal.glowInner)},0.04)`);
        bottomGlow.addColorStop(1, `rgba(${rgb(pal.glowOuter)},0)`);
        ctx.fillStyle = bottomGlow;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // Rim
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = alpha * 0.04;
        ctx.strokeStyle = `rgba(${rgb(pal.highlight)},0.14)`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.97, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      };

      drawSphere(o1x, o1y, o1s, o1a, stretchXS, stretchYS, LEFT);
      drawSphere(o2x, o2y, o2s, o2a, 1, 1, RIGHT);

      // Ambient atmosphere
      if (o1a > 0.3 && o2a > 0.3) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(o1a, o2a) * 0.06 * globalFade;
        const atmo = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 4.0);
        atmo.addColorStop(0, "rgba(80,40,160,0.08)");
        atmo.addColorStop(0.35, "rgba(65,30,140,0.03)");
        atmo.addColorStop(0.7, "rgba(50,22,110,0.01)");
        atmo.addColorStop(1, "rgba(40,18,90,0)");
        ctx.fillStyle = atmo;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 4.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Intersection
      if (o1a > 0.4 && o2a > 0.4) {
        const halfDist = Math.abs(o2x - o1x) / 2;
        if (halfDist < R) {
          const overlapHalf = R - halfDist;
          const overlapRatio = overlapHalf / R;
          if (overlapRatio > 0.05) {
            const intX = (o1x + o2x) / 2;
            const intY = cy;
            const blendA = Math.min(o1a, o2a) * globalFade;

            // Merged glow
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.12;
            const mg = ctx.createRadialGradient(intX, intY, 0, intX, intY, R * 3.2);
            mg.addColorStop(0, "rgba(110,70,180,0.20)");
            mg.addColorStop(0.20, "rgba(95,55,165,0.10)");
            mg.addColorStop(0.45, "rgba(75,40,140,0.04)");
            mg.addColorStop(0.70, "rgba(55,28,120,0.01)");
            mg.addColorStop(1, "rgba(40,18,100,0)");
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.arc(intX, intY, R * 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Intersection body
            ctx.save();
            const acosVal = Math.acos(clamp01(halfDist / R));
            ctx.beginPath();
            ctx.arc(o1x, o1y, R, -acosVal, acosVal);
            ctx.arc(o2x, o2y, R, Math.PI - acosVal, Math.PI + acosVal);
            ctx.closePath();
            ctx.clip();

            const gw = overlapHalf * 2;
            const ig = ctx.createLinearGradient(intX - gw / 2, intY, intX + gw / 2, intY);
            ig.addColorStop(0.00, "rgba(90,55,160,0.70)");
            ig.addColorStop(0.15, "rgba(100,65,175,0.74)");
            ig.addColorStop(0.35, "rgba(115,80,190,0.78)");
            ig.addColorStop(0.50, "rgba(130,100,200,0.76)");
            ig.addColorStop(0.65, "rgba(120,90,190,0.74)");
            ig.addColorStop(0.85, "rgba(115,85,185,0.70)");
            ig.addColorStop(1.00, "rgba(110,80,180,0.66)");

            ctx.globalAlpha = blendA * 0.80;
            ctx.fillStyle = ig;
            ctx.fillRect(intX - gw / 2 - 5, intY - R, gw + 10, R * 2);

            // Inner luminosity
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = blendA * overlapRatio * 0.22;
            const il = ctx.createRadialGradient(intX, intY, 0, intX, intY, overlapHalf * 1.3);
            il.addColorStop(0.00, "rgba(130,100,200,0.28)");
            il.addColorStop(0.30, "rgba(110,75,180,0.12)");
            il.addColorStop(0.65, `rgba(${rgb(LEFT.glowMid)},0.03)`);
            il.addColorStop(1.00, `rgba(${rgb(LEFT.glowOuter)},0)`);
            ctx.fillStyle = il;
            ctx.beginPath();
            ctx.arc(intX, intY, overlapHalf * 1.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      // Split flash
      if (t > 1.55 && t < 2.05) {
        const ft = clamp01((t - 1.55) / 0.50);
        const fa = ft < 0.1 ? ft / 0.1 : Math.pow(1 - (ft - 0.1) / 0.9, 3);
        const intensity = 0.35 * fa * globalFade;

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        ctx.globalAlpha = intensity;
        const fc1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
        fc1.addColorStop(0, "rgba(120,80,190,0.35)");
        fc1.addColorStop(0.25, "rgba(100,60,170,0.18)");
        fc1.addColorStop(0.60, `rgba(${rgb(LEFT.glowMid)},0.06)`);
        fc1.addColorStop(1, `rgba(${rgb(LEFT.glowOuter)},0)`);
        ctx.fillStyle = fc1;
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = intensity * 0.18;
        const fc2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 4.0);
        fc2.addColorStop(0, "rgba(100,60,170,0.10)");
        fc2.addColorStop(0.35, `rgba(${rgb(LEFT.glowMid)},0.03)`);
        fc2.addColorStop(1, `rgba(${rgb(LEFT.glowOuter)},0)`);
        ctx.fillStyle = fc2;
        ctx.beginPath(); ctx.arc(cx, cy, R * 4.0, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
      }

      // Divider line
      if (t > 3.0 && t < FADE_START + 0.1) {
        const lineIn = smoothstep(3.0, 3.5, t);
        const lineOut = t > FADE_START ? smoothstep(FADE_END, FADE_START, t) : 1;
        const lineH = R * 2.5 * easeOutExpo(lineIn) * lineOut;
        const lineAlpha = lineIn * lineOut * globalFade;

        ctx.save();

        ctx.globalAlpha = lineAlpha * 0.08;
        ctx.shadowColor = "rgba(110,70,170,0.20)";
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2;
        const gl = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        gl.addColorStop(0, "rgba(180,170,200,0)");
        gl.addColorStop(0.12, "rgba(150,140,170,0.18)");
        gl.addColorStop(0.5, "rgba(130,120,155,0.25)");
        gl.addColorStop(0.88, "rgba(150,140,170,0.18)");
        gl.addColorStop(1, "rgba(180,170,200,0)");
        ctx.strokeStyle = gl;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = lineAlpha * 0.50;
        ctx.lineWidth = 1;
        const cl = ctx.createLinearGradient(cx, cy - lineH / 2, cx, cy + lineH / 2);
        cl.addColorStop(0, "rgba(180,170,200,0)");
        cl.addColorStop(0.08, "rgba(150,140,170,0.35)");
        cl.addColorStop(0.20, "rgba(170,160,195,0.55)");
        cl.addColorStop(0.50, "rgba(170,160,195,0.55)");
        cl.addColorStop(0.80, "rgba(170,160,195,0.55)");
        cl.addColorStop(0.92, "rgba(150,140,170,0.35)");
        cl.addColorStop(1, "rgba(180,170,200,0)");
        ctx.strokeStyle = cl;
        ctx.beginPath();
        ctx.moveTo(cx, cy - lineH / 2);
        ctx.lineTo(cx, cy + lineH / 2);
        ctx.stroke();

        ctx.restore();
      }

      // Vignette
      if (t > 0.15) {
        const va = Math.min(0.30, (t - 0.15) * 0.18) * (t < FADE_START ? 1 : globalFade);
        ctx.globalAlpha = va;
        const vg = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.14, cx, cy, Math.max(W, H) * 0.68);
        vg.addColorStop(0, "rgba(12,12,14,0)");
        vg.addColorStop(0.5, "rgba(12,12,14,0.08)");
        vg.addColorStop(1, "rgba(12,12,14,0.45)");
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }

      // Final fade
      if (t > FADE_START) {
        ctx.globalAlpha = clamp01((t - FADE_START) / (FADE_END - FADE_START));
        ctx.fillStyle = "#0C0C0E";
        ctx.fillRect(0, 0, W, H);
      }

      ctx.globalAlpha = 1;

      if (t >= FADE_END + 0.05) {
        ctx.fillStyle = "#0C0C0E";
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
