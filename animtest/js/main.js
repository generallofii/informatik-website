document.addEventListener("DOMContentLoaded", () => {

  // 1. Initialize Lenis Smooth Scrolling
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  gsap.registerPlugin(ScrollTrigger);

  // 2. Video Track Components & Timelines
  const vid1 = document.getElementById("video-1");
  const vid2 = document.getElementById("video-2");
  const vid3 = document.getElementById("video-3");
  let v1Data = { frame: 0 };
  let v2Data = { frame: 0 };
  let v3Data = { frame: 0 };
  // Wait for asset engine setups to resolve metadata
  Promise.all([
    new Promise(res => vid1.readyState >= 2 ? res() : vid1.addEventListener("loadedmetadata", res)),
    new Promise(res => vid2.readyState >= 2 ? res() : vid2.addEventListener("loadedmetadata", res)),
    new Promise(res => vid3.readyState >= 2 ? res() : vid3.addEventListener("loadedmetadata", res))
  ]).then(() => {
    createVideoOneTimeline();
    createVideoTwoTimeline();
  });

  // --- TRACK 1 ACTION SCENE ---
  function createVideoOneTimeline() {
    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-1",
        start: "top top",
        end: "+=3000",       // Distance to hold and scrub Video 1
        scrub: true,
        pin: true,
        pinSpacing: true
      }
    });

    tl1.to(v1Data, {
      frame: vid1.duration,
      duration: 3,
      ease: "none",
      onUpdate: () => {
        vid1.currentTime = v1Data.frame;
      }
    });

    tl1.to("#track-1 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      duration: 1.5
    }, "0");
  }

  // --- TRACK 2 ACTION SCENE ---
  function createVideoTwoTimeline() {
    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-2",
        start: "top top",    // CRITICAL: Triggers animation ONLY when Track 2 hits the very top of the window
        end: "+=3000",       // Distance to hold and scrub Video 2
        scrub: true,
        pin: true,
        pinSpacing: true
      }
    });

    tl2.to(v2Data, {
      frame: vid2.duration,
      duration: 3,
      ease: "none",
      onUpdate: () => {
        vid2.currentTime = v2Data.frame;
      }
    });

    // Bring title in and out sequentially inside the locked container space
    tl2.fromTo("#track-2 .scroll-title", 
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, duration: 1 }
    );

    tl2.to("#track-2 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      duration: 1
    }, "+=1");
  }
  // TRACK 3 timeline
    function createVideoOneTimeline() {
    const tl3 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-3",
        start: "top top",
        end: "+=3000",       // Distance to hold and scrub Video 1
        scrub: true,
        pin: true,
        pinSpacing: true
      }
    });

    tl3.to(v3Data, {
      frame: vid3.duration,
      duration: 3,
      ease: "none",
      onUpdate: () => {
        vid3.currentTime = v3Data.frame;
      }
    });

    tl3.to("#track-3 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      duration: 1.5
    }, "0");
  }
});
