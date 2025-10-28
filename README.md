# 🎮 Emudevz - Mobile-First NES Emulator

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/emudevz/emudevz)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Mobile Ready](https://img.shields.io/badge/mobile-ready-blue.svg)](https://emudevz.com)
[![PWA](https://img.shields.io/badge/PWA-enabled-green.svg)](https://emudevz.com)

🕹️ **A game about coding emulators with mobile-first design!** [Check it out!](https://afska.github.io/emudevz)

[![EmuDevz: Reveal Trailer](docs/thumbnail.png)](https://www.youtube.com/watch?v=sBhFulSp4KQ)

> <img alt="rlabs" width="16" height="16" src="https://user-images.githubusercontent.com/1631752/116227197-400d2380-a72a-11eb-9e7b-389aae76f13e.png" /> Created by [[r]labs](https://r-labs.io).

## ✨ Features

### 📱 Mobile-First Design
- **Touch-optimized interface** with gesture support
- **Multi-touch gestures** (pinch, swipe, long press, double tap)
- **Haptic feedback** with different vibration patterns
- **Responsive design** for all screen sizes
- **Virtual keyboard optimization**

### 🚀 Performance Optimizations
- **Adaptive quality** based on device capabilities
- **60 FPS** on high-end devices, **30 FPS** on mid-range
- **GPU-specific optimizations** for all major mobile GPUs
- **Memory management** and garbage collection
- **Battery saver mode** for extended play

### 🎮 Core Emulator Features
- Full 🕹️ NES emulation guide from scratch
- Interactive 🔨 6502 Assembly tutorial
- Implement 🧠 CPU, 🖥️ PPU, and 🔊 APU in any order
- Play 👾 homebrew games to unlock ROMs
- 🧪 Unit tests, video tests, and audio tests
- 💻 Unix-style shell and code editor
- 🎶 Original retro-synthwave soundtrack
- 📃 Included documentation and in-game dictionary
- 🗣️ Fully localized into English and Spanish

### 🐞 Advanced Debugging
- Powerful debugger with:
  * 🐏 Memory viewer
  * 🔢 Instruction log
  * 🏞️ Name tables, CHR, Sprites, Palettes
  * ♒ Individual APU channel views
  * 🎮 Controllers
  * 🗃️ Emulator logging

### 🎯 Mobile Game Modes
- **Speed Run**: Complete levels as fast as possible
- **Memory Master**: Test your memory with pattern challenges
- **Code Golf**: Write efficient code with minimum instructions
- **Perfect Run**: Complete levels without mistakes

### ☁️ Cloud & Social Features
- **Cloud save synchronization** with offline support
- **Achievement system** with 20+ achievements
- **Social sharing** capabilities
- **Mobile-optimized level editor**

### 🛠️ Developer Tools
- **Comprehensive testing suite** for device compatibility
- **A/B testing framework** for feature optimization
- **Real-time analytics** and performance monitoring
- **Mobile debugging tools**
- **Performance profiling**

### 🔭 Advanced Features
- **Free mode** to use IDE to develop emulators for other systems!
- **Progressive Web App** (PWA) capabilities
- **Service Worker** for offline functionality
- **WebGL optimizations** for smooth rendering

## 🌐 Browser Support

- ✅ **iOS Safari** (full support)
- ✅ **Chrome Mobile** (full support)
- ✅ **Firefox Mobile** (full support)
- ✅ **Edge Mobile** (full support)
- ✅ **Samsung Internet** (full support)
- ✅ **Desktop browsers** (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### Installation
```bash
# Clone the repository
git clone https://github.com/emudevz/emudevz.git
cd emudevz

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run mobile compatibility tests
npm run test:mobile

# Build for production
npm run build

# Deploy to production
npm run deploy
```

### Additional Scripts
```bash
# Package levels
npm run package

# Sort locales
npm run sort-locales

# Sort dictionary entries
npm run sort-dictionary

# Analyze bundle size
npm run analyze

# Lint code
npm run lint

# Format code
npm run format
```

## 📱 Mobile Features

### Touch Controls
- **Tap**: Select and interact
- **Swipe Left/Right**: Switch between tabs
- **Double Tap**: Quick actions
- **Long Press**: Context menu
- **Pinch**: Zoom in/out
- **Two-Finger Swipe**: Navigate history

### Gesture Shortcuts
| Gesture | Action |
|---------|--------|
| Swipe Left | Previous tab |
| Swipe Right | Next tab |
| Double Tap | Quick save/load |
| Long Press | Context menu |
| Pinch Out | Zoom in |
| Pinch In | Zoom out |

### Mobile Testing
```bash
# Run full compatibility test suite
npm run mobiletest

# Quick device info
npm run mobiletest --quick

# Test specific features
npm run mobiletest --features
npm run mobiletest --performance
npm run mobiletest --issues

# Export test results
npm run mobiletest --export
```

## 🛠️ API Reference

### Mobile Testing
```javascript
import mobileTestingSuite from './src/utils/mobileTesting.js';

// Run comprehensive tests
await mobileTestingSuite.runCompatibilityTests();

// Get device profile
const profile = mobileTestingSuite.deviceProfile;

// Export test results
mobileTestingSuite.exportTestData();
```

### Performance Monitoring
```javascript
import mobilePerformanceMonitor from './src/utils/mobilePerformanceMonitor.js';

// Get current metrics
const metrics = mobilePerformanceMonitor.getCurrentMetrics();

// Listen for performance changes
mobilePerformanceMonitor.onPerformanceChange((type, data) => {
  console.log('Performance change:', type, data);
});

// Force optimization
mobilePerformanceMonitor.forceOptimization('aggressive');
```

### A/B Testing
```javascript
import { useABTesting } from './src/utils/useABTesting';

const { isFeatureEnabled, getVariant } = useABTesting();

// Check if feature is enabled
if (isFeatureEnabled('mobile_ui_redesign')) {
  // Show new UI
}

// Get specific variant
const variant = getVariant('touch_gestures');
```

## 📊 Performance Benchmarks

### Device Performance
| Device Class | Target FPS | Quality Settings | Features |
|--------------|-------------|------------------|-----------|
| High (Flagship) | 60 | Ultra | All features enabled |
| Medium (Mid-range) | 60 | High | Most features enabled |
| Low (Budget) | 30 | Medium | Essential features |
| Very Low (Legacy) | 30 | Low | Basic functionality |

### Optimization Techniques
- **GPU Optimization**: Device-specific rendering optimizations
- **Memory Management**: Efficient garbage collection
- **Network Optimization**: Adaptive asset loading
- **Battery Optimization**: Power-conscious features

## 🧪 Testing

### Mobile Compatibility Tests
```bash
# Run full test suite
npm run test:mobile

# Quick device info
npm run mobiletest --quick

# Test specific features
npm run mobiletest --features
npm run mobiletest --performance
npm run mobiletest --issues
```

### Device Testing Matrix
- **iOS**: iPhone 12, 13, 14, 15, iPad Air, iPad Pro
- **Android**: Samsung Galaxy S21-S23, Google Pixel 6-8, OnePlus
- **Screen Sizes**: 5.5" to 6.7" mobile, 8" to 12.9" tablets
- **Network**: 4G, 5G, WiFi, poor connectivity

## 🚀 Deployment

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
npm run deploy

# Analyze bundle size
npm run analyze
```

### Environment Setup
- **Development**: `npm run dev`
- **Staging**: Automatic on PR
- **Production**: Automatic on main branch merge

## 🔧 Configuration

### Environment Variables
```bash
# Analytics
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_ENDPOINT=/api/analytics

# Performance
VITE_ADAPTIVE_QUALITY=true
VITE_BATTERY_SAVER=true

# Features
VITE_MOBILE_GESTURES=true
VITE_CLOUD_SYNC=true
VITE_A_B_TESTING=true
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and mobile compatibility checks
5. Submit a pull request

### Mobile Testing Requirements
- Test on actual mobile devices
- Verify touch interactions
- Check performance on different device classes
- Ensure responsive design works

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NES Emulation Community** for technical guidance
- **Mobile Web Developers** for optimization techniques
- **Open Source Contributors** for valuable feedback
- **Beta Testers** for real-world testing

## 📞 Support

- **Documentation**: [emudevz.com/docs](https://emudevz.com/docs)
- **Issues**: [GitHub Issues](https://github.com/emudevz/emudevz/issues)
- **Discord**: [Community Server](https://discord.gg/emudevz)
- **Twitter**: [@emudevz](https://twitter.com/emudevz)

---

<div align="center">
  <p>Made with ❤️ for the mobile gaming community</p>
  <p>⭐ Star us on GitHub if you like this project!</p>
</div>

### Scripts

- Package levels:
  `npm run package`
- Sort locales:
  `node scripts/sort-locales.js`
- Sort dictionary entries:
  `node scripts/sort-dictionary.js`
- Build:
  `npm run build`
- Deploy to GitHub Pages:
  `npm run deploy <GH_USERNAME> <GH_TOKEN>`

### Generate licenses

```
cp pre-licenses.txt public/licenses.txt
yarn licenses generate-disclaimer --prod >> public/licenses.txt
```
