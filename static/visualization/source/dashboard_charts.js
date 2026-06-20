(() => {
  const payload = window.__VIZ_PAYLOAD__;
  if (!payload || !payload.available || typeof echarts === "undefined") {
    return;
  }

  const charts = [];
  const chartMap = {};
  const palette = {
    ink: "#0d1b2a",
    muted: "#5f6b7a",
    line: "#d7e0ef",
    blue: "#1d4ed8",
    cyan: "#0891b2",
    amber: "#f59e0b",
    pink: "#db2777",
    green: "#16a34a",
  };

  const tooltipBase = {
    trigger: "axis",
    backgroundColor: "rgba(12, 25, 42, 0.92)",
    borderWidth: 0,
    textStyle: { color: "#ecf3ff", fontSize: 12 },
  };

  const axisLabelStyle = { color: palette.muted, fontSize: 11 };
  const axisLineStyle = { lineStyle: { color: palette.line } };
  const splitLineStyle = { lineStyle: { color: palette.line, type: "dashed" } };

  const createChart = (id, option) => {
    const el = document.getElementById(id);
    if (!el) return;
    const chart = echarts.init(el, null, { renderer: "canvas" });
    chart.setOption(option);
    charts.push(chart);
    chartMap[id] = chart;
    return chart;
  };

  const yearly = payload.yearly_boxoffice || { labels: [], values: [] };
  createChart("chartYearly", {
    grid: { top: 56, left: 56, right: 24, bottom: 48 },
    tooltip: tooltipBase,
    xAxis: {
      type: "category",
      data: yearly.labels,
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      name: "亿元",
      nameTextStyle: axisLabelStyle,
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      splitLine: splitLineStyle,
    },
    series: [
      {
        type: "bar",
        data: yearly.values,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#2563eb" },
            { offset: 1, color: "#93c5fd" },
          ]),
          borderRadius: [6, 6, 0, 0],
        },
      },
      {
        type: "line",
        data: yearly.values,
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 3, color: palette.cyan },
        itemStyle: { color: palette.cyan },
      },
    ],
  });

  const weekday = payload.weekday_profile || { labels: [], values: [] };
  createChart("chartWeekday", {
    grid: { top: 48, left: 52, right: 24, bottom: 40 },
    tooltip: tooltipBase,
    xAxis: {
      type: "category",
      data: weekday.labels,
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      splitLine: splitLineStyle,
    },
    series: [
      {
        type: "bar",
        data: weekday.values,
        barWidth: 24,
        itemStyle: {
          color: (params) => {
            const colors = ["#0ea5e9", "#0284c7", "#38bdf8", "#14b8a6", "#10b981", "#f59e0b", "#f97316"];
            return colors[params.dataIndex % colors.length];
          },
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  });

  const heatmap = payload.month_heatmap || { months: [], years: [], data: [] };
  createChart("chartHeatmap", {
    grid: { top: 40, left: 72, right: 20, bottom: 40 },
    tooltip: {
      position: "top",
      formatter: (params) => {
        const year = heatmap.years[params.value[1]];
        const month = heatmap.months[params.value[0]];
        return `${year} ${month}<br/>票房: ${params.value[2]} 亿元`;
      },
      backgroundColor: "rgba(12, 25, 42, 0.92)",
      borderWidth: 0,
      textStyle: { color: "#ecf3ff", fontSize: 12 },
    },
    xAxis: {
      type: "category",
      data: heatmap.months,
      splitArea: { show: true },
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
    },
    yAxis: {
      type: "category",
      data: heatmap.years,
      splitArea: { show: true },
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
    },
    visualMap: {
      min: 0,
      max: Math.max(...heatmap.data.map((item) => item[2]), 1),
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      textStyle: axisLabelStyle,
      inRange: {
        color: ["#e0f2fe", "#7dd3fc", "#0284c7", "#075985"],
      },
    },
    series: [
      {
        name: "月度票房",
        type: "heatmap",
        data: heatmap.data,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.25)",
          },
        },
      },
    ],
  });

  const concentration = payload.market_concentration || { labels: [], cr3: [], cr10: [] };
  createChart("chartConcentration", {
    grid: { top: 48, left: 56, right: 22, bottom: 76 },
    tooltip: tooltipBase,
    legend: {
      data: ["CR3", "CR10"],
      top: 8,
      textStyle: axisLabelStyle,
    },
    xAxis: {
      type: "category",
      data: concentration.labels,
      axisLabel: { ...axisLabelStyle, rotate: 45 },
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      splitLine: splitLineStyle,
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { type: "slider", height: 14, bottom: 24, start: 0, end: 100 },
    ],
    series: [
      {
        name: "CR3",
        type: "line",
        smooth: true,
        data: concentration.cr3,
        symbolSize: 5,
        lineStyle: { width: 2.5, color: palette.blue },
        itemStyle: { color: palette.blue },
      },
      {
        name: "CR10",
        type: "line",
        smooth: true,
        data: concentration.cr10,
        symbolSize: 5,
        lineStyle: { width: 2.5, color: palette.pink },
        itemStyle: { color: palette.pink },
      },
    ],
  });

  const topMovies = payload.top_movies || { labels: [], values: [] };
  createChart("chartTopMovies", {
    grid: { top: 26, left: 150, right: 30, bottom: 24 },
    tooltip: tooltipBase,
    xAxis: {
      type: "value",
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      splitLine: splitLineStyle,
    },
    yAxis: {
      type: "category",
      data: [...topMovies.labels].reverse(),
      axisLabel: { color: palette.ink, fontSize: 11, width: 130, overflow: "truncate" },
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    series: [
      {
        type: "bar",
        data: [...topMovies.values].reverse(),
        barWidth: 12,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: "#22d3ee" },
            { offset: 1, color: "#1d4ed8" },
          ]),
          borderRadius: [0, 8, 8, 0],
        },
      },
    ],
  });

  const efficiency = payload.efficiency_scatter || { data: [] };
  createChart("chartEfficiency", {
    grid: { top: 42, left: 58, right: 20, bottom: 48 },
    tooltip: {
      trigger: "item",
      formatter: (params) => {
        return [
          `<strong>${params.data.name}</strong>`,
          `平均排座占比: ${params.value[0]}%`,
          `平均上座率: ${params.value[1]}%`,
          `样本期票房: ${params.value[2]} 亿元`,
        ].join("<br/>");
      },
      backgroundColor: "rgba(12, 25, 42, 0.92)",
      borderWidth: 0,
      textStyle: { color: "#ecf3ff", fontSize: 12 },
    },
    xAxis: {
      type: "value",
      name: "排座占比(%)",
      nameTextStyle: axisLabelStyle,
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      splitLine: splitLineStyle,
    },
    yAxis: {
      type: "value",
      name: "上座率(%)",
      nameTextStyle: axisLabelStyle,
      axisLabel: axisLabelStyle,
      axisLine: axisLineStyle,
      splitLine: splitLineStyle,
    },
    series: [
      {
        type: "scatter",
        data: efficiency.data,
        itemStyle: {
          color: "rgba(14,165,233,0.7)",
          borderColor: "#0f172a",
          borderWidth: 0.7,
        },
      },
    ],
  });

  const dailyTrend = payload.daily_trend || { labels: [], boxoffice_wan: [], audience_wan: [] };
  createChart("chartDailyTrend", {
    grid: { top: 48, left: 60, right: 60, bottom: 82 },
    tooltip: tooltipBase,
    legend: {
      top: 10,
      data: ["日票房(万元)", "观影人次(万人)"],
      textStyle: axisLabelStyle,
    },
    xAxis: {
      type: "category",
      data: dailyTrend.labels,
      axisLabel: { ...axisLabelStyle, hideOverlap: true },
      axisLine: axisLineStyle,
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: "万元",
        nameTextStyle: axisLabelStyle,
        axisLabel: axisLabelStyle,
        axisLine: axisLineStyle,
        splitLine: splitLineStyle,
      },
      {
        type: "value",
        name: "万人",
        nameTextStyle: axisLabelStyle,
        axisLabel: axisLabelStyle,
        axisLine: axisLineStyle,
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { type: "slider", height: 15, bottom: 30, start: 0, end: 100 },
    ],
    series: [
      {
        name: "日票房(万元)",
        type: "line",
        smooth: true,
        symbol: "none",
        data: dailyTrend.boxoffice_wan,
        yAxisIndex: 0,
        lineStyle: { width: 1.8, color: palette.blue },
        areaStyle: { color: "rgba(29,78,216,0.14)" },
      },
      {
        name: "观影人次(万人)",
        type: "line",
        smooth: true,
        symbol: "none",
        data: dailyTrend.audience_wan,
        yAxisIndex: 1,
        lineStyle: { width: 1.5, color: palette.amber },
      },
    ],
  });

  const calendar = payload.calendar_heatmap || { data: [], start: "", end: "", min: 0, max: 1 };
  createChart("chartCalendar", {
    tooltip: {
      position: "top",
      formatter: (params) => `${params.value[0]}<br/>票房: ${params.value[1]} 万元`,
      backgroundColor: "rgba(12, 25, 42, 0.92)",
      borderWidth: 0,
      textStyle: { color: "#ecf3ff", fontSize: 12 },
    },
    visualMap: {
      min: calendar.min,
      max: calendar.max,
      type: "continuous",
      calculable: true,
      orient: "horizontal",
      left: "center",
      top: 24,
      textStyle: axisLabelStyle,
      inRange: { color: ["#fef9c3", "#facc15", "#f97316", "#ea580c", "#b91c1c"] },
    },
    calendar: {
      top: 84,
      left: 40,
      right: 40,
      cellSize: ["auto", 16],
      range: [calendar.start, calendar.end],
      splitLine: { show: true, lineStyle: { color: "#e8edf7", width: 1 } },
      itemStyle: { borderWidth: 1, borderColor: "#ffffff" },
      dayLabel: { firstDay: 1, nameMap: "cn", color: palette.muted },
      monthLabel: { nameMap: "cn", color: palette.muted },
      yearLabel: { show: false },
    },
    series: {
      type: "heatmap",
      coordinateSystem: "calendar",
      data: calendar.data,
    },
  });

  window.addEventListener("resize", () => {
    charts.forEach((chart) => chart.resize());
  });

  const sanitizeFileName = (raw) => {
    const text = String(raw || "chart_export")
      .trim()
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    return text || "chart_export";
  };

  const exportChartPng = (chartId, fileName) => {
    const chart = chartMap[chartId];
    if (!chart) return false;
    const url = chart.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      excludeComponents: [],
    });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFileName(fileName)}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  };

  window.MovieScopeChartExport = {
    downloadPng: exportChartPng,
  };

  document.querySelectorAll("[data-chart-download]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chartId = btn.getAttribute("data-chart-id") || "";
      const fileName = btn.getAttribute("data-file-name") || chartId || "chart_export";
      const ok = exportChartPng(chartId, fileName);
      if (!ok) {
        btn.disabled = true;
        btn.textContent = "图表未就绪";
      }
    });
  });
})();
