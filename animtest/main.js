document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
     GSAP + LENIS SMOOTH SCROLL INITIALIZATION
     ============================================================ */
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.0,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ============================================================
     DOM AND LOADER CONFIGURATION
     ============================================================ */
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderText = document.getElementById("loader-status");
  document.body.classList.add("is-loading");

  const tracks = [
    { videoId: "video-1", trackId: "track-1" },
    { videoId: "video-2", trackId: "track-2" },
    { videoId: "video-3", trackId: "track-3" },
  ];

  let loadedMetadataCount = 0;

  // Initialize videos and check metadata loading
  tracks.forEach((track, index) => {
    const video = document.getElementById(track.videoId);
    
    // Set video attributes for smooth inline mobile playing
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.preload = "auto";

    // Set source
    const src = video.dataset.src;
    video.src = src;

    const onMetadataLoaded = () => {
      loadedMetadataCount++;
      // Update progress bar based on metadata loaded count
      const percentage = (loadedMetadataCount / tracks.length) * 100;
      loaderBar.style.width = `${percentage}%`;
      loaderText.textContent = `Orchestrating asset metadata (${loadedMetadataCount}/${tracks.length})…`;

      // Build specific timeline for this video
      buildVideoTimeline(track, video);

      if (loadedMetadataCount === tracks.length) {
        dismissLoader();
      }
    };

    if (video.readyState >= 1) {
      onMetadataLoaded();
    } else {
      video.addEventListener("loadedmetadata", onMetadataLoaded, { once: true });
    }
  });

  /* ============================================================
     GSAP VIDEO SCRUB & TITLE STAGGER TIMELINES
     ============================================================ */
  function buildVideoTimeline(track, video) {
    const duration = video.duration || 4; // fallback duration if not loaded
    const isTrack1 = track.videoId === "video-1";
    const titles = gsap.utils.toArray(`#${track.trackId} .scroll-title`);
    
    // Core timeline for pinning section and scrubbing currentTime
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: `#${track.trackId}`,
        start: "top top",
        end: isTrack1 ? "+=2500" : "+=4000",
        scrub: 1.2, // Smooth interpolation (lag-free time seek)
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        onUpdate: () => {
          // Prevent browser from trying to play the video on its own
          if (!video.paused) {
            video.pause();
          }
        }
      }
    });

    // Animate currentTime of video track
    tl.to(video, {
      currentTime: duration - 0.05,
      ease: "none",
    }, 0);

    // Animate Titles
    if (isTrack1) {
      // Track 1 has a single title that fades and scales away
      tl.to(titles[0], {
        opacity: 0,
        scale: 0.8,
        filter: "blur(15px)",
        duration: 0.5,
        ease: "power2.inOut"
      }, 0.4);
    } else {
      // Tracks 2 and 3 have staggered reveals for multiple titles
      const segmentCount = titles.length;
      const step = 1 / (segmentCount + 0.5);

      titles.forEach((title, i) => {
        const startOffset = i * step + 0.1;
        const fadeDuration = step * 0.4;
        const holdDuration = step * 0.5;

        // Reset initially
        gsap.set(title, { opacity: 0, y: 50, filter: "blur(10px)" });

        // Fade / Slide in
        tl.to(title, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: fadeDuration,
          ease: "power3.out"
        }, startOffset);

        // Fade / Slide out
        tl.to(title, {
          opacity: 0,
          y: -40,
          filter: "blur(10px)",
          duration: fadeDuration,
          ease: "power3.in"
        }, startOffset + fadeDuration + holdDuration);
      });
    }
  }

  /* ============================================================
     DISMISS LOADER OVERLAY
     ============================================================ */
  function dismissLoader() {
    loaderText.textContent = "Synergy Engine Loaded";
    setTimeout(() => {
      loader.classList.add("hidden");
      document.body.classList.remove("is-loading");
      lenis.start();
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    }, 400);
  }

  // Backup dismiss after 4 seconds in case metadata events get blocked
  setTimeout(() => {
    if (document.body.classList.contains("is-loading")) {
      dismissLoader();
    }
  }, 4000);
});
