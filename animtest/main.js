document.addEventListener("DOMContentLoaded", () => {
  /* ============================================================
     CONFIGURATION
     ============================================================ */
  const FRAME_CAP = 60; // Max frames extracted per video

  /* ============================================================
     LOADER DOM
     ============================================================ */
  const loader     = document.getElementById("loader");
  const loaderBar  = document.getElementById("loader-bar");
  const loaderText = document.getElementById("loader-status");
  document.body.classList.add("is-loading");

  /* ============================================================
     GSAP + LENIS
     ============================================================ */
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.8,
    touchMultiplier: 1.5,
  });
  lenis.stop();                            // locked until load completes
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ============================================================
     TRACK DEFINITIONS
     ============================================================ */
  const tracks = [
    { videoId: "video-1", trackId: "track-1" },
    { videoId: "video-2", trackId: "track-2" },
    { videoId: "video-3", trackId: "track-3" },
  ];

  // Holds { canvas, ctx, frames[] } per video after extraction
  const trackData = {};

  /* ============================================================
     PROGRESS BAR
     ============================================================ */
  const trackProgress = [0, 0, 0]; // 0–100 per video

  function refreshBar() {
    const pct = trackProgress.reduce((a, b) => a + b, 0) / tracks.length;
    loaderBar.style.width = `${Math.min(pct, 100)}%`;

    if (pct < 25)      loaderText.textContent = "Downloading videos…";
    else if (pct < 60) loaderText.textContent = "Extracting scroll frames…";
    else if (pct < 90) loaderText.textContent = "Building timeline…";
    else               loaderText.textContent = "Almost ready…";
  }

  /* ============================================================
     FETCH + FRAME-EXTRACTION PIPELINE
     ============================================================ */
  async function processVideo(track, index) {
    const videoEl = document.getElementById(track.videoId);
    const src     = videoEl.dataset.src;

    /* --- Phase 1 : Download via fetch (gives byte-level progress) --- */
    const res      = await fetch(src);
    const total    = +(res.headers.get("Content-Length") || 0);
    const reader   = res.body.getReader();
    const chunks   = [];
    let   loaded   = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      trackProgress[index] = total ? (loaded / total) * 35 : 20;
      refreshBar();
    }

    const blob    = new Blob(chunks, { type: "video/mp4" });
    const blobUrl = URL.createObjectURL(blob);
    videoEl.src   = blobUrl;

    // Wait until the browser has parsed enough metadata to know duration / resolution
    await new Promise((r) => {
      if (videoEl.readyState >= 2) return r();
      videoEl.addEventListener("loadedmetadata", r, { once: true });
    });

    trackProgress[index] = 35;
    refreshBar();

    /* --- Phase 2 : Extract frames into ImageBitmap array --- */
    const dur   = videoEl.duration;
    const count = Math.min(Math.ceil(dur * 30), FRAME_CAP);
    const step  = dur / count;

    // Offscreen capture surface
    const oc   = document.createElement("canvas");
    oc.width   = videoEl.videoWidth;
    oc.height  = videoEl.videoHeight;
    const octx = oc.getContext("2d");

    const frames = [];

    for (let i = 0; i <= count; i++) {
      videoEl.currentTime = Math.min(i * step, dur - 0.001);

      // Wait for the seek to complete
      await new Promise((r) =>
        videoEl.addEventListener("seeked", r, { once: true })
      );
      // Double-rAF ensures the decoded frame is composited and drawable
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      octx.drawImage(videoEl, 0, 0);
      frames.push(await createImageBitmap(oc));

      trackProgress[index] = 35 + ((i + 1) / (count + 1)) * 65;
      refreshBar();
    }

    /* --- Phase 3 : Create display canvas & swap out video --- */
    const canvas   = document.createElement("canvas");
    canvas.width   = videoEl.videoWidth;
    canvas.height  = videoEl.videoHeight;
    canvas.className = "frame-canvas";

    const wrapper = videoEl.closest(".video-wrapper");
    wrapper.appendChild(canvas);
    videoEl.style.display = "none"; // hide the <video>, canvas takes over

    const ctx = canvas.getContext("2d");
    ctx.drawImage(frames[0], 0, 0);  // paint first frame immediately

    trackData[track.videoId] = { canvas, ctx, frames };

    // Free blob memory
    URL.revokeObjectURL(blobUrl);
  }

  /* ============================================================
     FRAME RENDERER  (called by GSAP on every scroll tick)
     ============================================================ */
  function drawFrame(videoId, progress01) {
    const d = trackData[videoId];
    if (!d) return;
    const idx = Math.max(
      0,
      Math.min(
        Math.round(progress01 * (d.frames.length - 1)),
        d.frames.length - 1
      )
    );
    d.ctx.drawImage(d.frames[idx], 0, 0);
  }

  /* ============================================================
     TIMELINE BUILDERS
     ============================================================ */

  // --- TRACK 1 ---
  function createTrack1Timeline() {
    const proxy = { p: 0 };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-1",
        start: "top top",
        end: "+=3000",
        scrub: 2,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      },
    });

    tl.to(proxy, {
      p: 1,
      ease: "none",
      onUpdate: () => drawFrame("video-1", proxy.p),
    }, 0);

    tl.to("#track-1 .scroll-title", {
      opacity: 0,
      scale: 0.85,
      ease: "power1.out",
    }, 0);
  }

  // --- TRACK 2 (staggered titles) ---
  function createTrack2Timeline() {
    const proxy  = { p: 0 };
    const titles = gsap.utils.toArray("#track-2 .scroll-title");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-2",
        start: "top top",
        end: "+=4000",
        scrub: 2,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      },
    });

    tl.to(proxy, {
      p: 1,
      ease: "none",
      onUpdate: () => drawFrame("video-2", proxy.p),
    }, 0);

    const seg = 1 / titles.length;
    titles.forEach((title, i) => {
      const s = i * seg;
      tl.fromTo(title,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: seg * 0.25, ease: "power2.out" },
        s
      );
      tl.to(title, {
        opacity: 0, y: -20,
        duration: seg * 0.3,
        ease: "power2.in",
      }, s + seg * 0.7);
    });
  }

  // --- TRACK 3 (staggered titles) ---
  function createTrack3Timeline() {
    const proxy  = { p: 0 };
    const titles = gsap.utils.toArray("#track-3 .scroll-title");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#track-3",
        start: "top top",
        end: "+=4000",
        scrub: 2,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      },
    });

    tl.to(proxy, {
      p: 1,
      ease: "none",
      onUpdate: () => drawFrame("video-3", proxy.p),
    }, 0);

    const seg = 1 / titles.length;
    titles.forEach((title, i) => {
      const s = i * seg;
      tl.fromTo(title,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: seg * 0.25, ease: "power2.out" },
        s
      );
      tl.to(title, {
        opacity: 0, y: -20,
        duration: seg * 0.3,
        ease: "power2.in",
      }, s + seg * 0.7);
    });
  }

  /* ============================================================
     DISMISS LOADER
     ============================================================ */
  function dismissLoader() {
    loaderBar.style.width = "100%";
    loaderText.textContent = "Ready";

    setTimeout(() => {
      loader.classList.add("hidden");
      document.body.classList.remove("is-loading");
      lenis.start();
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
    }, 500);
  }

  /* ============================================================
     BOOT SEQUENCE
     ============================================================ */
  (async () => {
    // Process videos sequentially for reliable frame seeking
    for (let i = 0; i < tracks.length; i++) {
      await processVideo(tracks[i], i);
    }

    createTrack1Timeline();
    createTrack2Timeline();
    createTrack3Timeline();

    dismissLoader();
  })();
});
