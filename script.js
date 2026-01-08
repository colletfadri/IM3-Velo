// ------------------- Map Section -------------------

let map;
let markers = [];

// Farbskala abhängig von der Anzahl Bikes
function getColor(freeBikes) {
  if (freeBikes > 10) return "#E9BA4B"; // Hufflepuff Yellow
  if (freeBikes > 5) return "#716256"; // Dark Brown
  return "#372E29"; // Light Grey
}

// Karteninitialisierung
function initMap() {
  map = L.map('map').setView([46.854943, 9.523897], 13.5); // Zentrum Chur

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // Standardansicht: Heute
  updateMap("day");
}

// Update-Funktion für Karte
function updateMap(mode) {
  fetch('unload.php')
    .then(res => res.json())
    .then(data => {
      // Alte Marker entfernen
      markers.forEach(m => map.removeLayer(m));
      markers = [];

      const now = new Date();

      // Filter nach Zeitraum
      const filtered = data.filter(item => {
        const created = new Date(item.created_time);
        const diffHours = (now - created) / 1000 / 3600;
        if (mode === "day") return diffHours < 24;
        if (mode === "week") return diffHours < 24 * 7;
        if (mode === "month") return diffHours < 24 * 30;
        return true;
      });

      // Gruppiere nach Station für Durchschnittswerte
      const grouped = {};
      filtered.forEach(station => {
        const name = station.name;
        if (!grouped[name]) grouped[name] = { ...station, total: 0, count: 0 };
        grouped[name].total += station.free_bikes;
        grouped[name].count++;
      });

      // Durchschnitt pro Station berechnen
      const averages = Object.values(grouped).map(s => ({
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        avgBikes: s.total / s.count
      }));

      // Marker für jede Station hinzufügen
      averages.forEach(station => {
        const color = getColor(station.avgBikes);
        const icon = L.divIcon({
          html: `<div style="background:${color};border-radius:50%;width:18px;height:18px;border:2px solid white;"></div>`,
          className: '',
          iconSize: [18, 18]
        });

        const marker = L.marker([station.latitude, station.longitude], { icon }).addTo(map);
        marker.bindPopup(`
          <b>${station.name}</b><br>
          🚲 Ø ${station.avgBikes.toFixed(1)} verfügbare Velos
        `);
        markers.push(marker);
      });
    })
    .catch(err => console.error("Fehler beim Laden der Kartendaten:", err));
}


// Initialisieren, sobald DOM geladen ist
document.addEventListener('DOMContentLoaded', initMap);

// -------------------- tägliche tabelle --------------------

let chartInstance = null;
let allData = [];

// 🟢 Fetch data
fetch('unload.php')
  .then(response => response.json())
  .then(rawData => {
    allData = rawData;

    // Get unique station names
    const stationNames = [...new Set(rawData.map(item => item.name))];

    // Populate dropdown
    const select = document.getElementById('stationSelect');
    stationNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    // Initially show total of all stations
    renderChart('all');

    // Handle selection change
    select.addEventListener('change', (event) => {
      const selected = event.target.value || 'all';
      renderChart(selected);
    });
  })
  .catch(error => console.error('Error loading data:', error));


// 🟣 Function: Render chart (all stations or one)
function renderChart(stationName) {
  const today = new Date().toISOString().split('T')[0];
  const filtered = allData.filter(item => {
    const itemDate = new Date(item.created_time).toISOString().split('T')[0];
    if (stationName === 'all') return itemDate === today;
    return item.name === stationName && itemDate === today;
  });

  // Group by hour
  const totalsByHour = {};
  filtered.forEach(item => {
    const date = new Date(item.created_time);
    const hour = date.getHours();
    const roundedTime = `${String(hour).padStart(2, '0')}:00`;
    const bikes = Number(item.free_bikes) || 0;

    if (stationName === 'all') {
      totalsByHour[roundedTime] = (totalsByHour[roundedTime] || 0) + bikes;
    } else {
      totalsByHour[roundedTime] = bikes;
    }
  });

  const labels = Object.keys(totalsByHour).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );
  const values = labels.map(label => totalsByHour[label]);

  const maxValue = Math.max(...values);
  const suggestedMax = Math.ceil(maxValue * 1.1);
  const suggestedMin = 0;

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: '#E9BA4B',
        backgroundColor: '#e9ba4b7d',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const config = {
    type: 'line',
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false, text: "" },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Zeit (stündlich)',
            color: '#E9BA4B',
            font: { size: 14, weight: 'bold' },
          },
          ticks: {
            color: '#EEC869',
            font: { size: 12 },
            callback: function (value) {
              const label = this.getLabelForValue(value);
              const hour = parseInt(label.split(':')[0], 10);
              return hour % 2 === 0 ? label : '';
            },
          },
          grid: {
            color: 'rgba(233, 186, 75, 0.2)',
            drawBorder: true,
            borderColor: '#E9BA4B',
          },
        },
        y: {
          beginAtZero: false,
          suggestedMin,
          suggestedMax,
          title: {
            display: true,
            text: 'Verfügbare Velos',
            color: '#E9BA4B',
            font: { size: 14, weight: 'bold' },
          },
          ticks: { color: '#EEC869', font: { size: 12 } },
          grid: {
            color: 'rgba(233, 186, 75, 0.15)',
            drawBorder: true,
            borderColor: '#E9BA4B',
          },
        },
      },
    },
  };

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(document.getElementById('tägliche_tabelle'), config);
}




// -------------------- wöchentliche tabelle --------------------

let weeklyChart = null;
let weeklyData = [];

// 🟢 Fetch data
fetch('unload.php')
  .then(response => response.json())
  .then(rawData => {
    weeklyData = rawData;

    const stationNames = [...new Set(rawData.map(item => item.name))];
    const select = document.getElementById('stationSelectWeekly');

    const defaultOption = document.createElement('option');
    defaultOption.value = "all";
    defaultOption.textContent = "Alle Stationen";
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    stationNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    renderWeeklyChart("all");
    select.addEventListener('change', e => renderWeeklyChart(e.target.value));
  })
  .catch(error => console.error('Error loading weekly data:', error));

function renderWeeklyChart(stationName) {
  let filtered = stationName === "all"
    ? weeklyData
    : weeklyData.filter(item => item.name === stationName);

  const dayTotals = {};
  const dayCounts = {};

  if (stationName === "all") {
    const groupedByTimestamp = {};
    filtered.forEach(item => {
      const ts = item.created_time;
      if (!groupedByTimestamp[ts]) groupedByTimestamp[ts] = 0;
      groupedByTimestamp[ts] += Number(item.free_bikes) || 0;
    });

    Object.keys(groupedByTimestamp).forEach(ts => {
      const date = new Date(ts);
      const weekday = date.toLocaleDateString("de-DE", { weekday: "long" });
      const totalBikes = groupedByTimestamp[ts];

      if (!dayTotals[weekday]) {
        dayTotals[weekday] = 0;
        dayCounts[weekday] = 0;
      }

      dayTotals[weekday] += totalBikes;
      dayCounts[weekday] += 1;
    });
  } else {
    filtered.forEach(item => {
      const date = new Date(item.created_time);
      const weekday = date.toLocaleDateString("de-DE", { weekday: "long" });
      const bikes = Number(item.free_bikes) || 0;

      if (!dayTotals[weekday]) {
        dayTotals[weekday] = 0;
        dayCounts[weekday] = 0;
      }

      dayTotals[weekday] += bikes;
      dayCounts[weekday] += 1;
    });
  }

  const averageByDay = {};
  Object.keys(dayTotals).forEach(day => {
    averageByDay[day] = Math.round(dayTotals[day] / dayCounts[day]);
  });

  const dayOrder = [
    "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"
  ];
  const labels = dayOrder.filter(day => averageByDay[day] !== undefined);
  const values = labels.map(day => averageByDay[day]);

  const maxValue = Math.max(...values);
  const suggestedMax = Math.ceil(maxValue * 1.1);

  const borderColor = "#E9BA4B";
  const backgroundColor = "#e9ba4b7d";

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor,
        backgroundColor,
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const config = {
    type: "line",
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false, text: "" },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Wochentage",
            color: "#E9BA4B",
            font: { size: 14, weight: "bold" },
          },
          ticks: { color: "#EEC869", font: { size: 12 } },
          grid: {
            color: "rgba(233, 186, 75, 0.2)",
            drawBorder: true,
            borderColor: "#E9BA4B",
          },
        },
        y: {
          beginAtZero: true,
          suggestedMax,
          title: {
            display: true,
            text: "Ø Freie Fahrräder (gerundet)",
            color: "#E9BA4B",
            font: { size: 14, weight: "bold" },
          },
          ticks: { color: "#EEC869", font: { size: 12 }, precision: 0 },
          grid: {
            color: "rgba(233, 186, 75, 0.15)",
            drawBorder: true,
            borderColor: "#E9BA4B",
          },
        },
      },
    },
  };

  if (weeklyChart) weeklyChart.destroy();
  weeklyChart = new Chart(document.getElementById("wochentliche_tabelle"), config);
}



// ------------------ monatliche tabelle --------------------

let monthlyChart = null;
let monthlyData = [];

fetch("unload.php")
  .then(response => response.json())
  .then(rawData => {
    monthlyData = rawData;

    const stationNames = [...new Set(rawData.map(i => i.name))];
    const select = document.getElementById("stationSelectMonthly");

    // Default "All Stations"
    const def = document.createElement("option");
    def.value = "all";
    def.textContent = "Alle Stationen";
    def.selected = true;
    select.appendChild(def);

    // Add stations
    stationNames.forEach(n => {
      const o = document.createElement("option");
      o.value = n;
      o.textContent = n;
      select.appendChild(o);
    });

    renderMonthlyChart("all");

    select.addEventListener("change", e => renderMonthlyChart(e.target.value));
  })
  .catch(e => console.error("Error loading monthly data:", e));

function renderMonthlyChart(stationName) {
  const filtered =
    stationName === "all"
      ? monthlyData
      : monthlyData.filter(i => i.name === stationName);

  const monthlyAverages = {};
  const groupedByMonth = {};
  const displayLabels = {}; // isoKey -> "Monat Jahr" (de-DE)

  // --- Group by month with ISO sortable key ---
  filtered.forEach(item => {
    const d = new Date(item.created_time);
    const isoMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // e.g. 2025-09
    if (!groupedByMonth[isoMonthKey]) {
      groupedByMonth[isoMonthKey] = [];
      displayLabels[isoMonthKey] = d.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
      }); // e.g. "September 2025"
    }
    groupedByMonth[isoMonthKey].push(item);
  });

  // --- Process each month ---
  Object.keys(groupedByMonth).forEach(isoKey => {
    const monthData = groupedByMonth[isoKey];

    if (stationName === "all") {
      // 🟢 Step 1: Group all stations by hour
      const hourlyTotals = {};
      monthData.forEach(item => {
        const d = new Date(item.created_time);
        const dayKey = d.toISOString().split("T")[0];
        const hour = d.getHours();
        const hourKey = `${dayKey}-${hour}`;

        if (!hourlyTotals[hourKey]) hourlyTotals[hourKey] = 0;
        hourlyTotals[hourKey] += Number(item.free_bikes) || 0;
      });

      // 🟢 Step 2: Average hourly totals per day
      const dailyAverages = {};
      const dailyCounts = {};
      Object.keys(hourlyTotals).forEach(hourKey => {
        const dayKey = hourKey.split("-")[0];
        dailyAverages[dayKey] = (dailyAverages[dayKey] || 0) + hourlyTotals[hourKey];
        dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
      });

      const dayAverages = Object.keys(dailyAverages).map(dayKey => {
        return dailyAverages[dayKey] / dailyCounts[dayKey];
      });

      // 🟢 Step 3: Average all days in month
      const monthAvg =
        dayAverages.reduce((sum, val) => sum + val, 0) / (dayAverages.length || 1);

      monthlyAverages[isoKey] = Math.round(monthAvg);
    } else {
      // 🟠 Individual stations — normal daily average
      const totalsByDay = {};
      const countsByDay = {};

      monthData.forEach(item => {
        const d = new Date(item.created_time);
        const dayKey = d.toISOString().split("T")[0];
        const bikes = Number(item.free_bikes) || 0;
        totalsByDay[dayKey] = (totalsByDay[dayKey] || 0) + bikes;
        countsByDay[dayKey] = (countsByDay[dayKey] || 0) + 1;
      });

      let monthTotal = 0;
      let dayCount = 0;
      Object.keys(totalsByDay).forEach(day => {
        monthTotal += totalsByDay[day] / countsByDay[day];
        dayCount++;
      });

      monthlyAverages[isoKey] = Math.round(monthTotal / (dayCount || 1));
    }
  });

  // --- Build chart with sorted ISO keys ---
  const sortedKeys = Object.keys(monthlyAverages).sort(); // "2025-09" < "2025-10"
  const labels = sortedKeys.map(k => displayLabels[k]);   // pretty: "September 2025"
  const values = sortedKeys.map(k => monthlyAverages[k]);

  const maxValue = Math.max(...values);
  const suggestedMax = Math.ceil(maxValue * 1.1);

  // 🟡 Hufflepuff colors
  const borderColor = "#E9BA4B";
  const backgroundColor = "#e9ba4b7d";

  const data = {
    labels,
    datasets: [
      {
        label:
          stationName === "all"
            ? "Ø Freie Fahrräder (Alle Stationen)"
            : `Ø Freie Fahrräder (${stationName})`,
        data: values,
        borderColor,
        backgroundColor,
        borderWidth: 3,
        tension: 0.35,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: borderColor,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const ctx = document.getElementById("monatliche_tabelle").getContext("2d");

  const config = {
    type: "line",
    data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: { display: false },
        title: { display: false, text: "" },
      },
      layout: { padding: { left: 10, right: 10 } },
      scales: {
        x: {
          title: {
            display: true,
            text: "Monate",
            color: "#E9BA4B",
            font: { size: 14, weight: "bold" },
          },
          ticks: { color: "#EEC869", font: { size: 12 } },
          grid: {
            color: "rgba(233, 186, 75, 0.2)",
            drawBorder: true,
            borderColor: "#E9BA4B",
          },
          offset: data.labels.length === 1,
        },
        y: {
          beginAtZero: true,
          suggestedMax,
          title: {
            display: true,
            text: "Ø Freie Fahrräder (gerundet)",
            color: "#E9BA4B",
            font: { size: 14, weight: "bold" },
          },
          ticks: { color: "#EEC869", font: { size: 12 }, precision: 0 },
          grid: {
            color: "rgba(233, 186, 75, 0.15)",
            drawBorder: true,
            borderColor: "#E9BA4B",
          },
        },
      },
    },
  };

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(ctx, config);
}

