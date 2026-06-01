document.addEventListener("DOMContentLoaded", () => {

  // ====== LOADER ELEMENTS ======
  const loader     = document.getElementById("loader");
  const loaderBar  = document.getElementById("loader-bar");
  const loaderText = document.getElementById("loader-status");

  // Lock scroll during load
  document.body.classList.add("is-loading");

  // 1. Register GSAP Plugins First
  gsap.registerPlugin(ScrollTrigger);

  // 2. Initialize Lenis Smooth Scrolling (paused until loaded)
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.8,
    touchMultiplier: 1.5
  });

  // Start with Lenis stopped so user can't scroll during load
  lenis.stop();

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // 3. Video Track Components
  const vid1 = document.getElementById("video-1");
  const vid2 = document.getElementById("video-2");
  const vid3 = document.getElementById("video-3");
  const allVideos = [vid1, vid2, vid3];

  // ====== LOADING PROGRESS TRACKER ======
  // We track two milestones per video:
  //   - metadata loaded  (counts as 30% of that video's share)
  //   - enough data buffered (counts as remaining 70%)
  // Total progress = average across all 3 videos.

  const videoProgress = [0, 0, 0]; // 0–100 per video

  function updateLoaderBar() {
    const total = videoProgress.reduce((a, b) => a + b, 0) / allVideos.length;
    loaderBar.style.width = `${Math.min(total, 100)}%`;

    if (total < 40) {
      loaderText.textContent = "Loading video data…";
    } else if (total < 80) {
      loaderText.textContent = "Buffering frames…";
    } else {
      loaderText.textContent = "Almost ready…";
    }
  }

  // Returns a Promise that resolves once a video has enough data to scrub
  function waitForVideo(videoEl, index) {
    return new Promise((resolve) => {
      // Milestone 1: metadata
      function onMeta() {
        videoProgress[index] = 30;
        updateLoaderBar();
      }

      // Milestone 2: canplaythrough or sufficient buffer
      function onReady() {
        videoProgress[index] = 100;
        updateLoaderBar();
        resolve();
      }

      // Already loaded?
      if (videoEl.readyState >= 4) {
        videoProgress[index] = 100;
        updateLoaderBar();
        resolve();
        return;
      }
      if (videoEl.readyState >= 2) {
        onMeta();
      }

      videoEl.addEventListener("loadedmetadata", onMeta, { once: true });
      videoEl.addEventListener("canplaythrough", onReady, { once: true });

      // Fallback: if canplaythrough never fires (e.g. large files),
      // accept "canplay" after a short delay
      videoEl.addEventListener("canplay", () => {
        setTimeout(() => {
          if (videoProgress[index] < 100) {
            onReady();
          }
        }, 500);
      }, { once: true });

      // Safety timeout: don't block forever (8s max)
      setTimeout(() => {
        if (videoProgress[index] < 100) {
          onReady();
        }
      }, 8000);
    });
  }

  // ====== DISMISS LOADER ======
  function dismissLoader() {
    // Ensure bar shows 100% before fading
    loaderBar.style.width = "100%";
    loaderText.textContent = "Ready";

    // Short pause so user sees "Ready" state
    setTimeout(() => {
      loader.classList.add("hidden");
      document.body.classList.remove("is-loading");
      lenis.start();
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    }, 400);
  }

  // ====== BOOT SEQUENCE ======
  Promise.all(
    allVideos.map((v, i) => waitForVideo(v, i))
  ).then(() => {
    // Build all scroll timelines
    createVideoOneTimeline();
    createVideoTwoTimeline();
    createVideoThreeTimeline();

    // Dismiss the loader
    dismissLoader();
  });

  // Helper: smooth video scrub via proxy object
  function createSmoothVideoTween(timeline, videoEl, startLabel) {
    const proxy = { time: 0 };
    timeline.to(proxy, {
      time: videoEl.duration,
      ease: "none",
      onUpdate: () => {
        if (Math.abs(videoEl.currentTime - proxy.time) > 0.03) {
          videoEl.currentTime = proxy.time;
        }
      }
    }, startLabel);
  }

  // --- TRACK 1 ACTION SCENE ---
  function createVideoOneTimeline() {
    const tl1 = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-1",
        start: "top top",
        end: "+=3000",
        scrub: 2,
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
        end: "+=4000",
        scrub: 2,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1
      }
    });

    createSmoothVideoTween(tl2, vid2, 0);

    const segmentDuration = 1 / titles.length;

    titles.forEach((title, i) => {
      const start = i * segmentDuration;
      const fadeIn  = segmentDuration * 0.25;
      const hold    = segmentDuration * 0.45;
      const fadeOut = segmentDuration * 0.30;

      tl2.fromTo(title,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: fadeIn, ease: "power2.out" },
        start
      );
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
