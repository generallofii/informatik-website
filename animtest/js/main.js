document.addEventListener("DOMContentLoaded", () => {

  // 1. Register GSAP Plugins First
  gsap.registerPlugin(ScrollTrigger);

  // 2. Initialize Lenis Smooth Scrolling
  const lenis = new Lenis({
    duration: 1.2, // Slightly reduced for snappier feedback
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
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
        scrub: 1, // Changed from true to 1. This catches up smoothly with Lenis
        pin: true,
        pinSpacing: true
      }
    });

    // Tween the property DIRECTLY. No proxy object or onUpdate needed.
    tl1.to(vid1, {
      currentTime: vid1.duration,
      ease: "none"
    }, 0); // Starts at the absolute beginning of scroll

    tl1.to("#track-1 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      ease: "power1.out"
    }, 0); // Runs alongside the video
  }

  // --- TRACK 2 ACTION SCENE ---
  function createVideoTwoTimeline() {
    const tl2 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-2",
        start: "top top",    
        end: "+=3000",       
        scrub: 1, 
        pin: true,
        pinSpacing: true
      }
    });

    tl2.to(vid2, {
      currentTime: vid2.duration,
      ease: "none"
    }, 0);

    // Title fades in instantly, then fades out halfway through the scroll
    tl2.fromTo("#track-2 .scroll-title", 
      { opacity: 0, scale: 1.1 },
      { opacity: 1, scale: 1, ease: "power1.inOut" }, 
      0
    );

    tl2.to("#track-2 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      ease: "power1.in"
    }, ">+=0.5"); // Triggers slightly after the fade-in completes
  }

  // --- TRACK 3 ACTION SCENE ---
  function createVideoThreeTimeline() {
    const tl3 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-3",
        start: "top top",
        end: "+=3000",       
        scrub: 1, 
        pin: true,
        pinSpacing: true
      }
    });

    tl3.to(vid3, {
      currentTime: vid3.duration,
      ease: "none"
    }, 0);

    tl3.to("#track-3 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      ease: "power1.out"
    }, 0);
  }
});
