# Mobile Testing Checklist

## 📱 Device Testing

### Essential Devices to Test:
- [ ] iPhone (iOS 14+)
- [ ] Android Phone (Android 8+)
- [ ] iPad/Tablet
- [ ] Small screen phone (< 360px width)
- [ ] Large screen phone (> 400px width)

## 🎯 Core Functionality

### Home Screen
- [ ] Loads properly on all devices
- [ ] Responsive scaling works in portrait
- [ ] Responsive scaling works in landscape
- [ ] Touch targets are 44px minimum
- [ ] No horizontal scrolling
- [ ] Audio plays after user interaction

### Level Navigation
- [ ] Mobile tab layout activates correctly
- [ ] Tab switching works with touch
- [ ] Swipe gestures work between tabs
- [ ] Haptic feedback on tab switch
- [ ] Keyboard shortcuts work (Tab, Ctrl+Enter, Escape)

### Code Editor
- [ ] Virtual keyboard doesn't cause zoom
- [ ] Code is readable on small screens
- [ ] Touch scrolling works smoothly
- [ ] Cursor is visible and usable
- [ ] Line numbers are tappable

### Terminal
- [ ] Input field works with virtual keyboard
- [ ] Commands execute properly
- [ ] Output is readable and scrollable
- [ ] Touch scrolling works
- [ ] No accidental text selection

### Emulator
- [ ] Canvas renders properly
- [ ] Touch controls work (if implemented)
- [ ] Performance is acceptable (30+ FPS)
- [ ] No memory leaks during extended play
- [ ] Audio works in emulator

## 🚀 Performance Testing

### Metrics to Monitor:
- [ ] Initial load time < 5 seconds
- [ ] Tab switching < 300ms
- [ ] Memory usage < 100MB
- [ ] FPS stays above 30
- [ ] No jank during scrolling

### Stress Testing:
- [ ] Extended play session (30+ minutes)
- [ ] Rapid tab switching
- [ ] Memory usage doesn't grow indefinitely
- [ ] No crashes on orientation changes

## 🔧 Browser Compatibility

### iOS Safari
- [ ] No browser blocking warnings
- [ ] Virtual keyboard handling works
- [ ] Touch events work properly
- [ ] No scroll bounce issues
- [ ] Audio context initializes correctly

### Chrome Mobile
- [ ] All features work as expected
- [ ] Performance is optimal
- [ ] Touch gestures are responsive
- [ ] No console errors

### Firefox Mobile
- [ ] Basic functionality works
- [ ] Performance is acceptable
- [ ] Touch interactions work

## 🎨 UI/UX Testing

### Responsive Design
- [ ] Layout adapts to all screen sizes
- [ ] Text is readable without zooming
- [ ] Touch targets meet iOS guidelines
- [ ] No horizontal overflow
- [ ] Proper viewport meta tag behavior

### Touch Interactions
- [ ] 300ms touch delay removed
- [ ] Proper touch feedback
- [ ] No accidental triggers
- [ ] Swipe gestures work reliably
- [ ] Pinch-to-zoom works where expected

### Accessibility
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Screen reader compatibility
- [ ] Keyboard navigation works

## 🐛 Common Issues to Check

### Memory Leaks
- [ ] Check Chrome DevTools Memory tab
- [ ] Monitor heap growth over time
- [ ] No detached DOM nodes
- [ ] Event listeners properly cleaned up

### Performance Issues
- [ ] Identify layout thrashing
- [ ] Check for expensive paint operations
- [ ] Monitor JavaScript execution time
- [ ] Optimize image loading

### Touch Issues
- [ ] No ghost touches
- [ ] Proper event handling
- [ ] No delayed responses
- [ ] Accurate gesture recognition

## 📊 Testing Tools

### DevTools
- Chrome DevTools Device Mode
- Safari Web Inspector
- Firefox Responsive Design Mode

### Real Devices
- BrowserStack (if available)
- Physical device testing
- Network throttling simulation

### Performance Monitoring
- Lighthouse mobile audit
- Chrome Performance tab
- Memory timeline analysis

## ✅ Acceptance Criteria

A mobile experience is considered complete when:
1. All core functionality works on target devices
2. Performance meets minimum requirements (30+ FPS, < 5s load)
3. No critical bugs or crashes
4. Touch interactions are intuitive and responsive
5. UI adapts properly to all screen sizes
6. Audio works reliably after user interaction
7. Memory usage stays within acceptable limits

## 🔄 Testing Workflow

1. **Setup**: Open app on target device
2. **Navigation**: Test home screen and level selection
3. **Core Features**: Test editor, terminal, emulator
4. **Performance**: Monitor FPS and memory usage
5. **Edge Cases**: Test orientation changes, interruptions
6. **Regression**: Verify fixes don't break existing features
7. **Documentation**: Record any issues found and fixes applied