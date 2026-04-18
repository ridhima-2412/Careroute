const hospitals = require("./hospitals.json");

function simulate() {
  hospitals.forEach(h => {

    h.icu_available = Math.max(
      0,
      Math.min(h.icu_total, h.icu_available + Math.floor(Math.random()*3 - 1))
    );

    h.ventilators_available = Math.max(
      0,
      Math.min(h.ventilators_total, h.ventilators_available + Math.floor(Math.random()*3 - 1))
    );

    for (let spec in h.specialists) {
      h.specialists[spec] = Math.max(
        0,
        h.specialists[spec] + Math.floor(Math.random()*3 - 1)
      );
    }

    h.status =
      (h.icu_available === 0 || h.ventilators_available === 0)
        ? "busy"
        : "available";
  });

  console.log("🚑 Simulation Running:\n", hospitals);
}

setInterval(simulate, 3000);
