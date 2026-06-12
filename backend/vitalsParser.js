const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

function wordsToNumbers(text) {
  return text.replace(
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:[-\s]+(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred))*\b/gi,
    (phrase) => {
      const parts = phrase.toLowerCase().split(/[-\s]+/);
      let total = 0;
      let current = 0;

      parts.forEach((part) => {
        const value = NUMBER_WORDS[part];
        if (value === 100) {
          current = Math.max(1, current) * value;
        } else {
          current += value;
        }
      });

      total += current;
      return String(total);
    }
  );
}

function firstNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function parseTemperature(text) {
  const value = firstNumber(text, [
    /\b(?:temperature|temp|fever)(?:\s+(?:is|of|at))?\s*(\d{2,3}(?:\.\d+)?)/i,
  ]);

  if (value == null) {
    return null;
  }

  // Ambulance staff may dictate Fahrenheit while the dashboard displays Celsius.
  return Number((value > 50 ? ((value - 32) * 5) / 9 : value).toFixed(1));
}

function parseConsciousness(text) {
  if (/\b(?:unconscious|unresponsive|not conscious|passed out)\b/i.test(text)) {
    return { consciousness: 'unconscious', gcs: 7 };
  }

  if (/\b(?:confused|disoriented|drowsy|semi conscious|semiconscious)\b/i.test(text)) {
    return { consciousness: 'altered', gcs: 11 };
  }

  if (/\b(?:conscious|alert|responsive)\b/i.test(text)) {
    return { consciousness: 'conscious', gcs: 15 };
  }

  return { consciousness: null, gcs: null };
}

function parseEmergencyType(text) {
  const conditions = [
    ['cardiac', /\b(?:cardiac|heart attack|chest pain|myocardial)\b/i],
    ['stroke', /\b(?:stroke|facial droop|slurred speech)\b/i],
    ['respiratory', /\b(?:respiratory|breathing difficulty|shortness of breath|asthma)\b/i],
    ['trauma', /\b(?:trauma|collision|accident|injury|bleeding|fracture)\b/i],
    ['seizure', /\b(?:seizure|convulsion)\b/i],
    ['allergic reaction', /\b(?:anaphylaxis|allergic reaction)\b/i],
  ];

  return conditions.find(([, pattern]) => pattern.test(text))?.[0] || null;
}

function parseVitals(transcript = '') {
  const normalizedText = wordsToNumbers(String(transcript).toLowerCase());
  const heartRate = firstNumber(normalizedText, [
    /\b(?:heart rate|pulse)(?:\s+(?:is|of|at))?\s*(\d{2,3})\b/i,
  ]);
  const spo2 = firstNumber(normalizedText, [
    /\b(?:oxygen(?:\s+(?:level|saturation))?|spo2|sats?)(?:\s+(?:is|of|at))?\s*(\d{2,3})\b/i,
  ]);
  const respRate = firstNumber(normalizedText, [
    /\b(?:respiratory rate|respiration rate|breathing rate)(?:\s+(?:is|of|at))?\s*(\d{1,2})\b/i,
  ]);
  const gcsSpoken = firstNumber(normalizedText, [
    /\b(?:gcs|glasgow coma scale|glasgow score)(?:\s+(?:is|of|at))?\s*(\d{1,2})\b/i,
  ]);
  const bloodPressure = normalizedText.match(
    /\b(?:blood pressure|bp)(?:\s+(?:is|of|at))?\s*(\d{2,3})\s*(?:over|\/|by)\s*(\d{2,3})\b/i
  );
  const consciousness = parseConsciousness(normalizedText);

  const vitals = {};
  if (heartRate != null && heartRate >= 20 && heartRate <= 250) vitals.heartRate = heartRate;
  if (spo2 != null && spo2 >= 40 && spo2 <= 100) vitals.spo2 = spo2;
  if (bloodPressure) vitals.bp = `${Number(bloodPressure[1])}/${Number(bloodPressure[2])}`;
  if (respRate != null && respRate >= 4 && respRate <= 80) vitals.respRate = respRate;

  const temperature = parseTemperature(normalizedText);
  if (temperature != null && temperature >= 25 && temperature <= 45) vitals.temp = temperature;

  const gcs = gcsSpoken != null ? gcsSpoken : consciousness.gcs;
  if (gcs != null && gcs >= 3 && gcs <= 15) vitals.gcs = gcs;

  return {
    vitals,
    consciousness: consciousness.consciousness,
    emergencyType: parseEmergencyType(normalizedText),
  };
}

module.exports = {
  parseVitals,
  wordsToNumbers,
};
