(() => {
  const revealTargets = document.querySelectorAll("[data-reveal]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => observer.observe(el));

  const palette = [
    "#1d4ed8",
    "#0ea5e9",
    "#f59e0b",
    "#ec4899",
    "#16a34a",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#3b82f6",
    "#ef4444",
  ];

  const createLineChart = (canvas, labels, datasets) =>
    new Chart(canvas, {
      type: "line",
      data: { labels, datasets },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 10 } },
        },
        scales: {
          x: {
            ticks: { color: "#4a5568", maxRotation: 20, minRotation: 20 },
            grid: { display: false },
          },
          y: {
            ticks: { color: "#4a5568" },
            grid: { color: "#e8edf6" },
          },
        },
      },
    });

  const top10Canvas = document.getElementById("top10TrendChart");
  if (top10Canvas && window.__HOME_TOP10_TREND__) {
    const payload = window.__HOME_TOP10_TREND__;
    const series = Array.isArray(payload.series) ? payload.series : [];
    const datasets = series.map((item, idx) => ({
      label: `#${item.rank} ${item.name}`,
      data: item.values || [],
      borderColor: palette[idx % palette.length],
      backgroundColor: `${palette[idx % palette.length]}22`,
      pointRadius: 2,
      borderWidth: 2,
      tension: 0.28,
      fill: false,
    }));
    createLineChart(top10Canvas, payload.dates || [], datasets);
  }

  const movieTrendCanvas = document.getElementById("movieTrendChart");
  if (movieTrendCanvas && window.__MOVIE_TREND__) {
    const trend = window.__MOVIE_TREND__;
    createLineChart(movieTrendCanvas, trend.labels || [], [
      {
        label: "单日票房（万元）",
        data: trend.values || [],
        borderColor: "#1d4ed8",
        backgroundColor: "rgba(29,78,216,0.14)",
        pointRadius: 3,
        borderWidth: 2.4,
        fill: true,
        tension: 0.3,
      },
    ]);
  }

  const shareCanvas = document.getElementById("shareChart");
  if (shareCanvas && window.__SHARE_LABELS__ && window.__SHARE_VALUES__) {
    new Chart(shareCanvas, {
      type: "bar",
      data: {
        labels: window.__SHARE_LABELS__,
        datasets: [
          {
            label: "票房占比(%)",
            data: window.__SHARE_VALUES__,
            borderRadius: 8,
            backgroundColor: window.__SHARE_VALUES__.map((_, idx) => palette[idx % palette.length]),
          },
        ],
      },
      options: {
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#4a5568" }, grid: { color: "#e8edf6" } },
          y: { ticks: { color: "#4a5568" }, grid: { display: false } },
        },
      },
    });
  }

  const rankTrendCanvas = document.getElementById("rankTrendChart");
  if (rankTrendCanvas && window.__RANK_TREND__) {
    const trend = window.__RANK_TREND__;
    createLineChart(rankTrendCanvas, trend.labels || [], [
      {
        label: "市场票房（万元）",
        data: trend.boxoffice_wan || [],
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14,165,233,0.18)",
        pointRadius: 0,
        borderWidth: 2.2,
        fill: true,
        tension: 0.26,
      },
    ]);
  }

  const formatValue = (format, value) => {
    if (!Number.isFinite(value)) return "0";
    if (format === "int") return Math.round(value).toLocaleString("zh-CN");
    if (format === "float1") return value.toLocaleString("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (format === "float2") return value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (format === "percent") {
      return `${value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }
    return `${value}`;
  };

  const metricNodes = Array.from(document.querySelectorAll("[data-live-metric]"));
  const metricState = {};

  const animateMetric = (node, nextValue) => {
    const metricKey = node.dataset.liveMetric;
    const format = node.dataset.format || "";
    const startValue = Number(metricState[metricKey] ?? nextValue);
    const endValue = Number(nextValue);
    const duration = 650;
    const startAt = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      node.textContent = formatValue(format, current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    metricState[metricKey] = endValue;
  };

  const syncLiveMetrics = (metrics, latestDay) => {
    metricNodes.forEach((node) => {
      const key = node.dataset.liveMetric;
      if (!(key in metrics)) return;
      animateMetric(node, Number(metrics[key]));
    });
    const latestDayNode = document.getElementById("liveLatestDay");
    if (latestDayNode && latestDay) latestDayNode.textContent = latestDay;
    const updateNode = document.getElementById("liveUpdateTime");
    if (updateNode && metrics.updated_at) updateNode.textContent = `更新于 ${metrics.updated_at}`;
    const sourceNode = document.getElementById("liveDataSource");
    if (sourceNode && metrics.data_source) {
      sourceNode.textContent = metrics.data_source === "online_db" ? "在线数据库" : "票房快照";
    }
  };

  if (metricNodes.length) {
    const fetchLiveOverview = async () => {
      try {
        const response = await fetch(`${window.__STATIC_BASE__ || ""}api/live/overview.json`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        if (payload.code !== 0 || !payload.data) return;
        syncLiveMetrics(payload.data.metrics || {}, payload.data.latest_day || "");
      } catch (_err) {
        // ignore network jitter for polling updates
      }
    };
    setTimeout(fetchLiveOverview, 800);
    setInterval(fetchLiveOverview, 20000);
  }

  const initHeatReel = () => {
    const root = document.querySelector("[data-heat-reel]");
    if (!root) return;
    const cards = Array.from(root.querySelectorAll("[data-heat-item]"));
    const dots = Array.from(document.querySelectorAll("[data-heat-dot]"));
    const prevBtn = root.querySelector("[data-heat-prev]");
    const nextBtn = root.querySelector("[data-heat-next]");
    if (!cards.length) return;

    let index = 0;
    let timer = null;
    const intervalMs = Number(root.dataset.heatInterval || 6800);
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const normalizeOffset = (raw, total) => {
      let offset = raw;
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
      return offset;
    };

    const render = (nextIndex) => {
      const total = cards.length;
      index = (nextIndex + total) % total;
      cards.forEach((card, i) => {
        const forward = (i - index + total) % total;
        const offset = normalizeOffset(forward, total);
        const absOffset = Math.abs(offset);
        card.style.setProperty("--offset", String(offset));
        card.style.setProperty("--abs-offset", String(absOffset));
        card.classList.toggle("is-active", offset === 0);
        card.classList.toggle("is-hidden", absOffset > 3);
        card.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
      });
      dots.forEach((dot, i) => {
        const isActive = i === index;
        dot.classList.toggle("active", isActive);
        dot.setAttribute("aria-current", isActive ? "true" : "false");
      });
    };

    const stopAuto = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startAuto = () => {
      if (isReducedMotion) return;
      stopAuto();
      timer = setInterval(() => render(index + 1), intervalMs);
    };

    prevBtn?.addEventListener("click", () => render(index - 1));
    nextBtn?.addEventListener("click", () => render(index + 1));
    dots.forEach((dot, dotIndex) => dot.addEventListener("click", () => render(dotIndex)));
    cards.forEach((card, cardIndex) => {
      const imageBtn = card.querySelector("[data-heat-image]");
      imageBtn?.addEventListener("click", () => {
        if (cardIndex === index) {
          render(index + 1);
        } else {
          render(cardIndex);
        }
      });
    });
    root.tabIndex = 0;
    root.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        render(index - 1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        render(index + 1);
      }
    });
    root.addEventListener("mouseenter", stopAuto);
    root.addEventListener("mouseleave", startAuto);
    root.addEventListener("focusin", stopAuto);
    root.addEventListener("focusout", startAuto);

    render(0);
    startAuto();
  };

  initHeatReel();
})();
