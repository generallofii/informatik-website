document.addEventListener("DOMContentLoaded", () => {

  // 1. Register GSAP Plugins First
  gsap.registerPlugin(ScrollTrigger);

  // 2. Initialize Lenis Smooth Scrolling
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.8,      // Slows raw wheel input for less jitter
    touchMultiplier: 1.5
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // 3. Video Track Components
  const vid1 = document.getElementById("video-1");
  const vid2 = document.getElementById("video-2");
  const vid3 = document.getElementById("video-3");

  // Helper: smooth video scrub via proxy object
  // Instead of tweening video.currentTime directly (which causes frame jitter),
  // we tween a plain JS object and apply the value in onUpdate.
  function createSmoothVideoTween(timeline, videoEl, startLabel) {
    const proxy = { time: 0 };
    timeline.to(proxy, {
      time: videoEl.duration,
      ease: "none",
      onUpdate: () => {
        // Only seek if the difference is meaningful (avoids micro-seeks)
        if (Math.abs(videoEl.currentTime - proxy.time) > 0.03) {
          videoEl.currentTime = proxy.time;
        }
      }
    }, startLabel);
  }

  // Wait for all videos to load metadata
  Promise.all([
    new Promise(res => vid1.readyState >= 2 ? res() : vid1.addEventListener("loadedmetadata", res)),
    new Promise(res => vid2.readyState >= 2 ? res() : vid2.addEventListener("loadedmetadata", res)),
    new Promise(res => vid3.readyState >= 2 ? res() : vid3.addEventListener("loadedmetadata", res))
  ]).then(() => {
    createVideoOneTimeline();
    createVideoTwoTimeline();
    createVideoThreeTimeline();
  });

  // --- TRACK 1 ACTION SCENE ---
  function createVideoOneTimeline() {
    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-1",
        start: "top top",
        end: "+=3000",
        scrub: 2,   // Higher = smoother catch-up with scroll
        pin: true,
        pinSpacing: true,
        anticipatePin: 1
      }
    });

    createSmoothVideoTween(tl1, vid1, 0);

    tl1.to("#track-1 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      ease: "power1.out"
    }, 0);
  }

  // --- TRACK 2 ACTION SCENE ---
  function createVideoTwoTimeline() {
    const titles = gsap.utils.toArray("#track-2 .scroll-title");
    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-2",
        start: "top top",
        end: "+=4000",      // Longer scroll distance to give each title time
        scrub: 2,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1
      }
    });

    createSmoothVideoTween(tl2, vid2, 0);

    // Stagger titles: each fades in, holds, then fades out before the next appears
    const segmentDuration = 1 / titles.length; // normalised per-title chunk

    titles.forEach((title, i) => {
      const start = i * segmentDuration;
      const fadeIn  = segmentDuration * 0.25;
      const hold    = segmentDuration * 0.45;
      const fadeOut = segmentDuration * 0.30;

      // Fade in
      tl2.fromTo(title,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: fadeIn, ease: "power2.out" },
        start
      );
      // Fade out
      tl2.to(title, {
        opacity: 0,
        y: -20,
        duration: fadeOut,
        ease: "power2.in"
      }, start + fadeIn + hold);
    });
  }

  // --- TRACK 3 ACTION SCENE ---
  function createVideoThreeTimeline() {
    const titles = gsap.utils.toArray("#track-3 .scroll-title");
    const tl3 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-3",
        start: "top top",
        end: "+=4000",
        scrub: 2,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1
      }
    });

    createSmoothVideoTween(tl3, vid3, 0);

    const segmentDuration = 1 / titles.length;

    titles.forEach((title, i) => {
      const start = i * segmentDuration;
      const fadeIn  = segmentDuration * 0.25;
      const hold    = segmentDuration * 0.45;
      const fadeOut = segmentDuration * 0.30;

      tl3.fromTo(title,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: fadeIn, ease: "power2.out" },
        start
      );
      tl3.to(title, {
        opacity: 0,
        y: -20,
        duration: fadeOut,
        ease: "power2.in"
      }, start + fadeIn + hold);
    });
  }
});
