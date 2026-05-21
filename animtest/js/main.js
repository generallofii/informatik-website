document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Lenis Smooth Scroll Engine
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-style organic ease out
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 2,
    infinite: false,
  });

  // Connect Lenis frame updates directly to GSAP's global ticker tick
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // 2. Register GSAP ScrollTrigger Plugin
  gsap.registerPlugin(ScrollTrigger);

  // 3. Build Core Scrubber Timeline
  const scrollTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".animation-track",
      start: "top top",
      end: "+=3000",       // Total scroll depth for the animation track execution
      scrub: 1,            // Smoothly catches up to scrollbar position over 1 second
      pin: ".sticky-viewport", // Pins visual components while processing timeline steps
      anticipatePin: 1
    }
  });

  // Step A: Fade out primary heading text and slightly condense its scale
  scrollTimeline.to(".hero-title", {
    opacity: 0,
    scale: 0.95,
    duration: 1
  });

  // Step B: Scale up the structural element to occupy full window area
  // We calculate viewport match parameters dynamically via transform
  scrollTimeline.to(".hardware-canvas", {
    scale: 6,
    borderRadius: "0px",
    duration: 2
  }, "-=0.3"); // Overlaps transition with title fade out

  // Step C: Shift inner graphics structure concurrently to add organic depth
  scrollTimeline.to(".hardware-core", {
    scale: 2.5,
    rotate: 45,
    duration: 2
  }, "-=2");

  // Step D: Reveal secondary features message upward into focus
  scrollTimeline.to(".sub-features", {
    opacity: 1,
    y: 0,
    duration: 1
  }, "-=0.5");

  // Step E: Maintain static hold momentarily at maximum frame extension
  scrollTimeline.to({}, { duration: 1 });
});
