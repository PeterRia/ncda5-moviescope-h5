(() => {
  const root = document.querySelector("[data-showcase]");
  if (!root) return;

  const slides = Array.from(root.querySelectorAll("[data-showcase-slide]"));
  const copies = Array.from(root.querySelectorAll("[data-showcase-copy]"));
  const dots = Array.from(root.querySelectorAll("[data-showcase-dot]"));
  const prevBtn = root.querySelector("[data-showcase-prev]");
  const nextBtn = root.querySelector("[data-showcase-next]");
  const interval = Number.parseInt(root.getAttribute("data-interval") || "7000", 10);

  if (!slides.length) return;

  let index = Math.max(0, slides.findIndex((item) => item.classList.contains("is-active")));
  let timer = null;
  let userPaused = false;

  const stopAllVideos = () => {
    slides.forEach((slide) => {
      const video = slide.querySelector("video");
      if (video) video.pause();
    });
  };

  const tryPlayActiveVideo = () => {
    const active = slides[index];
    const video = active?.querySelector("video");
    if (video) {
      const promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    }
  };

  const render = (nextIndex) => {
    const total = slides.length;
    index = ((nextIndex % total) + total) % total;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
      if (!active) {
        const video = slide.querySelector("video");
        if (video) video.pause();
      }
    });
    copies.forEach((copy, i) => {
      const active = i === index;
      copy.classList.toggle("is-active", active);
      copy.setAttribute("aria-hidden", active ? "false" : "true");
    });
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    tryPlayActiveVideo();
  };

  const stopAuto = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const startAuto = () => {
    stopAuto();
    if (userPaused) return;
    timer = setInterval(() => render(index + 1), Math.max(3200, interval));
  };

  prevBtn?.addEventListener("click", () => render(index - 1));
  nextBtn?.addEventListener("click", () => render(index + 1));
  dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => render(dotIndex)));

  root.addEventListener("mouseenter", () => {
    userPaused = true;
    stopAuto();
  });
  root.addEventListener("mouseleave", () => {
    userPaused = false;
    startAuto();
  });
  root.addEventListener("focusin", () => {
    userPaused = true;
    stopAuto();
  });
  root.addEventListener("focusout", () => {
    userPaused = false;
    startAuto();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAuto();
      stopAllVideos();
      return;
    }
    tryPlayActiveVideo();
    startAuto();
  });

  render(index);
  startAuto();
})();
