document.addEventListener("DOMContentLoaded", () => {

  // 1. Setup Lenis Smooth Scrolling
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

  // 2. DOM Elements & Playhead Proxies
  const vid1 = document.getElementById("video-1");
  const vid2 = document.getElementById("video-2");
  const title = document.getElementById("dynamic-title");

  let v1Data = { frame: 0 };
  let v2Data = { frame: 0 };

  // Wait for both video assets to confirm metadata parameters are loaded
  Promise.all([
    new Promise(res => vid1.readyState >= 2 ? res() : vid1.addEventListener("loadedmetadata", res)),
    new Promise(res => vid2.readyState >= 2 ? res() : vid2.addEventListener("loadedmetadata", res))
  ]).then(() => {
    initSequenceTimeline();
  });

  function initSequenceTimeline() {
    // 3. Master Linear Scroll Timeline
    const mainTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".video-track",
        start: "top top",
        end: "+=6000",          /* Deepened scroll workspace to allow room for two clips */
        scrub: true,
        pin: ".sticky-viewport",
        anticipatePin: 1
      }
    });

    // --- PHASE 1: Scrub Video 1 ---
    mainTimeline.to(v1Data, {
      frame: vid1.duration,
      duration: 3,
      ease: "none",
      onUpdate: () => {
        vid1.currentTime = v1Data.frame;
      }
    });

    // Fade primary text slightly out as video 1 progresses
    mainTimeline.to(title, {
      opacity: 0.3,
      scale: 0.95,
      duration: 1.5
    }, "0");

    // --- PHASE 2: The Handshake (Cut to Video 2) ---
    mainTimeline.add(() => {
      // Toggles visibility forward or backward seamlessly based on scroll direction
      vid1.classList.toggle("active");
      vid2.classList.toggle("active");
    });

    // Dynamically change text string at the moment of the handoff
    mainTimeline.to(title, {
      onStart: () => { title.innerHTML = "Pro power. Pro display."; },
      onReverseComplete: () => { title.innerHTML = "The future unfolds."; }
    });

    // --- PHASE 3: Scrub Video 2 ---
    mainTimeline.to(v2Data, {
      frame: vid2.duration,
      duration: 3,
      ease: "none",
      onUpdate: () => {
        vid2.currentTime = v2Data.frame;
      }
    });

    // Fully blend text and contract scale during final video playhead tracks
    mainTimeline.to(title, {
      opacity: 0,
      scale: 0.8,
      duration: 1.5
    }, "-=1.5");
  }
});
