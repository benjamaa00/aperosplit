# AperoSplit Splash Animation

Premium opening animation for the AperoSplit mobile app.

## Specs
- **Format**: Lottie JSON (Bodymovin-compatible)
- **FPS**: 60
- **Duration**: 4.0s (240 frames)
- **Canvas**: 375 × 812 (iPhone standard)
- **Loop**: OFF

## Files

| File | Description |
|------|-------------|
| `preview.html` | Interactive HTML preview (open in browser, scrub timeline) |
| `lottie-dark.json` | Lottie JSON — Dark variant (#000000 background) |
| `lottie-light.json` | Lottie JSON — Light variant (#FFFFFF background) |
| `logo.svg` | Static SVG logo (dark background, transparent) |
| `logo-light.svg` | Static SVG logo (light background, transparent) |

## Lottie Integration

### React Native
```bash
npm install lottie-react-native
```
```tsx
import LottieView from 'lottie-react-native';

<LottieView
  source={require('./lottie-dark.json')}
  autoPlay
  loop={false}
  style={{ flex: 1 }}
  speed={1}
  onAnimationFinish={() => navigation.replace('Home')}
/>
```

### Flutter
```yaml
dependencies:
  lottie: ^3.0.0
```
```dart
Lottie.asset(
  'assets/lottie-dark.json',
  repeat: false,
  onLoaded: (composition) {
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen()));
  },
)
```

### iOS (native)
Use `LOTAnimationView` from the Lottie iOS library or the JSON directly via `LottieSwiftUI`.

### Android (native)
Use `LottieAnimationView` from `com.airbnb.android:lottie`.

## Animation Timeline

| Frame | Time | Event |
|-------|------|-------|
| 0 | 0.00s | Empty screen |
| 12 | 0.20s | Purple sphere appears (fade + scale in) |
| 24 | 0.40s | Purple sphere pulse (subtle 115% bump) |
| 48 | 0.80s | Mauve sphere appears (fade + scale in) |
| 72 | 1.20s | Both spheres begin magnetic attraction |
| 96 | 1.60s | Strong deceleration |
| 120 | 2.00s | Final position — center split line appears |
| 144 | 2.40s | Light wave emits from center |
| 192 | 3.20s | "AperoSplit" text fades in |
| 216 | 3.60s | Exit animation (scale down + fade out) |
| 240 | 4.00s | All elements gone |

## Colors

| Element | Hex | RGB |
|---------|-----|-----|
| Purple sphere | `#7B2FF7` | 123, 47, 247 |
| Mauve sphere | `#C9A6FF` | 201, 166, 255 |
| Center line (center) | `#FFFFFF` | 255, 255, 255 |
| Dark text | `#FFFFFF` | 255, 255, 255 |
| Light text | `#111111` | 17, 17, 17 |

## After Effects Workflow

1. Import `lottie-dark.json` into After Effects via Bodymovin (Window > Extensions > Bodymovin)
2. Or recreate from scratch using the timeline above
3. Export via Bodymovin → JSON
4. Validate at https://lottiefiles.com/preview

## Design Notes

- Glow is simulated via overlapping circles with decreasing opacity (no Gaussian blur)
- Gradient fills are linear/radial only (no mesh gradients)
- All animations use cubic-bezier easing (no linear motion)
- No 3D layers, no expressions, no plugins
- Fully Bodymovin/Lottie-compatible
