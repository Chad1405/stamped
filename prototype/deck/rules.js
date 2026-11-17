"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: !0 });
  };

  // src/lib/game/engine.ts
  var engine_exports = {};
  __export(engine_exports, {
    applyAction: () => applyAction,
    countryClues: () => countryClues,
    freshStop: () => freshStop,
    stopPoints: () => stopPoints
  });

  // src/content/countries.json
  var countries_default = [{ name: "Afghanistan", aliases: [], cont: ["AS"] }, { name: "Albania", aliases: [], cont: ["EU"] }, { name: "Algeria", aliases: [], cont: ["AF"] }, { name: "Andorra", aliases: [], cont: ["EU"] }, { name: "Angola", aliases: [], cont: ["AF"] }, { name: "Antigua and Barbuda", aliases: ["antigua"], cont: ["NA"] }, { name: "Argentina", aliases: [], cont: ["SA"] }, { name: "Armenia", aliases: [], cont: ["AS", "EU"] }, { name: "Australia", aliases: [], cont: ["OC"] }, { name: "Austria", aliases: [], cont: ["EU"] }, { name: "Azerbaijan", aliases: [], cont: ["AS", "EU"] }, { name: "Bahamas", aliases: [], cont: ["NA"] }, { name: "Bahrain", aliases: [], cont: ["AS"] }, { name: "Bangladesh", aliases: [], cont: ["AS"] }, { name: "Barbados", aliases: [], cont: ["NA"] }, { name: "Belarus", aliases: [], cont: ["EU"] }, { name: "Belgium", aliases: [], cont: ["EU"] }, { name: "Belize", aliases: [], cont: ["NA"] }, { name: "Benin", aliases: [], cont: ["AF"] }, { name: "Bhutan", aliases: [], cont: ["AS"] }, { name: "Bolivia", aliases: [], cont: ["SA"] }, { name: "Bosnia and Herzegovina", aliases: ["bosnia"], cont: ["EU"] }, { name: "Botswana", aliases: [], cont: ["AF"] }, { name: "Brazil", aliases: ["brasil"], cont: ["SA"] }, { name: "Brunei", aliases: [], cont: ["AS"] }, { name: "Bulgaria", aliases: [], cont: ["EU"] }, { name: "Burkina Faso", aliases: [], cont: ["AF"] }, { name: "Burundi", aliases: [], cont: ["AF"] }, { name: "Cambodia", aliases: [], cont: ["AS"] }, { name: "Cameroon", aliases: [], cont: ["AF"] }, { name: "Canada", aliases: [], cont: ["NA"] }, { name: "Cape Verde", aliases: ["cabo verde"], cont: ["AF"] }, { name: "Central African Republic", aliases: [], cont: ["AF"] }, { name: "Chad", aliases: [], cont: ["AF"] }, { name: "Chile", aliases: [], cont: ["SA"] }, { name: "China", aliases: ["prc"], cont: ["AS"] }, { name: "Colombia", aliases: [], cont: ["SA"] }, { name: "Comoros", aliases: [], cont: ["AF"] }, { name: "Congo", aliases: ["republic of the congo"], cont: ["AF"] }, { name: "DR Congo", aliases: ["drc", "democratic republic of the congo", "zaire"], cont: ["AF"] }, { name: "Costa Rica", aliases: [], cont: ["NA"] }, { name: "Croatia", aliases: ["hrvatska"], cont: ["EU"] }, { name: "Cuba", aliases: [], cont: ["NA"] }, { name: "Cyprus", aliases: [], cont: ["EU", "AS"] }, { name: "Czechia", aliases: ["czech republic"], cont: ["EU"] }, { name: "Denmark", aliases: [], cont: ["EU"] }, { name: "Djibouti", aliases: [], cont: ["AF"] }, { name: "Dominica", aliases: [], cont: ["NA"] }, { name: "Dominican Republic", aliases: [], cont: ["NA"] }, { name: "Ecuador", aliases: [], cont: ["SA"] }, { name: "Egypt", aliases: [], cont: ["AF", "AS"] }, { name: "El Salvador", aliases: [], cont: ["NA"] }, { name: "Equatorial Guinea", aliases: [], cont: ["AF"] }, { name: "Eritrea", aliases: [], cont: ["AF"] }, { name: "Estonia", aliases: ["eesti"], cont: ["EU"] }, { name: "Eswatini", aliases: ["swaziland"], cont: ["AF"] }, { name: "Ethiopia", aliases: [], cont: ["AF"] }, { name: "Fiji", aliases: [], cont: ["OC"] }, { name: "Finland", aliases: ["suomi"], cont: ["EU"] }, { name: "France", aliases: [], cont: ["EU"] }, { name: "Gabon", aliases: [], cont: ["AF"] }, { name: "Gambia", aliases: [], cont: ["AF"] }, { name: "Georgia", aliases: ["sakartvelo"], cont: ["AS", "EU"] }, { name: "Germany", aliases: ["deutschland"], cont: ["EU"] }, { name: "Ghana", aliases: [], cont: ["AF"] }, { name: "Greece", aliases: ["hellas"], cont: ["EU"] }, { name: "Grenada", aliases: [], cont: ["NA"] }, { name: "Guatemala", aliases: [], cont: ["NA"] }, { name: "Guinea", aliases: [], cont: ["AF"] }, { name: "Guinea-Bissau", aliases: [], cont: ["AF"] }, { name: "Guyana", aliases: [], cont: ["SA"] }, { name: "Haiti", aliases: [], cont: ["NA"] }, { name: "Honduras", aliases: [], cont: ["NA"] }, { name: "Hungary", aliases: [], cont: ["EU"] }, { name: "Iceland", aliases: ["island"], cont: ["EU"] }, { name: "India", aliases: [], cont: ["AS"] }, { name: "Indonesia", aliases: [], cont: ["AS"] }, { name: "Iran", aliases: [], cont: ["AS"] }, { name: "Iraq", aliases: [], cont: ["AS"] }, { name: "Ireland", aliases: ["eire"], cont: ["EU"] }, { name: "Israel", aliases: [], cont: ["AS"] }, { name: "Italy", aliases: ["italia"], cont: ["EU"] }, { name: "Ivory Coast", aliases: ["cote d ivoire"], cont: ["AF"] }, { name: "Jamaica", aliases: [], cont: ["NA"] }, { name: "Japan", aliases: ["nippon"], cont: ["AS"] }, { name: "Jordan", aliases: [], cont: ["AS"] }, { name: "Kazakhstan", aliases: [], cont: ["AS", "EU"] }, { name: "Kenya", aliases: [], cont: ["AF"] }, { name: "Kiribati", aliases: [], cont: ["OC"] }, { name: "Kosovo", aliases: [], cont: ["EU"] }, { name: "Kuwait", aliases: [], cont: ["AS"] }, { name: "Kyrgyzstan", aliases: [], cont: ["AS"] }, { name: "Laos", aliases: [], cont: ["AS"] }, { name: "Latvia", aliases: [], cont: ["EU"] }, { name: "Lebanon", aliases: [], cont: ["AS"] }, { name: "Lesotho", aliases: [], cont: ["AF"] }, { name: "Liberia", aliases: [], cont: ["AF"] }, { name: "Libya", aliases: [], cont: ["AF"] }, { name: "Liechtenstein", aliases: [], cont: ["EU"] }, { name: "Lithuania", aliases: [], cont: ["EU"] }, { name: "Luxembourg", aliases: [], cont: ["EU"] }, { name: "Madagascar", aliases: [], cont: ["AF"] }, { name: "Malawi", aliases: [], cont: ["AF"] }, { name: "Malaysia", aliases: [], cont: ["AS"] }, { name: "Maldives", aliases: [], cont: ["AS"] }, { name: "Mali", aliases: [], cont: ["AF"] }, { name: "Malta", aliases: [], cont: ["EU"] }, { name: "Marshall Islands", aliases: [], cont: ["OC"] }, { name: "Mauritania", aliases: [], cont: ["AF"] }, { name: "Mauritius", aliases: [], cont: ["AF"] }, { name: "Mexico", aliases: [], cont: ["NA"] }, { name: "Micronesia", aliases: [], cont: ["OC"] }, { name: "Moldova", aliases: [], cont: ["EU"] }, { name: "Monaco", aliases: [], cont: ["EU"] }, { name: "Mongolia", aliases: [], cont: ["AS"] }, { name: "Montenegro", aliases: [], cont: ["EU"] }, { name: "Morocco", aliases: [], cont: ["AF"] }, { name: "Mozambique", aliases: [], cont: ["AF"] }, { name: "Myanmar", aliases: ["burma"], cont: ["AS"] }, { name: "Namibia", aliases: [], cont: ["AF"] }, { name: "Nauru", aliases: [], cont: ["OC"] }, { name: "Nepal", aliases: [], cont: ["AS"] }, { name: "Netherlands", aliases: ["holland"], cont: ["EU"] }, { name: "New Zealand", aliases: ["aotearoa"], cont: ["OC"] }, { name: "Nicaragua", aliases: [], cont: ["NA"] }, { name: "Niger", aliases: [], cont: ["AF"] }, { name: "Nigeria", aliases: [], cont: ["AF"] }, { name: "North Korea", aliases: [], cont: ["AS"] }, { name: "North Macedonia", aliases: ["macedonia"], cont: ["EU"] }, { name: "Norway", aliases: [], cont: ["EU"] }, { name: "Oman", aliases: [], cont: ["AS"] }, { name: "Pakistan", aliases: [], cont: ["AS"] }, { name: "Palau", aliases: [], cont: ["OC"] }, { name: "Palestine", aliases: [], cont: ["AS"] }, { name: "Panama", aliases: [], cont: ["NA"] }, { name: "Papua New Guinea", aliases: ["png"], cont: ["OC"] }, { name: "Paraguay", aliases: [], cont: ["SA"] }, { name: "Peru", aliases: [], cont: ["SA"] }, { name: "Philippines", aliases: [], cont: ["AS"] }, { name: "Poland", aliases: ["polska"], cont: ["EU"] }, { name: "Portugal", aliases: [], cont: ["EU"] }, { name: "Qatar", aliases: [], cont: ["AS"] }, { name: "Romania", aliases: [], cont: ["EU"] }, { name: "Russia", aliases: ["russian federation"], cont: ["EU", "AS"] }, { name: "Rwanda", aliases: [], cont: ["AF"] }, { name: "Saint Kitts and Nevis", aliases: [], cont: ["NA"] }, { name: "Saint Lucia", aliases: [], cont: ["NA"] }, { name: "Saint Vincent and the Grenadines", aliases: [], cont: ["NA"] }, { name: "Samoa", aliases: [], cont: ["OC"] }, { name: "San Marino", aliases: [], cont: ["EU"] }, { name: "Sao Tome and Principe", aliases: [], cont: ["AF"] }, { name: "Saudi Arabia", aliases: [], cont: ["AS"] }, { name: "Senegal", aliases: [], cont: ["AF"] }, { name: "Serbia", aliases: [], cont: ["EU"] }, { name: "Seychelles", aliases: [], cont: ["AF"] }, { name: "Sierra Leone", aliases: [], cont: ["AF"] }, { name: "Singapore", aliases: [], cont: ["AS"] }, { name: "Slovakia", aliases: [], cont: ["EU"] }, { name: "Slovenia", aliases: [], cont: ["EU"] }, { name: "Solomon Islands", aliases: [], cont: ["OC"] }, { name: "Somalia", aliases: [], cont: ["AF"] }, { name: "South Africa", aliases: [], cont: ["AF"] }, { name: "South Korea", aliases: ["korea"], cont: ["AS"] }, { name: "South Sudan", aliases: [], cont: ["AF"] }, { name: "Spain", aliases: ["espana"], cont: ["EU"] }, { name: "Sri Lanka", aliases: [], cont: ["AS"] }, { name: "Sudan", aliases: [], cont: ["AF"] }, { name: "Suriname", aliases: [], cont: ["SA"] }, { name: "Sweden", aliases: [], cont: ["EU"] }, { name: "Switzerland", aliases: [], cont: ["EU"] }, { name: "Syria", aliases: [], cont: ["AS"] }, { name: "Taiwan", aliases: [], cont: ["AS"] }, { name: "Tajikistan", aliases: [], cont: ["AS"] }, { name: "Tanzania", aliases: [], cont: ["AF"] }, { name: "Thailand", aliases: [], cont: ["AS"] }, { name: "Timor-Leste", aliases: ["east timor"], cont: ["AS"] }, { name: "Togo", aliases: [], cont: ["AF"] }, { name: "Tonga", aliases: [], cont: ["OC"] }, { name: "Trinidad and Tobago", aliases: ["trinidad"], cont: ["NA"] }, { name: "Tunisia", aliases: [], cont: ["AF"] }, { name: "Turkey", aliases: ["turkiye"], cont: ["AS", "EU"] }, { name: "Turkmenistan", aliases: [], cont: ["AS"] }, { name: "Tuvalu", aliases: [], cont: ["OC"] }, { name: "Uganda", aliases: [], cont: ["AF"] }, { name: "Ukraine", aliases: [], cont: ["EU"] }, { name: "United Arab Emirates", aliases: ["uae"], cont: ["AS"] }, { name: "United Kingdom", aliases: ["uk", "britain", "great britain", "england", "scotland", "wales", "northern ireland"], cont: ["EU"] }, { name: "United States", aliases: ["usa", "us", "united states of america", "america"], cont: ["NA"] }, { name: "Uruguay", aliases: [], cont: ["SA"] }, { name: "Uzbekistan", aliases: [], cont: ["AS"] }, { name: "Vanuatu", aliases: [], cont: ["OC"] }, { name: "Vatican City", aliases: ["vatican", "holy see"], cont: ["EU"] }, { name: "Venezuela", aliases: [], cont: ["SA"] }, { name: "Vietnam", aliases: ["viet nam"], cont: ["AS"] }, { name: "Yemen", aliases: [], cont: ["AS"] }, { name: "Zambia", aliases: [], cont: ["AF"] }, { name: "Zimbabwe", aliases: [], cont: ["AF"] }];

  // src/lib/game/match.ts
  var norm = (s) => s.replace(/ð/gi, "d").replace(/þ/gi, "th").replace(/æ/gi, "ae").replace(/ł/gi, "l").replace(/ø/gi, "o").replace(/ħ/gi, "h").replace(/đ/gi, "d").replace(/ß/g, "ss").replace(/œ/gi, "oe").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim().replace(/^the /, ""), COUNTRIES = countries_default.map((c) => ({
    ...c,
    id: c.name,
    aliases: [norm(c.name), ...c.aliases.map(norm)]
  })), countryByName = (name) => COUNTRIES.find((c) => c.name === name);
  function lev(a, b) {
    let d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      let cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost), i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && (d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1));
    }
    return d[a.length][b.length];
  }
  function match(text, entries, strip) {
    let q = norm(text);
    if (strip && (q = q.replace(strip, "")), !q) return null;
    for (let e of entries) if (e.aliases.includes(q)) return { e, near: !1 };
    if (q.length < 4) return null;
    let best = null;
    for (let e of entries) for (let a of e.aliases) {
      let d = lev(q, a), max = q.length >= 9 ? 2 : 1;
      d <= max && (!best || d < best.d) && (best = { e, d });
    }
    return best ? { e: best.e, near: !0 } : null;
  }
  var CONTINENT_WORDS = ["africa", "asia", "europe", "north america", "south america", "oceania", "america", "antarctica", "australasia"], isContinent = (text) => CONTINENT_WORDS.includes(norm(text));

  // src/lib/game/rules.ts
  var rules_exports = {};
  __export(rules_exports, {
    CLASSES: () => CLASSES,
    CONT: () => CONT,
    CONT3: () => CONT3,
    COUNTRY_MS: () => COUNTRY_MS,
    COUNTRY_TRIES: () => COUNTRY_TRIES,
    GRACE_MS: () => GRACE_MS,
    LADDER: () => LADDER,
    MAX_DAY_SCORE: () => MAX_DAY_SCORE,
    MILESTONES: () => MILESTONES,
    NAMED_CITY: () => NAMED_CITY,
    NAMED_COUNTRY: () => NAMED_COUNTRY,
    PREVIEW_MS: () => PREVIEW_MS,
    ROUNDS_PER_DAY: () => ROUNDS_PER_DAY,
    ROUND_MS: () => ROUND_MS,
    SCORE_BANDS: () => SCORE_BANDS,
    STOP_TYPES: () => STOP_TYPES,
    TIERS: () => TIERS,
    TRY_COST: () => TRY_COST,
    band: () => band,
    classFor: () => classFor,
    kmBetween: () => kmBetween,
    legFlown: () => legFlown,
    nextClass: () => nextClass,
    stepMs: () => stepMs
  });
  var ROUNDS_PER_DAY = 5, STOP_TYPES = ["Landmark", "Food", "Language", "Street View", "Close-up"], MAX_DAY_SCORE = 500, PREVIEW_MS = 3e3, ROUND_MS = 3e4, COUNTRY_MS = 45e3, COUNTRY_TRIES = 3, TRY_COST = 10, stepMs = (step) => step === "country" ? 45e3 : 3e4, GRACE_MS = 3e3, TIERS = {
    native: { name: "Born There", score: 100, blurb: "All three right. Locals ask you for directions." },
    local: { name: "Local", score: 85, blurb: "Right city. You know where the good coffee is." },
    traveller: { name: "Traveller", score: 60, blurb: "Right region. You left the capital at least once." },
    backpacker: { name: "Backpacker", score: 30, blurb: "Right country. Passport stamped." },
    lost: { name: "Lost Luggage", score: 15, blurb: "Went deeper and got lost. Half a stamp." },
    tourist: { name: "Tourist", score: 10, blurb: "Right continent. You've seen the brochure." },
    miss: { name: "Window Seat", score: 0, blurb: "Watched it fly by. Now you know it." }
  }, LADDER = ["native", "local", "traveller", "backpacker", "lost", "tourist"], SCORE_BANDS = [
    { min: 0, name: "Armchair traveller", verdict: "You've seen the world through a screen. Plenty of runway left." },
    { min: 121, name: "Weekend tripper", verdict: "A few good trips in the bag." },
    { min: 221, name: "Seasoned traveller", verdict: "You've left the tourist trail more than once." },
    { min: 321, name: "Globetrotter", verdict: "Customs officers recognise you." },
    { min: 421, name: "Citizen of the world", verdict: "You don't visit places. You go back to them." }
  ], band = (s) => [...SCORE_BANDS].reverse().find((b) => s >= b.min), CONT = { AF: "Africa", AS: "Asia", EU: "Europe", NA: "North America", SA: "South America", OC: "Oceania" }, CONT3 = { AF: "AFR", AS: "ASI", EU: "EUR", NA: "NAM", SA: "SAM", OC: "OCE" }, NAMED_COUNTRY = ["backpacker", "lost", "traveller", "local", "native"], NAMED_CITY = ["local", "native"], CLASSES = [
    { min: 0, name: "Economy" },
    { min: 5, name: "Premium economy" },
    { min: 12, name: "Business" },
    { min: 25, name: "First" },
    { min: 50, name: "Diplomatic" }
  ], classFor = (n) => [...CLASSES].reverse().find((c) => n >= c.min), nextClass = (n) => CLASSES.find((c) => c.min > n), MILESTONES = [3, 7, 14, 30, 50, 100];
  function kmBetween(a, b) {
    if (a.lat === void 0 || a.lng === void 0 || b.lat === void 0 || b.lng === void 0) return null;
    let rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad, h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) / 10) * 10;
  }
  var legFlown = (tier) => !!tier && NAMED_CITY.includes(tier);

  // src/content/capitals.json
  var capitals_default = {
    Afghanistan: ["Kabul", 34.53, 69.17],
    Albania: ["Tirana", 41.33, 19.82],
    Algeria: ["Algiers", 36.75, 3.06],
    Andorra: ["Andorra la Vella", 42.51, 1.52],
    Angola: ["Luanda", -8.84, 13.23],
    "Antigua and Barbuda": ["St. John's", 17.12, -61.85],
    Argentina: ["Buenos Aires", -34.6, -58.38],
    Armenia: ["Yerevan", 40.18, 44.51],
    Australia: ["Canberra", -35.28, 149.13],
    Austria: ["Vienna", 48.21, 16.37],
    Azerbaijan: ["Baku", 40.41, 49.87],
    Bahamas: ["Nassau", 25.05, -77.35],
    Bahrain: ["Manama", 26.23, 50.59],
    Bangladesh: ["Dhaka", 23.81, 90.41],
    Barbados: ["Bridgetown", 13.1, -59.62],
    Belarus: ["Minsk", 53.9, 27.57],
    Belgium: ["Brussels", 50.85, 4.35],
    Belize: ["Belmopan", 17.25, -88.77],
    Benin: ["Porto-Novo", 6.5, 2.6],
    Bhutan: ["Thimphu", 27.47, 89.64],
    Bolivia: ["La Paz", -16.5, -68.15],
    "Bosnia and Herzegovina": ["Sarajevo", 43.86, 18.41],
    Botswana: ["Gaborone", -24.65, 25.91],
    Brazil: ["Bras\xEDlia", -15.79, -47.88],
    Brunei: ["Bandar Seri Begawan", 4.9, 114.94],
    Bulgaria: ["Sofia", 42.7, 23.32],
    "Burkina Faso": ["Ouagadougou", 12.37, -1.52],
    Burundi: ["Gitega", -3.43, 29.92],
    Cambodia: ["Phnom Penh", 11.56, 104.92],
    Cameroon: ["Yaound\xE9", 3.87, 11.52],
    Canada: ["Ottawa", 45.42, -75.7],
    "Cape Verde": ["Praia", 14.93, -23.51],
    "Central African Republic": ["Bangui", 4.39, 18.56],
    Chad: ["N'Djamena", 12.13, 15.06],
    Chile: ["Santiago", -33.45, -70.67],
    China: ["Beijing", 39.9, 116.41],
    Colombia: ["Bogot\xE1", 4.71, -74.07],
    Comoros: ["Moroni", -11.7, 43.26],
    Congo: ["Brazzaville", -4.27, 15.28],
    "DR Congo": ["Kinshasa", -4.44, 15.27],
    "Costa Rica": ["San Jos\xE9", 9.93, -84.09],
    Croatia: ["Zagreb", 45.81, 15.98],
    Cuba: ["Havana", 23.11, -82.37],
    Cyprus: ["Nicosia", 35.19, 33.38],
    Czechia: ["Prague", 50.08, 14.44],
    Denmark: ["Copenhagen", 55.68, 12.57],
    Djibouti: ["Djibouti", 11.59, 43.15],
    Dominica: ["Roseau", 15.3, -61.39],
    "Dominican Republic": ["Santo Domingo", 18.49, -69.93],
    Ecuador: ["Quito", -0.18, -78.47],
    Egypt: ["Cairo", 30.04, 31.24],
    "El Salvador": ["San Salvador", 13.69, -89.22],
    "Equatorial Guinea": ["Malabo", 3.75, 8.78],
    Eritrea: ["Asmara", 15.32, 38.93],
    Estonia: ["Tallinn", 59.44, 24.75],
    Eswatini: ["Mbabane", -26.31, 31.14],
    Ethiopia: ["Addis Ababa", 9.03, 38.74],
    Fiji: ["Suva", -18.14, 178.44],
    Finland: ["Helsinki", 60.17, 24.94],
    France: ["Paris", 48.86, 2.35],
    Gabon: ["Libreville", 0.42, 9.47],
    Gambia: ["Banjul", 13.45, -16.58],
    Georgia: ["Tbilisi", 41.72, 44.79],
    Germany: ["Berlin", 52.52, 13.4],
    Ghana: ["Accra", 5.6, -0.19],
    Greece: ["Athens", 37.98, 23.73],
    Grenada: ["St. George's", 12.06, -61.75],
    Guatemala: ["Guatemala City", 14.63, -90.51],
    Guinea: ["Conakry", 9.64, -13.58],
    "Guinea-Bissau": ["Bissau", 11.86, -15.6],
    Guyana: ["Georgetown", 6.8, -58.16],
    Haiti: ["Port-au-Prince", 18.59, -72.31],
    Honduras: ["Tegucigalpa", 14.07, -87.19],
    Hungary: ["Budapest", 47.5, 19.04],
    Iceland: ["Reykjav\xEDk", 64.15, -21.94],
    India: ["New Delhi", 28.61, 77.21],
    Indonesia: ["Jakarta", -6.21, 106.85],
    Iran: ["Tehran", 35.69, 51.39],
    Iraq: ["Baghdad", 33.31, 44.36],
    Ireland: ["Dublin", 53.35, -6.26],
    Israel: ["Jerusalem", 31.77, 35.21],
    Italy: ["Rome", 41.9, 12.5],
    "Ivory Coast": ["Yamoussoukro", 6.83, -5.29],
    Jamaica: ["Kingston", 18.02, -76.8],
    Japan: ["Tokyo", 35.68, 139.69],
    Jordan: ["Amman", 31.95, 35.93],
    Kazakhstan: ["Astana", 51.17, 71.45],
    Kenya: ["Nairobi", -1.29, 36.82],
    Kiribati: ["South Tarawa", 1.33, 172.98],
    Kosovo: ["Pristina", 42.66, 21.17],
    Kuwait: ["Kuwait City", 29.38, 47.98],
    Kyrgyzstan: ["Bishkek", 42.87, 74.59],
    Laos: ["Vientiane", 17.98, 102.63],
    Latvia: ["Riga", 56.95, 24.11],
    Lebanon: ["Beirut", 33.89, 35.5],
    Lesotho: ["Maseru", -29.31, 27.48],
    Liberia: ["Monrovia", 6.3, -10.8],
    Libya: ["Tripoli", 32.89, 13.19],
    Liechtenstein: ["Vaduz", 47.14, 9.52],
    Lithuania: ["Vilnius", 54.69, 25.28],
    Luxembourg: ["Luxembourg", 49.61, 6.13],
    Madagascar: ["Antananarivo", -18.88, 47.51],
    Malawi: ["Lilongwe", -13.96, 33.79],
    Malaysia: ["Kuala Lumpur", 3.14, 101.69],
    Maldives: ["Mal\xE9", 4.18, 73.51],
    Mali: ["Bamako", 12.64, -8],
    Malta: ["Valletta", 35.9, 14.51],
    "Marshall Islands": ["Majuro", 7.09, 171.38],
    Mauritania: ["Nouakchott", 18.08, -15.98],
    Mauritius: ["Port Louis", -20.16, 57.5],
    Mexico: ["Mexico City", 19.43, -99.13],
    Micronesia: ["Palikir", 6.92, 158.16],
    Moldova: ["Chi\u0219in\u0103u", 47.01, 28.86],
    Monaco: ["Monaco", 43.74, 7.42],
    Mongolia: ["Ulaanbaatar", 47.89, 106.91],
    Montenegro: ["Podgorica", 42.43, 19.26],
    Morocco: ["Rabat", 34.02, -6.84],
    Mozambique: ["Maputo", -25.97, 32.57],
    Myanmar: ["Naypyidaw", 19.76, 96.08],
    Namibia: ["Windhoek", -22.56, 17.08],
    Nauru: ["Yaren", -0.55, 166.92],
    Nepal: ["Kathmandu", 27.72, 85.32],
    Netherlands: ["Amsterdam", 52.37, 4.9],
    "New Zealand": ["Wellington", -41.29, 174.78],
    Nicaragua: ["Managua", 12.11, -86.24],
    Niger: ["Niamey", 13.51, 2.11],
    Nigeria: ["Abuja", 9.08, 7.4],
    "North Korea": ["Pyongyang", 39.04, 125.76],
    "North Macedonia": ["Skopje", 41.99, 21.43],
    Norway: ["Oslo", 59.91, 10.75],
    Oman: ["Muscat", 23.59, 58.41],
    Pakistan: ["Islamabad", 33.68, 73.05],
    Palau: ["Ngerulmud", 7.5, 134.62],
    Palestine: ["Ramallah", 31.9, 35.2],
    Panama: ["Panama City", 8.98, -79.52],
    "Papua New Guinea": ["Port Moresby", -9.44, 147.18],
    Paraguay: ["Asunci\xF3n", -25.26, -57.58],
    Peru: ["Lima", -12.05, -77.04],
    Philippines: ["Manila", 14.6, 120.98],
    Poland: ["Warsaw", 52.23, 21.01],
    Portugal: ["Lisbon", 38.72, -9.14],
    Qatar: ["Doha", 25.29, 51.53],
    Romania: ["Bucharest", 44.43, 26.1],
    Russia: ["Moscow", 55.76, 37.62],
    Rwanda: ["Kigali", -1.94, 30.06],
    "Saint Kitts and Nevis": ["Basseterre", 17.3, -62.72],
    "Saint Lucia": ["Castries", 14.01, -60.99],
    "Saint Vincent and the Grenadines": ["Kingstown", 13.16, -61.22],
    Samoa: ["Apia", -13.83, -171.76],
    "San Marino": ["San Marino", 43.94, 12.45],
    "Sao Tome and Principe": ["S\xE3o Tom\xE9", 0.34, 6.73],
    "Saudi Arabia": ["Riyadh", 24.71, 46.68],
    Senegal: ["Dakar", 14.72, -17.47],
    Serbia: ["Belgrade", 44.79, 20.45],
    Seychelles: ["Victoria", -4.62, 55.45],
    "Sierra Leone": ["Freetown", 8.48, -13.23],
    Singapore: ["Singapore", 1.35, 103.82],
    Slovakia: ["Bratislava", 48.15, 17.11],
    Slovenia: ["Ljubljana", 46.06, 14.51],
    "Solomon Islands": ["Honiara", -9.43, 159.95],
    Somalia: ["Mogadishu", 2.05, 45.32],
    "South Africa": ["Pretoria", -25.75, 28.19],
    "South Korea": ["Seoul", 37.57, 126.98],
    "South Sudan": ["Juba", 4.85, 31.58],
    Spain: ["Madrid", 40.42, -3.7],
    "Sri Lanka": ["Sri Jayawardenepura Kotte", 6.9, 79.92],
    Sudan: ["Khartoum", 15.5, 32.56],
    Suriname: ["Paramaribo", 5.85, -55.2],
    Sweden: ["Stockholm", 59.33, 18.07],
    Switzerland: ["Bern", 46.95, 7.45],
    Syria: ["Damascus", 33.51, 36.29],
    Taiwan: ["Taipei", 25.03, 121.57],
    Tajikistan: ["Dushanbe", 38.56, 68.79],
    Tanzania: ["Dodoma", -6.16, 35.75],
    Thailand: ["Bangkok", 13.76, 100.5],
    "Timor-Leste": ["Dili", -8.56, 125.57],
    Togo: ["Lom\xE9", 6.13, 1.22],
    Tonga: ["Nuku\u02BBalofa", -21.14, -175.2],
    "Trinidad and Tobago": ["Port of Spain", 10.66, -61.51],
    Tunisia: ["Tunis", 36.81, 10.18],
    Turkey: ["Ankara", 39.93, 32.86],
    Turkmenistan: ["Ashgabat", 37.96, 58.33],
    Tuvalu: ["Funafuti", -8.52, 179.2],
    Uganda: ["Kampala", 0.35, 32.58],
    Ukraine: ["Kyiv", 50.45, 30.52],
    "United Arab Emirates": ["Abu Dhabi", 24.45, 54.38],
    "United Kingdom": ["London", 51.51, -0.13],
    "United States": ["Washington", 38.91, -77.04],
    Uruguay: ["Montevideo", -34.9, -56.16],
    Uzbekistan: ["Tashkent", 41.3, 69.24],
    Vanuatu: ["Port Vila", -17.73, 168.32],
    "Vatican City": ["Vatican City", 41.9, 12.45],
    Venezuela: ["Caracas", 10.48, -66.9],
    Vietnam: ["Hanoi", 21.03, 105.85],
    Yemen: ["Sanaa", 15.37, 44.19],
    Zambia: ["Lusaka", -15.39, 28.32],
    Zimbabwe: ["Harare", -17.83, 31.05]
  };

  // src/lib/game/engine.ts
  var CAPITALS = capitals_default, freshStop = () => ({ phase: "ready", step: "country", banked: null, next: null, guesses: [], endsAt: null, tier: null, note: null }), finish = (s, tier, note) => ({ state: { ...s, phase: "done", tier, note, endsAt: null }, event: { kind: "finished", tier, note } });
  function submit(r, s, text, forced) {
    if (s.step === "country") {
      let m2 = match(text, COUNTRIES);
      if (!m2)
        return forced ? finish(s, "miss", `"${text}" is not a country we know.`) : { state: s, event: { kind: "rejected", message: isContinent(text) ? "That is a continent. Name a country." : `"${text}" is not on our map. Try again.` } };
      if (m2.near && !forced) return { state: s, event: { kind: "correction", suggestion: m2.e.name } };
      if (s.guesses.includes(m2.e.name) && !forced) return { state: s, event: { kind: "rejected", message: `You already tried ${m2.e.name}. Use the clue and pick another.` } };
      let guesses2 = [...s.guesses, m2.e.name];
      if (m2.e.name === r.country) return { state: { ...s, guesses: guesses2, phase: "decide", banked: "backpacker", next: "city", endsAt: null }, event: { kind: "right", name: m2.e.name } };
      let misses = (s.misses ?? 0) + 1, triesLeft = 3 - misses;
      return triesLeft > 0 && !forced ? { state: { ...s, guesses: guesses2, misses }, event: { kind: "wrong", name: m2.e.name, triesLeft } } : outOfTries(r, { ...s, guesses: guesses2, misses });
    }
    if (s.step === "city") {
      let entries = [{ id: "city", name: r.cityName, aliases: r.city.map(norm) }, { id: "region", name: r.regionName, aliases: r.region.map(norm) }], m2 = match(text, entries);
      if (m2 && m2.near && !forced) return { state: s, event: { kind: "correction", suggestion: m2.e.name } };
      let guesses2 = [...s.guesses, m2 ? m2.e.name : text];
      return m2?.e.id === "city" ? { state: { ...s, guesses: guesses2, phase: "decide", banked: "local", next: "spot", endsAt: null }, event: { kind: "right", name: m2.e.name } } : m2?.e.id === "region" ? finish({ ...s, guesses: guesses2 }, "traveller", "Right region, but not the city.") : finish({ ...s, guesses: guesses2 }, "lost", `"${text}" was not it. You dropped to half a stamp.`);
    }
    let m = match(text, [{ id: "spot", name: r.spotName, aliases: r.spot.map(norm) }], r.spotStrip ? new RegExp(r.spotStrip) : void 0), guesses = [...s.guesses, text];
    return m ? finish({ ...s, guesses }, "native", "You got all three.") : finish({ ...s, guesses }, "traveller", `"${text}" was not it. You dropped one tier.`);
  }
  function applyAction(r, s, a, now) {
    if (s.phase === "done") return { state: s, event: { kind: "ignored" } };
    if (a.type === "start")
      return s.phase !== "ready" ? { state: s, event: { kind: "ignored" } } : { state: { ...s, phase: "input", endsAt: now + 3e3 + 45e3 }, event: { kind: "started" } };
    if (a.type === "decide")
      return s.phase !== "decide" || !s.next || !s.banked ? { state: s, event: { kind: "ignored" } } : a.deeper ? { state: { ...s, phase: "input", step: s.next, next: null, endsAt: now + 3e4 }, event: { kind: "advanced" } } : finish(s, s.banked, "Stamp banked.");
    if (s.phase !== "input" || s.endsAt === null) return { state: s, event: { kind: "ignored" } };
    let late = now > s.endsAt + 3e3;
    if (a.type === "guess") {
      let text = a.text.trim().slice(0, 80);
      return text ? late ? timeUp(r, s, text) : submit(r, s, text, !1) : { state: s, event: { kind: "ignored" } };
    }
    return now < s.endsAt - 3e3 ? { state: s, event: { kind: "ignored" } } : timeUp(r, s, a.text?.trim().slice(0, 80));
  }
  function timeUp(r, s, draft) {
    return draft ? submit(r, s, draft, !0) : s.step === "country" ? s.misses ? outOfTries(r, s) : finish(s, "miss", "Time ran out before you named a country.") : finish(s, s.banked, "Time ran out. You kept what you had banked.");
  }
  function outOfTries(r, s) {
    let target = countryByName(r.country), close = s.guesses.some((g) => countryByName(g)?.cont.some((c) => target.cont.includes(c)));
    return finish(s, close ? "tourist" : "miss", close ? "Right continent. The Tourist stamp is yours." : "Not this time. Now you know it.");
  }
  var COMPASS = ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"], ARROWS = ["\u2191", "\u2197", "\u2192", "\u2198", "\u2193", "\u2199", "\u2190", "\u2196"];
  function heading(from, to) {
    let rad = Math.PI / 180, merc = (lat) => Math.log(Math.tan(Math.PI / 4 + lat * rad / 2)), dLng = (to.lng - from.lng) * rad;
    Math.abs(dLng) > Math.PI && (dLng -= Math.sign(dLng) * 2 * Math.PI);
    let k = Math.round((Math.atan2(dLng, merc(to.lat) - merc(from.lat)) / rad + 360) % 360 / 45) % 8;
    return { dir: COMPASS[k], arrow: ARROWS[k] };
  }
  function countryClues(r, s) {
    let misses = s.misses ?? 0;
    return s.step !== "country" || s.phase !== "input" || !misses ? null : { tries: s.guesses.slice(0, misses).map((name) => {
      let cap = CAPITALS[name], at = cap && { lat: cap[1], lng: cap[2] }, km = at ? kmBetween(at, r) : null;
      return { name, capital: cap?.[0] ?? null, km, ...at && r.lat !== void 0 && r.lng !== void 0 && km ? heading(at, { lat: r.lat, lng: r.lng }) : { dir: null, arrow: null } };
    }), triesLeft: 3 - misses, continent: misses >= 2 ? CONT[countryByName(r.country).cont[0]] : null };
  }
  function stopPoints(s) {
    if (!s.tier) return 0;
    let base = TIERS[s.tier].score;
    return NAMED_COUNTRY.includes(s.tier) ? Math.max(TIERS.tourist.score, base - 10 * (s.misses ?? 0)) : base;
  }

  // src/content/cities.json
  var cities_default = {
    Chile: [
      "Santiago",
      "Valpara\xEDso",
      "Vi\xF1a del Mar",
      "Concepci\xF3n",
      "La Serena",
      "Antofagasta",
      "Temuco",
      "Rancagua",
      "Talca",
      "Arica",
      "Iquique",
      "Puerto Montt",
      "Chill\xE1n",
      "Calama",
      "Coquimbo",
      "Osorno",
      "Valdivia",
      "Punta Arenas",
      "Copiap\xF3",
      "Quilpu\xE9",
      "Puerto Varas",
      "San Pedro de Atacama"
    ],
    Georgia: [
      "Tbilisi",
      "Batumi",
      "Kutaisi",
      "Rustavi",
      "Zugdidi",
      "Gori",
      "Poti",
      "Kobuleti",
      "Telavi",
      "Samtredia",
      "Khashuri",
      "Senaki",
      "Zestafoni",
      "Marneuli",
      "Ozurgeti",
      "Borjomi",
      "Mtskheta",
      "Sighnaghi",
      "Stepantsminda",
      "Mestia"
    ],
    Iceland: [
      "Reykjav\xEDk",
      "K\xF3pavogur",
      "Hafnarfj\xF6r\xF0ur",
      "Akureyri",
      "Reykjanesb\xE6r",
      "Gar\xF0ab\xE6r",
      "Mosfellsb\xE6r",
      "Selfoss",
      "Akranes",
      "\xCDsafj\xF6r\xF0ur",
      "Egilssta\xF0ir",
      "H\xFAsav\xEDk",
      "V\xEDk",
      "H\xF6fn",
      "Sey\xF0isfj\xF6r\xF0ur",
      "Vestmannaeyjar",
      "Borgarnes",
      "Stykkish\xF3lmur"
    ],
    Portugal: [
      "Lisbon",
      "Porto",
      "Braga",
      "Coimbra",
      "Faro",
      "Aveiro",
      "\xC9vora",
      "Funchal",
      "Set\xFAbal",
      "Sintra",
      "Cascais",
      "Guimar\xE3es",
      "Viseu",
      "Leiria",
      "Lagos",
      "Albufeira",
      "Ponta Delgada",
      "Viana do Castelo",
      "Tavira",
      "\xD3bidos",
      "Nazar\xE9"
    ],
    Morocco: [
      "Casablanca",
      "Rabat",
      "Marrakesh",
      "Fes",
      "Tangier",
      "Agadir",
      "Meknes",
      "Oujda",
      "Tetouan",
      "Chefchaouen",
      "Essaouira",
      "Ouarzazate",
      "El Jadida",
      "Nador",
      "Kenitra",
      "Ifrane",
      "Asilah",
      "Al Hoceima"
    ],
    Thailand: [
      "Bangkok",
      "Chiang Mai",
      "Chiang Rai",
      "Phuket",
      "Pattaya",
      "Hat Yai",
      "Khon Kaen",
      "Udon Thani",
      "Nakhon Ratchasima",
      "Ayutthaya",
      "Sukhothai",
      "Krabi",
      "Hua Hin",
      "Pai",
      "Lampang",
      "Surat Thani",
      "Ubon Ratchathani"
    ],
    Belgium: [
      "Brussels",
      "Antwerp",
      "Ghent",
      "Bruges",
      "Li\xE8ge",
      "Leuven",
      "Namur",
      "Mechelen",
      "Charleroi",
      "Mons",
      "Ostend",
      "Hasselt",
      "Kortrijk",
      "Dinant",
      "Spa",
      "Ypres"
    ],
    Poland: [
      "Warsaw",
      "Krak\xF3w",
      "Wroc\u0142aw",
      "Gda\u0144sk",
      "Pozna\u0144",
      "\u0141\xF3d\u017A",
      "Szczecin",
      "Lublin",
      "Katowice",
      "Toru\u0144",
      "Zakopane",
      "Bia\u0142ystok",
      "Rzesz\xF3w",
      "Sopot",
      "Gdynia",
      "Bydgoszcz",
      "Olsztyn"
    ],
    Argentina: [
      "Buenos Aires",
      "C\xF3rdoba",
      "Rosario",
      "Mendoza",
      "La Plata",
      "Mar del Plata",
      "Salta",
      "San Miguel de Tucum\xE1n",
      "Bariloche",
      "Ushuaia",
      "Puerto Madryn",
      "El Calafate",
      "Neuqu\xE9n",
      "Santa Fe",
      "San Juan",
      "Puerto Iguaz\xFA"
    ],
    Cuba: [
      "Havana",
      "Santiago de Cuba",
      "Camag\xFCey",
      "Holgu\xEDn",
      "Trinidad",
      "Cienfuegos",
      "Santa Clara",
      "Matanzas",
      "Varadero",
      "Pinar del R\xEDo",
      "Vi\xF1ales",
      "Baracoa",
      "Bayamo",
      "Guant\xE1namo"
    ],
    Italy: [
      "Rome",
      "Milan",
      "Naples",
      "Venice",
      "Florence",
      "Turin",
      "Bologna",
      "Genoa",
      "Palermo",
      "Bari",
      "Verona",
      "Pisa",
      "Catania",
      "Siena",
      "Trieste",
      "Amalfi",
      "Sorrento",
      "Padua",
      "Lecce"
    ],
    Malaysia: [
      "Kuala Lumpur",
      "George Town",
      "Ipoh",
      "Johor Bahru",
      "Malacca",
      "Kota Kinabalu",
      "Kuching",
      "Shah Alam",
      "Petaling Jaya",
      "Putrajaya",
      "Kota Bharu",
      "Kuala Terengganu",
      "Seremban",
      "Alor Setar",
      "Miri"
    ],
    Malta: [
      "Valletta",
      "Mdina",
      "Sliema",
      "St Julian's",
      "Birgu",
      "Rabat",
      "Marsaxlokk",
      "Mosta",
      "Qormi",
      "Birkirkara",
      "Victoria",
      "Mellie\u0127a",
      "St Paul's Bay",
      "\u017Bebbu\u0121",
      "Senglea"
    ],
    Japan: [
      "Tokyo",
      "Osaka",
      "Kyoto",
      "Yokohama",
      "Nagoya",
      "Sapporo",
      "Fukuoka",
      "Kobe",
      "Hiroshima",
      "Nara",
      "Sendai",
      "Kanazawa",
      "Nagasaki",
      "Naha",
      "Hakodate",
      "Nikko",
      "Kamakura"
    ],
    China: [
      "Beijing",
      "Shanghai",
      "Guangzhou",
      "Shenzhen",
      "Chengdu",
      "Xi'an",
      "Hangzhou",
      "Chongqing",
      "Wuhan",
      "Nanjing",
      "Suzhou",
      "Guilin",
      "Harbin",
      "Kunming",
      "Qingdao",
      "Xiamen",
      "Lhasa"
    ],
    Brazil: [
      "Rio de Janeiro",
      "S\xE3o Paulo",
      "Bras\xEDlia",
      "Salvador",
      "Fortaleza",
      "Belo Horizonte",
      "Manaus",
      "Recife",
      "Curitiba",
      "Porto Alegre",
      "Florian\xF3polis",
      "Bel\xE9m",
      "Natal",
      "Paraty",
      "Foz do Igua\xE7u",
      "Ouro Preto"
    ],
    Norway: [
      "Oslo",
      "Bergen",
      "Trondheim",
      "Stavanger",
      "Troms\xF8",
      "\xC5lesund",
      "Bod\xF8",
      "Kristiansand",
      "Drammen",
      "Fredrikstad",
      "Lillehammer",
      "Fl\xE5m",
      "Alta",
      "Hammerfest",
      "Narvik"
    ],
    Tanzania: [
      "Dar es Salaam",
      "Zanzibar City",
      "Dodoma",
      "Arusha",
      "Mwanza",
      "Moshi",
      "Tanga",
      "Mbeya",
      "Morogoro",
      "Iringa",
      "Bagamoyo",
      "Kigoma",
      "Mtwara",
      "Tabora"
    ],
    Estonia: [
      "Tallinn",
      "Tartu",
      "Narva",
      "P\xE4rnu",
      "Kohtla-J\xE4rve",
      "Viljandi",
      "Maardu",
      "Rakvere",
      "Kuressaare",
      "Sillam\xE4e",
      "Valga",
      "V\xF5ru",
      "J\xF5hvi",
      "Haapsalu",
      "Keila",
      "Paide",
      "Otep\xE4\xE4"
    ],
    Vietnam: [
      "Hanoi",
      "Ho Chi Minh City",
      "Da Nang",
      "Hai Phong",
      "Hue",
      "Hoi An",
      "Nha Trang",
      "Can Tho",
      "Da Lat",
      "Vung Tau",
      "Ha Long",
      "Quy Nhon",
      "Sa Pa",
      "Ninh Binh",
      "Phan Thiet",
      "Buon Ma Thuot",
      "Vinh",
      "Phu Quoc"
    ],
    France: [
      "Paris",
      "Marseille",
      "Lyon",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille",
      "Rennes",
      "Reims",
      "Toulon",
      "Grenoble",
      "Dijon",
      "Avignon",
      "Aix-en-Provence",
      "Cannes",
      "Brest",
      "Angers"
    ],
    Jordan: [
      "Amman",
      "Zarqa",
      "Irbid",
      "Aqaba",
      "Petra",
      "Wadi Musa",
      "Madaba",
      "Jerash",
      "Salt",
      "Karak",
      "Mafraq",
      "Ma'an",
      "Ajloun",
      "Tafilah",
      "Ramtha",
      "Russeifa",
      "Wadi Rum"
    ],
    Ireland: [
      "Dublin",
      "Cork",
      "Limerick",
      "Galway",
      "Waterford",
      "Kilkenny",
      "Drogheda",
      "Dundalk",
      "Sligo",
      "Athlone",
      "Wexford",
      "Killarney",
      "Ennis",
      "Tralee",
      "Bray",
      "Navan",
      "Letterkenny",
      "Swords"
    ],
    Austria: [
      "Vienna",
      "Graz",
      "Linz",
      "Salzburg",
      "Innsbruck",
      "Klagenfurt",
      "Villach",
      "Wels",
      "St. P\xF6lten",
      "Dornbirn",
      "Bregenz",
      "Hallstatt",
      "Leoben",
      "Steyr",
      "Krems",
      "Eisenstadt",
      "Kitzb\xFChel",
      "Wiener Neustadt"
    ],
    Colombia: [
      "Bogot\xE1",
      "Medell\xEDn",
      "Cali",
      "Barranquilla",
      "Cartagena",
      "Santa Marta",
      "Bucaramanga",
      "Pereira",
      "Manizales",
      "C\xFAcuta",
      "Ibagu\xE9",
      "Villavicencio",
      "Pasto",
      "Armenia",
      "Popay\xE1n",
      "Leticia",
      "Monter\xEDa",
      "Salento",
      "Villa de Leyva"
    ],
    "South Korea": [
      "Seoul",
      "Busan",
      "Incheon",
      "Daegu",
      "Daejeon",
      "Gwangju",
      "Ulsan",
      "Suwon",
      "Jeonju",
      "Gyeongju",
      "Jeju City",
      "Chuncheon",
      "Gangneung",
      "Pohang",
      "Changwon",
      "Andong",
      "Yeosu",
      "Mokpo",
      "Sokcho"
    ],
    Cambodia: [
      "Phnom Penh",
      "Siem Reap",
      "Battambang",
      "Sihanoukville",
      "Kampot",
      "Kep",
      "Kampong Cham",
      "Kratie",
      "Pursat",
      "Takeo",
      "Poipet",
      "Koh Kong",
      "Banlung",
      "Kampong Thom",
      "Stung Treng",
      "Svay Rieng",
      "Prey Veng"
    ],
    Spain: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Seville",
      "Zaragoza",
      "M\xE1laga",
      "Bilbao",
      "Granada",
      "C\xF3rdoba",
      "Palma",
      "Alicante",
      "San Sebasti\xE1n",
      "Salamanca",
      "Toledo",
      "Santiago de Compostela",
      "C\xE1diz",
      "Girona",
      "Murcia",
      "Valladolid",
      "Las Palmas"
    ],
    Turkey: [
      "Istanbul",
      "Ankara",
      "Izmir",
      "Bursa",
      "Antalya",
      "Adana",
      "Konya",
      "Gaziantep",
      "Trabzon",
      "Kayseri",
      "Eski\u015Fehir",
      "Bodrum",
      "Edirne",
      "Mersin",
      "Diyarbak\u0131r",
      "\u015Eanl\u0131urfa",
      "\xC7anakkale",
      "Fethiye",
      "G\xF6reme"
    ],
    "South Africa": [
      "Johannesburg",
      "Cape Town",
      "Durban",
      "Pretoria",
      "Gqeberha",
      "Bloemfontein",
      "East London",
      "Polokwane",
      "Mbombela",
      "Kimberley",
      "Pietermaritzburg",
      "Stellenbosch",
      "George",
      "Knysna",
      "Rustenburg",
      "Soweto",
      "Paarl",
      "Hermanus"
    ],
    Mexico: [
      "Mexico City",
      "Guadalajara",
      "Monterrey",
      "Puebla",
      "Tijuana",
      "Le\xF3n",
      "Canc\xFAn",
      "M\xE9rida",
      "Oaxaca",
      "Quer\xE9taro",
      "San Miguel de Allende",
      "Guanajuato",
      "Acapulco",
      "Veracruz",
      "Morelia",
      "Chihuahua",
      "Puerto Vallarta",
      "Toluca",
      "Tulum"
    ],
    Germany: [
      "Berlin",
      "Hamburg",
      "Munich",
      "Cologne",
      "Frankfurt",
      "Stuttgart",
      "D\xFCsseldorf",
      "Leipzig",
      "Dresden",
      "Nuremberg",
      "Hanover",
      "Bremen",
      "Heidelberg",
      "F\xFCssen",
      "Schwangau",
      "Garmisch-Partenkirchen",
      "Rothenburg ob der Tauber",
      "Bonn",
      "Augsburg",
      "Freiburg"
    ],
    Egypt: [
      "Cairo",
      "Alexandria",
      "Giza",
      "Luxor",
      "Aswan",
      "Sharm El Sheikh",
      "Hurghada",
      "Port Said",
      "Suez",
      "Ismailia",
      "Mansoura",
      "Tanta",
      "Asyut",
      "Faiyum",
      "Dahab",
      "Marsa Alam",
      "Siwa",
      "Zagazig"
    ],
    Croatia: [
      "Zagreb",
      "Split",
      "Rijeka",
      "Osijek",
      "Zadar",
      "Dubrovnik",
      "Pula",
      "\u0160ibenik",
      "Rovinj",
      "Vara\u017Edin",
      "Karlovac",
      "Trogir",
      "Makarska",
      "Pore\u010D",
      "Hvar",
      "Kor\u010Dula",
      "Slavonski Brod",
      "Opatija"
    ],
    "United States": [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Francisco",
      "Seattle",
      "Boston",
      "Miami",
      "New Orleans",
      "Denver",
      "Detroit",
      "Las Vegas",
      "Nashville",
      "Atlanta",
      "Washington"
    ],
    Myanmar: [
      "Yangon",
      "Mandalay",
      "Naypyidaw",
      "Bagan",
      "Mawlamyine",
      "Bago",
      "Taunggyi",
      "Pathein",
      "Sittwe",
      "Myitkyina",
      "Monywa",
      "Pyin Oo Lwin",
      "Hpa-an",
      "Dawei",
      "Nyaung-U",
      "Kalaw",
      "Lashio"
    ],
    Netherlands: [
      "Amsterdam",
      "Rotterdam",
      "The Hague",
      "Utrecht",
      "Eindhoven",
      "Groningen",
      "Tilburg",
      "Almere",
      "Breda",
      "Nijmegen",
      "Haarlem",
      "Arnhem",
      "Maastricht",
      "Leiden",
      "Delft",
      "Zwolle",
      "Den Bosch",
      "Alkmaar",
      "Gouda"
    ],
    Canada: [
      "Toronto",
      "Montreal",
      "Vancouver",
      "Calgary",
      "Edmonton",
      "Ottawa",
      "Winnipeg",
      "Quebec City",
      "Hamilton",
      "Halifax",
      "Victoria",
      "Saskatoon",
      "Regina",
      "St. John's",
      "Kelowna",
      "Banff",
      "Whistler",
      "Moncton",
      "Charlottetown",
      "Sherbrooke"
    ]
  };

  // src/content/itineraries.json
  var itineraries_default = [
    {
      offset: -3,
      flight: "001",
      rounds: [
        {
          type: "Landmark",
          prompt: "Where is this structure?",
          img: "/clues/d1s3.jpg",
          alt: "Huge steel spheres lit with small lights, joined by tubes, seen from below at dusk",
          country: "Belgium",
          regionName: "Brussels-Capital Region",
          region: [
            "brussels capital region",
            "brussels region",
            "bruxelles capitale",
            "region de bruxelles capitale"
          ],
          cityName: "Brussels",
          city: [
            "brussels",
            "bruxelles",
            "brussel"
          ],
          spotLabel: "What is this landmark called?",
          spotWord: "Landmark",
          spotName: "The Atomium",
          spot: [
            "atomium",
            "the atomium"
          ],
          airport: "BRU",
          fact: "The Atomium was built for the 1958 World's Fair: nine steel spheres arranged like a cell of an iron crystal, magnified 165 billion times.",
          crowd: [
            61,
            55,
            47
          ],
          credit: {
            title: "Atomium, Bruselas, B\xE9lgica, 2021-12-15, DD 148-150 HDR",
            author: "Diego Delso",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Atomium,_Bruselas,_B%C3%A9lgica,_2021-12-15,_DD_148-150_HDR.jpg"
          },
          lat: 50.85,
          lng: 4.35
        },
        {
          type: "Food",
          prompt: "Where does this noodle soup come from?",
          img: "/clues/d1s2.jpg",
          alt: "A bowl of curry noodle soup topped with a nest of crispy fried noodles, with chopsticks and a spoon",
          country: "Thailand",
          regionName: "Chiang Mai Province",
          region: [
            "chiang mai province",
            "northern thailand",
            "lanna"
          ],
          cityName: "Chiang Mai",
          city: [
            "chiang mai",
            "chiangmai"
          ],
          spotLabel: "What is this dish called?",
          spotWord: "Dish",
          spotName: "Khao soi",
          spot: [
            "khao soi",
            "khao soy",
            "khao sawy",
            "khao soi gai",
            "khao soi kai"
          ],
          airport: "CNX",
          fact: "Khao soi is a coconut curry noodle soup crowned with crispy fried noodles, the signature dish of Chiang Mai and northern Thailand. Its roots are usually traced to Chinese Muslim traders from Yunnan.",
          crowd: [
            52,
            21,
            14
          ],
          credit: {
            title: "Khao Soi 01",
            author: "Douglas Perkins",
            license: "CC BY 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Khao_Soi_01.jpg"
          },
          lat: 18.79,
          lng: 98.98
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "Che, nos vemos el domingo en La Bombonera. Llev\xE1 la camiseta azul y oro.",
            from: "+54 9 11 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
            note: "Text message, 19:40",
            lang: "es"
          },
          country: "Argentina",
          regionName: "Autonomous City of Buenos Aires",
          region: [
            "caba",
            "ciudad autonoma de buenos aires",
            "capital federal"
          ],
          cityName: "Buenos Aires",
          city: [
            "buenos aires",
            "bs as",
            "baires"
          ],
          spotLabel: "What is the stadium called?",
          spotWord: "Stadium",
          spotName: "La Bombonera (Boca Juniors)",
          spot: [
            "la bombonera",
            "bombonera",
            "estadio alberto j armando",
            "la boca",
            "boca juniors stadium",
            "boca"
          ],
          airport: "EZE",
          fact: `"Hey, see you Sunday at La Bombonera. Bring the blue and gold shirt." La Bombonera, the chocolate box, is Boca Juniors' stadium in La Boca, named for its steep, boxy stands.`,
          crowd: [
            47,
            40,
            31
          ],
          lat: -34.6,
          lng: -58.38
        },
        {
          type: "Street View",
          prompt: "Where is this blue alley?",
          img: "/clues/d1s1.jpg",
          alt: "A steep alley of stairs and walls painted in deep blue, with potted plants and tiled steps",
          country: "Morocco",
          regionName: "Tanger-Tetouan-Al Hoceima",
          region: [
            "tanger tetouan al hoceima",
            "tangier tetouan al hoceima",
            "tanger tetouan",
            "tangier tetouan",
            "rif"
          ],
          cityName: "Chefchaouen",
          city: [
            "chefchaouen",
            "chaouen",
            "chefchaouene",
            "xauen"
          ],
          spotLabel: "What is this old walled quarter called?",
          spotWord: "Old quarter",
          spotName: "The medina",
          spot: [
            "medina",
            "the medina",
            "old medina",
            "old town",
            "medina of chefchaouen"
          ],
          airport: "TNG",
          fact: "Chefchaouen was founded in 1471 in the Rif mountains. Its blue wash has several origin stories, from Jewish tradition to keeping mosquitoes away, and nobody agrees on one.",
          crowd: [
            41,
            17,
            9
          ],
          credit: {
            title: "Blue alley in Chfchaouen",
            author: "Galanda23",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Blue_alley_in_Chfchaouen.jpg"
          },
          lat: 35.17,
          lng: -5.27
        },
        {
          type: "Close-up",
          prompt: "Where would you find this little figure?",
          img: "/clues/d1s4.jpg",
          alt: "A small bronze figure with outstretched arms standing at the foot of a white wall",
          country: "Poland",
          regionName: "Lower Silesian Voivodeship",
          region: [
            "lower silesia",
            "lower silesian voivodeship",
            "dolnoslaskie",
            "silesia"
          ],
          cityName: "Wroc\u0142aw",
          city: [
            "wroclaw",
            "breslau"
          ],
          spotLabel: "What are these little statues called?",
          spotWord: "Statues",
          spotName: "Wroc\u0142aw's dwarfs (krasnale)",
          spot: [
            "dwarfs",
            "dwarves",
            "dwarf",
            "krasnale",
            "krasnal",
            "krasnoludki",
            "gnomes",
            "gnome",
            "wroclaw dwarfs"
          ],
          airport: "WRO",
          fact: "Hundreds of bronze dwarfs hide around Wroc\u0142aw. They began as a nod to the Orange Alternative, a 1980s movement that mocked the communist government with absurd street happenings and painted dwarfs.",
          crowd: [
            38,
            24,
            19
          ],
          credit: {
            title: "Krasnal Teatralny (Theatre Dwarf) Wroclaw dwarf 02",
            author: "Pnapora",
            license: "CC BY-SA 3.0",
            url: "https://commons.wikimedia.org/wiki/File:Krasnal_Teatralny_(Theatre_Dwarf)_Wroclaw_dwarf_02.JPG"
          },
          lat: 51.11,
          lng: 17.03
        }
      ]
    },
    {
      offset: -2,
      flight: "002",
      rounds: [
        {
          type: "Food",
          prompt: "Where does this pizza come from?",
          img: "/clues/d2s2.jpg",
          alt: "A blistered round pizza with tomato, melted white cheese and a few basil leaves",
          country: "Italy",
          regionName: "Campania",
          region: [
            "campania"
          ],
          cityName: "Naples",
          city: [
            "naples",
            "napoli",
            "neapel"
          ],
          spotLabel: "What is this pizza called?",
          spotWord: "Pizza",
          spotName: "Pizza margherita",
          spot: [
            "margherita",
            "pizza margherita",
            "margarita",
            "margherita pizza",
            "neapolitan pizza",
            "pizza napoletana"
          ],
          airport: "NAP",
          fact: "The margherita is said to be named after Queen Margherita of Savoy, who visited Naples in 1889. The craft of the Neapolitan pizzaiuolo is on UNESCO's intangible heritage list.",
          crowd: [
            88,
            62,
            58
          ],
          credit: {
            title: "Pizza Margherita in Naples 2015",
            author: "Kos88",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Pizza_Margherita_in_Naples_2015.JPG"
          },
          lat: 40.85,
          lng: 14.27
        },
        {
          type: "Landmark",
          prompt: "Where are these towers?",
          img: "/clues/d2s3.jpg",
          alt: "Two identical steel skyscrapers joined by a bridge, between other towers under a blue sky",
          country: "Malaysia",
          regionName: "Federal Territory of Kuala Lumpur",
          region: [
            "federal territory of kuala lumpur",
            "wilayah persekutuan",
            "klang valley"
          ],
          cityName: "Kuala Lumpur",
          city: [
            "kuala lumpur",
            "kl"
          ],
          spotLabel: "What are these towers called?",
          spotWord: "Towers",
          spotName: "Petronas Twin Towers",
          spot: [
            "petronas towers",
            "petronas twin towers",
            "petronas",
            "klcc",
            "menara berkembar petronas",
            "twin towers"
          ],
          airport: "KUL",
          fact: "At 452 m, the Petronas Towers were the world's tallest buildings from 1998 to 2004. A two-storey skybridge joins them at the 41st and 42nd floors.",
          crowd: [
            72,
            66,
            60
          ],
          credit: {
            title: "2016 Kuala Lumpur, Petronas Towers (26)",
            author: "Marcin Konsek",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:2016_Kuala_Lumpur,_Petronas_Towers_(26).jpg"
          },
          lat: 3.14,
          lng: 101.69
        },
        {
          type: "Street View",
          prompt: "Where is this street?",
          img: "/clues/d2s1.jpg",
          alt: "A worn street of tall colonnaded buildings with a green 1950s car driving past",
          country: "Cuba",
          regionName: "Havana Province",
          region: [
            "havana province",
            "la habana province",
            "ciudad de la habana"
          ],
          cityName: "Havana",
          city: [
            "havana",
            "la habana",
            "habana"
          ],
          spotLabel: "What is this neighbourhood called?",
          spotWord: "Area",
          spotName: "Centro Habana",
          spot: [
            "centro habana",
            "centro havana",
            "central havana"
          ],
          airport: "HAV",
          fact: "Cuba's 1950s American cars have been kept running for decades through the trade embargo with improvised parts, and many now work as taxis. Centro Habana sits between Old Havana and Vedado.",
          crowd: [
            63,
            51,
            7
          ],
          credit: {
            title: "Vintage car driving in Centro Havana (Unsplash)",
            author: "Eva Blue",
            license: "CC0",
            url: "https://commons.wikimedia.org/wiki/File:Vintage_car_driving_in_Centro_Havana_(Unsplash).jpg"
          },
          lat: 23.11,
          lng: -82.37
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "\u9053\u9813\u5800\u306E\u30B0\u30EA\u30B3\u306E\u770B\u677F\u306E\u524D\u30677\u6642\u306B\u4F1A\u304A\u3046\uFF01",
            from: "+81 90 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
            note: "Text message, 18:05",
            lang: "ja"
          },
          country: "Japan",
          regionName: "Osaka Prefecture",
          region: [
            "osaka prefecture",
            "kansai",
            "kinki"
          ],
          cityName: "Osaka",
          city: [
            "osaka",
            "osaka shi"
          ],
          spotLabel: "What is the district called?",
          spotWord: "District",
          spotName: "D\u014Dtonbori",
          spot: [
            "dotonbori",
            "dotombori",
            "dotonbori canal",
            "glico sign",
            "glico running man",
            "glico",
            "namba"
          ],
          airport: "KIX",
          fact: `"Let's meet at 7 in front of the Glico sign on D\u014Dtonbori!" The Glico running man has lit up the D\u014Dtonbori canal in Osaka since 1935.`,
          crowd: [
            35,
            30,
            22
          ],
          lat: 34.69,
          lng: 135.5
        },
        {
          type: "Close-up",
          prompt: "Where is this balcony?",
          img: "/clues/d2s4.jpg",
          alt: "A weathered stone corner building with a long enclosed wooden balcony on carved stone brackets",
          country: "Malta",
          regionName: "Southern Harbour",
          region: [
            "southern harbour",
            "southern harbour district"
          ],
          cityName: "Valletta",
          city: [
            "valletta",
            "valetta",
            "il belt"
          ],
          spotLabel: "What are these enclosed balconies called?",
          spotWord: "Balcony",
          spotName: "Gallariji (Maltese balconies)",
          spot: [
            "gallariji",
            "gallarija",
            "gallerija",
            "maltese balconies",
            "maltese balcony",
            "balconies",
            "balcony"
          ],
          airport: "MLA",
          fact: "Valletta's closed wooden balconies, gallariji, let people watch the street unseen while keeping out the sun. The city was built by the Knights of St John after the Great Siege of 1565.",
          crowd: [
            29,
            22,
            8
          ],
          credit: {
            title: "Balkong i Valetta 1",
            author: "V\xE4sk",
            license: "CC BY-SA 3.0",
            url: "https://commons.wikimedia.org/wiki/File:Balkong_i_Valetta_1.jpg"
          },
          lat: 35.9,
          lng: 14.51
        }
      ]
    },
    {
      offset: -1,
      flight: "003",
      rounds: [
        {
          type: "Landmark",
          prompt: "Where is this statue?",
          img: "/clues/d3s3.jpg",
          alt: "A statue with outstretched arms on a mountain peak above a sea of clouds at sunrise",
          country: "Brazil",
          regionName: "Rio de Janeiro State",
          region: [
            "rio de janeiro state",
            "estado do rio de janeiro",
            "rj"
          ],
          cityName: "Rio de Janeiro",
          city: [
            "rio de janeiro",
            "rio"
          ],
          spotLabel: "What is this statue called?",
          spotWord: "Statue",
          spotName: "Christ the Redeemer",
          spot: [
            "christ the redeemer",
            "cristo redentor",
            "corcovado",
            "cristo",
            "christ"
          ],
          airport: "GIG",
          fact: "Christ the Redeemer has stood 30 m tall on Corcovado mountain since 1931, made of reinforced concrete clad in soapstone tiles.",
          crowd: [
            86,
            81,
            74
          ],
          credit: {
            title: "Redentor Over Clouds 1",
            author: "Donatas Dabravolskas",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Redentor_Over_Clouds_1.jpg"
          },
          lat: -22.91,
          lng: -43.17
        },
        {
          type: "Food",
          prompt: "Where does this dish come from?",
          img: "/clues/d3s2.jpg",
          alt: "Sliced roast duck with glossy skin beside a bamboo steamer of thin pancakes, dark sauce, spring onion and cucumber",
          country: "China",
          regionName: "Beijing Municipality",
          region: [
            "beijing municipality"
          ],
          cityName: "Beijing",
          city: [
            "beijing",
            "peking",
            "beijing shi"
          ],
          spotLabel: "What is this dish called?",
          spotWord: "Dish",
          spotName: "Peking duck",
          spot: [
            "peking duck",
            "beijing duck",
            "beijing roast duck",
            "peking roast duck",
            "roast duck",
            "kao ya",
            "beijing kaoya"
          ],
          airport: "PEK",
          fact: "Peking duck is roasted until the skin turns glassy, then carved at the table and wrapped in thin pancakes with spring onion, cucumber and sweet bean sauce. Beijing's oldest duck restaurants date back to the 1400s.",
          crowd: [
            66,
            58,
            49
          ],
          credit: {
            title: "2016-08-27 Peking Duck at Great Wall Restaurant Beijing anagoria",
            author: "Anagoria",
            license: "CC BY 3.0",
            url: "https://commons.wikimedia.org/wiki/File:2016-08-27_Peking_Duck_at_Great_Wall_Restaurant_Beijing_anagoria.jpg"
          },
          lat: 39.9,
          lng: 116.41
        },
        {
          type: "Street View",
          prompt: "Where is this canal?",
          img: "/clues/d3s1.jpg",
          alt: "Brightly painted houses along a canal with wooden mooring posts and a tall leaning bell tower behind",
          country: "Italy",
          regionName: "Veneto",
          region: [
            "veneto"
          ],
          cityName: "Venice",
          city: [
            "venice",
            "venezia",
            "venedig"
          ],
          spotLabel: "What is this island called?",
          spotWord: "Island",
          spotName: "Burano",
          spot: [
            "burano",
            "isola di burano"
          ],
          airport: "VCE",
          fact: "Burano is a lagoon island of Venice where every house is painted a bright colour, and owners ask permission before repainting. The bell tower of San Martino leans visibly.",
          crowd: [
            57,
            44,
            26
          ],
          credit: {
            title: "Burano Venice 4",
            author: "kallerna",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Burano_Venice_4.jpg"
          },
          lat: 45.44,
          lng: 12.33
        },
        {
          type: "Close-up",
          prompt: "Where are these wooden houses?",
          img: "/clues/d3s4.jpg",
          alt: "A row of tall, narrow wooden gabled houses painted ochre, white and red",
          country: "Norway",
          regionName: "Vestland",
          region: [
            "vestland",
            "hordaland",
            "western norway"
          ],
          cityName: "Bergen",
          city: [
            "bergen",
            "bjorgvin"
          ],
          spotLabel: "What is this wharf called?",
          spotWord: "Wharf",
          spotName: "Bryggen",
          spot: [
            "bryggen",
            "tyske bryggen",
            "hanseatic wharf",
            "the hanseatic wharf"
          ],
          airport: "BGO",
          fact: "Bryggen's wooden warehouses were the Hanseatic League's trading post in Bergen, dealing mostly in dried cod. Rebuilt after many fires on the old pattern, they are a UNESCO World Heritage Site.",
          crowd: [
            41,
            33,
            25
          ],
          credit: {
            title: "Fassaden in Bryggen, Bergen N",
            author: "JoachimKohler-HB",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Fassaden_in_Bryggen,_Bergen_N.jpg"
          },
          lat: 60.39,
          lng: 5.32
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "Tukutane Forodhani saa kumi na mbili jioni, tule mishkaki baharini.",
            from: "+255 7\u2022\u2022 \u2022\u2022\u2022 \u2022\u2022\u2022",
            note: "Text message, 16:30",
            lang: "sw"
          },
          country: "Tanzania",
          regionName: "Zanzibar Urban/West",
          region: [
            "zanzibar urban west",
            "unguja",
            "zanzibar island",
            "mjini magharibi"
          ],
          cityName: "Zanzibar City",
          city: [
            "zanzibar city",
            "zanzibar town",
            "zanzibar"
          ],
          spotLabel: "What is the old quarter called?",
          spotWord: "Old quarter",
          spotName: "Stone Town (Forodhani Gardens)",
          spot: [
            "stone town",
            "forodhani",
            "forodhani gardens",
            "mji mkongwe"
          ],
          airport: "ZNZ",
          fact: `"Let's meet at Forodhani at six this evening and eat skewers by the sea." Forodhani Gardens on Stone Town's waterfront turns into a street-food market every evening.`,
          crowd: [
            19,
            14,
            11
          ],
          lat: -6.16,
          lng: 39.19
        }
      ]
    },
    {
      offset: 0,
      flight: "004",
      rounds: [
        {
          type: "Landmark",
          prompt: "Where is this church?",
          img: "/clues/r3.jpg",
          alt: "A tall pale concrete church with stepped columns, a bronze statue in front and snow on the ground",
          country: "Iceland",
          regionName: "Capital Region",
          region: [
            "capital region",
            "hofudborgarsvaedid",
            "greater reykjavik"
          ],
          cityName: "Reykjav\xEDk",
          city: [
            "reykjavik"
          ],
          spotLabel: "What is this landmark called?",
          spotWord: "Landmark",
          spotName: "Hallgr\xEDmskirkja",
          spot: [
            "hallgrimskirkja",
            "hallgrims church",
            "hallgrim s church",
            "hallgrimur s church",
            "church of hallgrimur",
            "hallgrimskirkja church"
          ],
          airport: "KEF",
          fact: "Hallgr\xEDmskirkja's 74.5 m tower was designed to echo the basalt columns that form when lava cools. The statue out front is Leif Erikson, a gift from the United States in 1930.",
          crowd: [
            83,
            77,
            52
          ],
          credit: {
            title: "Hallgr\xEDmskirkja",
            author: "Andreas Tille",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Hallgr%C3%ADmskirkja.jpeg"
          },
          lat: 64.15,
          lng: -21.94
        },
        {
          type: "Close-up",
          prompt: "Where are these tiled walls?",
          img: "/clues/r4.jpg",
          alt: "Two buildings covered in teal and patterned ceramic tiles on a wet cobbled street",
          country: "Portugal",
          regionName: "Lisbon District",
          region: [
            "lisbon district",
            "lisboa district",
            "distrito de lisboa",
            "lisbon metropolitan area",
            "area metropolitana de lisboa",
            "greater lisbon"
          ],
          cityName: "Lisbon",
          city: [
            "lisbon",
            "lisboa"
          ],
          spotLabel: "What is this neighbourhood called?",
          spotWord: "Area",
          spotName: "Gra\xE7a",
          spot: [
            "graca",
            "bairro da graca",
            "largo da graca",
            "sao vicente"
          ],
          airport: "LIS",
          fact: "Gra\xE7a is one of Lisbon's oldest neighbourhoods, high on one of the city's seven hills. Glazed azulejo tiles became popular on fa\xE7ades in the 1800s because they shrug off damp and heat.",
          crowd: [
            69,
            51,
            4
          ],
          credit: {
            title: "Lisbon. Azulejo-covered houses in Gra\xE7a.",
            author: "Vernaccia",
            license: "CC BY 2.0",
            url: "https://commons.wikimedia.org/wiki/File:Lisbon._Azulejo-covered_houses_in_Gra%C3%A7a._(41941933691).jpg"
          },
          lat: 38.72,
          lng: -9.14
        },
        {
          type: "Street View",
          prompt: "Where is this hillside?",
          img: "/clues/r1.jpg",
          alt: "A hillside crowded with brightly painted houses under a grey sky",
          country: "Chile",
          regionName: "Valpara\xEDso Region",
          region: [
            "valparaiso region",
            "region de valparaiso",
            "region of valparaiso",
            "v region",
            "quinta region"
          ],
          cityName: "Valpara\xEDso",
          city: [
            "valparaiso",
            "valpo"
          ],
          spotLabel: "What is one of this city's hills (cerros) called?",
          spotWord: "Hill",
          spotName: "Any of its 40-odd cerros, like Cerro Alegre",
          spot: [
            "alegre",
            "concepcion",
            "bellavista",
            "artilleria",
            "florida",
            "baron",
            "cordillera",
            "panteon",
            "polanco",
            "playa ancha",
            "yungay",
            "mariposas",
            "larrain",
            "esperanza",
            "toro",
            "santo domingo",
            "monjas",
            "carcel",
            "san juan de dios"
          ],
          spotStrip: "^cerro ",
          airport: "SCL",
          fact: "Valpara\xEDso is built on more than 40 hills, linked by century-old funicular lifts called ascensores. Its historic quarter is a UNESCO World Heritage Site.",
          crowd: [
            58,
            31,
            6
          ],
          credit: {
            title: "Valpara\xEDso",
            author: "Fraenerys",
            license: "CC BY 3.0",
            url: "https://commons.wikimedia.org/wiki/File:Valpara%C3%ADso_(178426945).jpeg"
          },
          lat: -33.05,
          lng: -71.62
        },
        {
          type: "Food",
          prompt: "Where does this dish come from?",
          img: "/clues/r2.jpg",
          alt: "A boat-shaped bread filled with melted cheese, a runny egg yolk and a pat of butter",
          country: "Georgia",
          regionName: "Adjara",
          region: [
            "adjara",
            "ajara",
            "adjaria",
            "achara",
            "autonomous republic of adjara"
          ],
          cityName: "Batumi",
          city: [
            "batumi",
            "batum"
          ],
          spotLabel: "What is this dish called?",
          spotWord: "Dish",
          spotName: "Adjaruli khachapuri",
          spot: [
            "adjaruli khachapuri",
            "acharuli khachapuri",
            "adjarian khachapuri",
            "khachapuri adjaruli",
            "khachapuri acharuli",
            "adjaruli",
            "acharuli",
            "khachapuri"
          ],
          airport: "BUS",
          fact: "Adjaruli khachapuri comes from Adjara on Georgia's Black Sea coast. The boat shape is no accident: you tear off the crust and stir the egg and butter into the cheese.",
          crowd: [
            44,
            12,
            9
          ],
          credit: {
            title: "Khachapuri Adjaruli with egg and butter",
            author: "Eugene Krasnaok",
            license: "CC BY 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Khachapuri_Adjaruli_with_egg_and_butter_2016.jpg"
          },
          lat: 41.62,
          lng: 41.64
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "Tere! Kohtume kell kuus Raekoja platsil, Vana Toomase all.",
            from: "+372 5\u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
            note: "Text message, 17:12",
            lang: "et"
          },
          country: "Estonia",
          regionName: "Harju County",
          region: [
            "harju",
            "harju county",
            "harjumaa"
          ],
          cityName: "Tallinn",
          city: [
            "tallinn",
            "reval"
          ],
          spotLabel: "What is the square called?",
          spotWord: "Square",
          spotName: "Town Hall Square (Raekoja plats)",
          spot: [
            "raekoja plats",
            "town hall square",
            "tallinn town hall square",
            "tallinn town hall",
            "town hall",
            "raekoda",
            "old town",
            "vanalinn",
            "tallinn old town"
          ],
          airport: "TLL",
          fact: `"Hi! Let's meet at six on Town Hall Square, under Old Thomas." Vana Toomas is the weathervane guard on top of Tallinn Town Hall, keeping watch over the square since 1530.`,
          crowd: [
            22,
            18,
            11
          ],
          lat: 59.44,
          lng: 24.75
        }
      ]
    },
    {
      offset: -7,
      flight: "005",
      rounds: [
        {
          type: "Landmark",
          prompt: "Where is this facade carved into the rock?",
          img: "/clues/d7s3.jpg",
          alt: "A tall classical facade with columns, carved straight out of a pink sandstone cliff",
          country: "Jordan",
          regionName: "Ma'an Governorate",
          region: [
            "maan governorate",
            "maan",
            "ma an governorate"
          ],
          cityName: "Petra",
          city: [
            "petra",
            "wadi musa",
            "wadi mousa"
          ],
          spotLabel: "What is this monument called?",
          spotWord: "Monument",
          spotName: "Al-Khazneh (the Treasury)",
          spot: [
            "al khazneh",
            "khazneh",
            "al khazna",
            "treasury",
            "khaznat al firaun",
            "pharaoh s treasury"
          ],
          airport: "AQJ",
          fact: "Al-Khazneh was carved out of the sandstone by the Nabataeans around the 1st century AD, probably as a royal tomb. Its name, the Treasury, comes from a legend that pirates hid gold in the urn at the top.",
          crowd: [
            79,
            70,
            58
          ],
          credit: {
            title: "Al-Khazneh (The Treasury) 2, Petra, Jordan",
            author: "Vyacheslav Argenberg",
            license: "CC BY 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Al-Khazneh_(The_Treasury)_2,_Petra,_Jordan.jpg"
          },
          lat: 30.33,
          lng: 35.44
        },
        {
          type: "Food",
          prompt: "Where does this fish stew come from?",
          img: "/clues/d7s2.jpg",
          alt: "A bowl of orange fish stew with a mussel, pieces of white fish and chopped herbs",
          country: "France",
          regionName: "Provence-Alpes-C\xF4te d'Azur",
          region: [
            "provence alpes cote d azur",
            "provence",
            "paca",
            "bouches du rhone"
          ],
          cityName: "Marseille",
          city: [
            "marseille",
            "marseilles"
          ],
          spotLabel: "What is this dish called?",
          spotWord: "Dish",
          spotName: "Bouillabaisse",
          spot: [
            "bouillabaisse",
            "bouillabaise",
            "bouillabesso",
            "bouillabaisse marseillaise"
          ],
          airport: "MRS",
          fact: "Bouillabaisse began as the stew Marseille fishermen made from the bony rockfish they couldn't sell. In 1980 the city's chefs signed a charter setting out what a true one must contain.",
          crowd: [
            61,
            35,
            28
          ],
          credit: {
            title: "20250903 Bouillabaisse in Khimki (90108)",
            author: "Sergey A. Demidov",
            license: "CC BY 4.0",
            url: "https://commons.wikimedia.org/wiki/File:20250903_Bouillabaisse_in_Khimki_(90108).jpg"
          },
          lat: 43.3,
          lng: 5.37
        },
        {
          type: "Street View",
          prompt: "Where is this railway street?",
          img: "/clues/d7s1.jpg",
          alt: "A railway line running down a narrow lane, with houses and doorways right up against the tracks",
          country: "Vietnam",
          regionName: "Red River Delta",
          region: [
            "red river delta",
            "northern vietnam",
            "bac bo",
            "tonkin"
          ],
          cityName: "Hanoi",
          city: [
            "hanoi",
            "ha noi"
          ],
          spotLabel: "What is this street called?",
          spotWord: "Street",
          spotName: "Train Street (off L\xEA Du\u1EA9n and Ph\xF9ng H\u01B0ng)",
          spot: [
            "train street",
            "hanoi train street",
            "pho duong tau",
            "duong tau",
            "le duan",
            "phung hung",
            "kham thien",
            "tran phu"
          ],
          airport: "HAN",
          fact: "Hanoi's Train Street is a row of houses built right up to a working railway laid by the French in the early 1900s. When a train squeezes through, residents step back into their doorways.",
          crowd: [
            55,
            38,
            22
          ],
          credit: {
            title: "Train street in Hanoi",
            author: "Kris Martyn",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Train_street_in_Hanoi.jpg"
          },
          lat: 21.03,
          lng: 105.85
        },
        {
          type: "Close-up",
          prompt: "Where is this doorway?",
          img: "/clues/d7s4.jpg",
          alt: "A pale green panelled door between white columns, under a fanlight window in a red brick wall",
          country: "Ireland",
          regionName: "County Dublin",
          region: [
            "county dublin",
            "co dublin",
            "leinster"
          ],
          cityName: "Dublin",
          city: [
            "dublin",
            "baile atha cliath"
          ],
          spotLabel: "What is this street called?",
          spotWord: "Street",
          spotName: "Henrietta Street",
          spot: [
            "henrietta street",
            "henrietta st"
          ],
          airport: "DUB",
          fact: "Dublin's Georgian doors, framed by columns and topped with fanlights, date from its 18th-century building boom. Henrietta Street, laid out in the 1720s, is the oldest Georgian street in the city.",
          crowd: [
            48,
            36,
            3
          ],
          credit: {
            title: "Doors Of Dublin - Henrietta Street 4282282527",
            author: "William Murphy",
            license: "CC BY-SA 2.0",
            url: "https://commons.wikimedia.org/wiki/File:Doors_Of_Dublin_-_Henrietta_Street_4282282527.jpg"
          },
          lat: 53.35,
          lng: -6.26
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "Servus! Treffen wir uns um acht beim Riesenrad im Prater?",
            from: "+43 664 \u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
            note: "Text message, 18:20",
            lang: "de"
          },
          country: "Austria",
          regionName: "Vienna (state)",
          region: [
            "vienna state",
            "bundesland wien",
            "eastern austria"
          ],
          cityName: "Vienna",
          city: [
            "vienna",
            "wien"
          ],
          spotLabel: "What is the park called?",
          spotWord: "Park",
          spotName: "The Prater (by the Riesenrad)",
          spot: [
            "prater",
            "wiener prater",
            "wurstelprater",
            "riesenrad",
            "wiener riesenrad",
            "giant ferris wheel"
          ],
          airport: "VIE",
          fact: `"Hi! Shall we meet at eight by the Ferris wheel in the Prater?" German is spoken in several countries, but +43 is Austria. Vienna's Riesenrad has turned over the Prater since 1897.`,
          crowd: [
            25,
            22,
            17
          ],
          lat: 48.21,
          lng: 16.37
        }
      ]
    },
    {
      offset: -6,
      flight: "006",
      rounds: [
        {
          type: "Landmark",
          prompt: "Where is this temple?",
          img: "/clues/d6s3.jpg",
          alt: "A weathered stone temple gallery with a tall, carved tower rising behind it",
          country: "Cambodia",
          regionName: "Siem Reap Province",
          region: [
            "siem reap province",
            "khaet siem reab"
          ],
          cityName: "Siem Reap",
          city: [
            "siem reap",
            "siemreap",
            "siem riep"
          ],
          spotLabel: "What is this temple called?",
          spotWord: "Temple",
          spotName: "Angkor Wat",
          spot: [
            "angkor wat",
            "angkor",
            "angkor vat",
            "nokor wat"
          ],
          airport: "SAI",
          fact: "Angkor Wat was built in the early 12th century for King Suryavarman II, first as a Hindu temple to Vishnu, later Buddhist. It is the largest religious monument in the world, and it appears on Cambodia's flag.",
          crowd: [
            74,
            52,
            48
          ],
          credit: {
            title: "2016 Angkor, Angkor Wat, Brama Angkor Wat (30)",
            author: "Marcin Konsek",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:2016_Angkor,_Angkor_Wat,_Brama_Angkor_Wat_(30).jpg"
          },
          lat: 13.36,
          lng: 103.86
        },
        {
          type: "Food",
          prompt: "Where does this rice bowl come from?",
          img: "/clues/d6s2.jpg",
          alt: "A hot stone bowl of rice topped with vegetables, sprouts, a raw egg yolk and sesame",
          country: "South Korea",
          regionName: "North Jeolla (Jeonbuk)",
          region: [
            "north jeolla",
            "jeollabuk do",
            "jeonbuk",
            "jeonbuk state",
            "honam"
          ],
          cityName: "Jeonju",
          city: [
            "jeonju",
            "chonju"
          ],
          spotLabel: "What is this dish called?",
          spotWord: "Dish",
          spotName: "Bibimbap (Jeonju bibimbap)",
          spot: [
            "bibimbap",
            "bibimbab",
            "bi bim bap",
            "bibim bap",
            "dolsot bibimbap",
            "jeonju bibimbap"
          ],
          airport: "KUV",
          fact: 'Bibimbap means "mixed rice": rice topped with vegetables, chilli paste and often an egg, stirred together at the table. Jeonju is its most famous home and holds a bibimbap festival every year.',
          crowd: [
            72,
            9,
            7
          ],
          credit: {
            title: "Korean.food-Bibimbap-02",
            author: "abex (a flickr user)",
            license: "CC BY-SA 2.0",
            url: "https://commons.wikimedia.org/wiki/File:Korean.food-Bibimbap-02.jpg"
          },
          lat: 35.82,
          lng: 127.15
        },
        {
          type: "Close-up",
          prompt: "Where is this mosaic?",
          img: "/clues/d6s4.jpg",
          alt: "A wall of broken white tiles set with square panels of patterned ceramic, under pink roses",
          country: "Spain",
          regionName: "Catalonia",
          region: [
            "catalonia",
            "catalunya",
            "cataluna"
          ],
          cityName: "Barcelona",
          city: [
            "barcelona",
            "bcn"
          ],
          spotLabel: "What is this park called?",
          spotWord: "Park",
          spotName: "Park G\xFCell",
          spot: [
            "park guell",
            "parc guell",
            "parque guell",
            "guell park"
          ],
          airport: "BCN",
          fact: "This patchwork of broken tiles is trencad\xEDs, the mosaic style Antoni Gaud\xED made famous. He covered Park G\xFCell's benches, walls and dragon in it between 1900 and 1914.",
          crowd: [
            63,
            55,
            41
          ],
          credit: {
            title: "Trencad\xEDs. Park G\xFCell",
            author: "Andrew Moore from Johannesburg, South Africa",
            license: "CC BY-SA 2.0",
            url: "https://commons.wikimedia.org/wiki/File:Trencad%C3%ADs._Park_G%C3%BCell.jpg"
          },
          lat: 41.39,
          lng: 2.17
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "Ak\u015Fam yedide Galata Kulesi'nin \xF6n\xFCnde bulu\u015Fal\u0131m m\u0131? Sonra Karak\xF6y'de bal\u0131k yeriz.",
            from: "+90 5\u2022\u2022 \u2022\u2022\u2022 \u2022\u2022 \u2022\u2022",
            note: "Text message, 17:45",
            lang: "tr"
          },
          country: "Turkey",
          regionName: "Marmara Region",
          region: [
            "marmara region",
            "marmara",
            "istanbul province"
          ],
          cityName: "Istanbul",
          city: [
            "istanbul",
            "constantinople",
            "stamboul"
          ],
          spotLabel: "What is the tower called?",
          spotWord: "Tower",
          spotName: "Galata Tower",
          spot: [
            "galata tower",
            "galata kulesi",
            "galata"
          ],
          airport: "IST",
          fact: `"Shall we meet in front of Galata Tower at seven? Then we'll eat fish in Karak\xF6y." The stone tower has stood over the Golden Horn since the Genoese built it in 1348.`,
          crowd: [
            44,
            39,
            33
          ],
          lat: 41.01,
          lng: 28.98
        },
        {
          type: "Street View",
          prompt: "Where are these balconies?",
          img: "/clues/d6s1.jpg",
          alt: "A narrow street of pink and yellow colonial houses with wooden balconies and bougainvillea",
          country: "Colombia",
          regionName: "Bol\xEDvar Department",
          region: [
            "bolivar department",
            "departamento de bolivar",
            "bolivar",
            "caribbean region"
          ],
          cityName: "Cartagena",
          city: [
            "cartagena",
            "cartagena de indias"
          ],
          spotLabel: "What is the walled part of this city called?",
          spotWord: "Walled city",
          spotName: "The walled old town (Ciudad Amurallada)",
          spot: [
            "ciudad amurallada",
            "walled city",
            "old town",
            "old city",
            "centro historico",
            "ciudad vieja",
            "centro",
            "san diego"
          ],
          airport: "CTG",
          fact: "Cartagena's old town sits inside about 11 km of stone walls built against pirates and rival navies. Its wooden balconies date mostly from the colonial era, when it was Spain's great Caribbean port.",
          crowd: [
            41,
            30,
            24
          ],
          credit: {
            title: "Balconies, Street scene in Cartagena, Colombia (24745444421)",
            author: "Joe Ross from Lansing, Michigan",
            license: "CC BY-SA 2.0",
            url: "https://commons.wikimedia.org/wiki/File:Balconies,_Street_scene_in_Cartagena,_Colombia_(24745444421).jpg"
          },
          lat: 10.39,
          lng: -75.51
        }
      ]
    },
    {
      offset: -5,
      flight: "007",
      rounds: [
        {
          type: "Close-up",
          prompt: "Where are these gates?",
          img: "/clues/d5s4.jpg",
          alt: "Two paths running through tunnels of closely spaced vermilion gates with black bases",
          country: "Japan",
          regionName: "Kyoto Prefecture",
          region: [
            "kyoto prefecture",
            "kyoto fu",
            "kansai",
            "kinki"
          ],
          cityName: "Kyoto",
          city: [
            "kyoto",
            "kyouto"
          ],
          spotLabel: "What is this shrine called?",
          spotWord: "Shrine",
          spotName: "Fushimi Inari Taisha",
          spot: [
            "fushimi inari",
            "fushimi inari taisha",
            "fushimi inari shrine",
            "inari taisha",
            "senbon torii",
            "fushimi"
          ],
          airport: "ITM",
          fact: "Fushimi Inari Taisha is lined with thousands of vermilion torii gates, each donated by a business or person whose name is written on the back. The paths climb about 4 km up Mount Inari.",
          crowd: [
            86,
            64,
            55
          ],
          credit: {
            title: "Double torii path at Fushimi Inari Taisha Shrine, Kyoto, Japan",
            author: "Basile Morin",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Double_torii_path_at_Fushimi_Inari_Taisha_Shrine,_Kyoto,_Japan.jpg"
          },
          lat: 35.01,
          lng: 135.77
        },
        {
          type: "Landmark",
          prompt: "Where is this castle?",
          img: "/clues/d5s3.jpg",
          alt: "A white castle with slender towers on a forested crag, below a steep grey cliff",
          country: "Germany",
          regionName: "Bavaria",
          region: [
            "bavaria",
            "bayern",
            "freistaat bayern",
            "allgau",
            "swabia"
          ],
          cityName: "Schwangau",
          city: [
            "schwangau",
            "fussen",
            "hohenschwangau"
          ],
          spotLabel: "What is this castle called?",
          spotWord: "Castle",
          spotName: "Neuschwanstein Castle",
          spot: [
            "neuschwanstein",
            "neuschwanstein castle",
            "schloss neuschwanstein"
          ],
          airport: "FMM",
          fact: "King Ludwig II of Bavaria began Neuschwanstein in 1869 as a private retreat and died before it was finished. It opened to visitors weeks after his death in 1886 and is said to have inspired Disney's Sleeping Beauty castle.",
          crowd: [
            81,
            28,
            26
          ],
          credit: {
            title: "Neuschwanstein Castle 2024",
            author: "Wilfredor",
            license: "CC0",
            url: "https://commons.wikimedia.org/wiki/File:Neuschwanstein_Castle_2024.jpg"
          },
          lat: 47.58,
          lng: 10.74
        },
        {
          type: "Food",
          prompt: "Where do these tacos come from?",
          img: "/clues/d5s2.jpg",
          alt: "A hand holding a paper tray of small soft tacos filled with marinated pork, onion and coriander",
          country: "Mexico",
          regionName: "Valley of Mexico",
          region: [
            "valley of mexico",
            "valle de mexico",
            "central mexico"
          ],
          cityName: "Mexico City",
          city: [
            "mexico city",
            "ciudad de mexico",
            "cdmx",
            "mexico df",
            "df"
          ],
          spotLabel: "What is this taco called?",
          spotWord: "Taco",
          spotName: "Tacos al pastor",
          spot: [
            "al pastor",
            "tacos al pastor",
            "taco al pastor",
            "pastor",
            "tacos de trompo",
            "trompo"
          ],
          airport: "MEX",
          fact: "Tacos al pastor grew from the shawarma Lebanese immigrants brought to Mexico: pork marinated in chilli and achiote, cooked on a vertical spit and served with pineapple. They became a Mexico City staple in the 1960s.",
          crowd: [
            77,
            39,
            33
          ],
          credit: {
            title: "(El Flaco) Al Pastor Tacos",
            author: "City Foodsters",
            license: "CC BY 2.0",
            url: "https://commons.wikimedia.org/wiki/File:(El_Flaco)_Al_Pastor_Tacos.jpg"
          },
          lat: 19.43,
          lng: -99.13
        },
        {
          type: "Street View",
          prompt: "Where are these painted houses?",
          img: "/clues/d5s1.jpg",
          alt: "A terrace of flat-roofed houses painted pink, mint, lilac and yellow on a sloping street",
          country: "South Africa",
          regionName: "Western Cape",
          region: [
            "western cape",
            "wes kaap",
            "western cape province"
          ],
          cityName: "Cape Town",
          city: [
            "cape town",
            "kaapstad",
            "ikapa"
          ],
          spotLabel: "What is this neighbourhood called?",
          spotWord: "Area",
          spotName: "Bo-Kaap",
          spot: [
            "bo kaap",
            "bokaap",
            "malay quarter",
            "bo kaap malay quarter"
          ],
          airport: "CPT",
          fact: "Bo-Kaap, on the slopes of Signal Hill, grew from the 1760s as home to Cape Malay families, many descended from people enslaved from Southeast Asia. Its brightly painted houses are among Cape Town's oldest.",
          crowd: [
            46,
            41,
            30
          ],
          credit: {
            title: "Bo-Kaap - Cape Town, South Africa (3883775540)",
            author: "South African Tourism from South Africa",
            license: "CC BY 2.0",
            url: "https://commons.wikimedia.org/wiki/File:Bo-Kaap_-_Cape_Town,_South_Africa_(3883775540).jpg"
          },
          lat: -33.92,
          lng: 18.42
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "\u0646\u062A\u0642\u0627\u0628\u0644 \u0641\u064A \u062E\u0627\u0646 \u0627\u0644\u062E\u0644\u064A\u0644\u064A \u0627\u0644\u0633\u0627\u0639\u0629 \u0633\u0628\u0639\u0629\u061F \u0647\u0646\u0634\u0631\u0628 \u0634\u0627\u064A \u0641\u064A \u0627\u0644\u0641\u064A\u0634\u0627\u0648\u064A.",
            from: "+20 10 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
            note: "Text message, 18:50",
            lang: "ar"
          },
          country: "Egypt",
          regionName: "Cairo Governorate",
          region: [
            "cairo governorate",
            "al qahirah governorate",
            "greater cairo"
          ],
          cityName: "Cairo",
          city: [
            "cairo",
            "al qahirah",
            "el qahira"
          ],
          spotLabel: "What is the bazaar called?",
          spotWord: "Bazaar",
          spotName: "Khan el-Khalili",
          spot: [
            "khan el khalili",
            "khan al khalili",
            "khan khalili",
            "el khalili",
            "khan el khalily"
          ],
          airport: "CAI",
          fact: `"Shall we meet at Khan el-Khalili at seven? We'll have tea at El Fishawy." Arabic is spoken in over 20 countries, but +20 is Egypt. Cairo's great bazaar dates from the 14th century.`,
          crowd: [
            19,
            16,
            12
          ],
          lat: 30.04,
          lng: 31.24
        }
      ]
    },
    {
      offset: -4,
      flight: "008",
      rounds: [
        {
          type: "Close-up",
          prompt: "Where are these canal houses?",
          img: "/clues/d4s4.jpg",
          alt: "Tall, narrow brick houses with stepped and bell-shaped gables along a canal with a moored boat",
          country: "Netherlands",
          regionName: "North Holland",
          region: [
            "north holland",
            "noord holland"
          ],
          cityName: "Amsterdam",
          city: [
            "amsterdam",
            "mokum"
          ],
          spotLabel: "What is this canal belt called?",
          spotWord: "Canal belt",
          spotName: "The canal ring (Grachtengordel)",
          spot: [
            "grachtengordel",
            "canal ring",
            "canal belt",
            "herengracht",
            "keizersgracht",
            "prinsengracht",
            "singel",
            "canals",
            "grachten"
          ],
          airport: "AMS",
          fact: "Amsterdam's 17th-century canal ring is lined with tall, narrow merchant houses that lean slightly forward, so goods hoisted on the beam at the top swing clear of the windows. It became a World Heritage Site in 2010.",
          crowd: [
            77,
            69,
            36
          ],
          credit: {
            title: "DSC00288, Canal Cruise, Amsterdam, Netherlands (338955340)",
            author: "Lyn Gateley from Silicon Valley, CA, USA",
            license: "CC BY 2.0",
            url: "https://commons.wikimedia.org/wiki/File:DSC00288,_Canal_Cruise,_Amsterdam,_Netherlands_(338955340).jpg"
          },
          lat: 52.37,
          lng: 4.9
        },
        {
          type: "Food",
          prompt: "Where does this pizza come from?",
          img: "/clues/d4s2.jpg",
          alt: "A thick-crusted pizza in a deep pan, with tomato and pepperoni over a tall golden edge",
          country: "United States",
          regionName: "Illinois",
          region: [
            "illinois",
            "midwest"
          ],
          cityName: "Chicago",
          city: [
            "chicago",
            "chi town",
            "chitown",
            "windy city"
          ],
          spotLabel: "What is this style of pizza called?",
          spotWord: "Pizza style",
          spotName: "Deep-dish pizza",
          spot: [
            "deep dish",
            "deep dish pizza",
            "chicago deep dish",
            "chicago style",
            "chicago style pizza",
            "pan pizza",
            "stuffed pizza"
          ],
          airport: "ORD",
          fact: "Chicago deep-dish is baked in a tall, oiled pan, with the cheese under a layer of chunky tomato so it doesn't burn in the long bake. Pizzeria Uno claims to have invented it in 1943.",
          crowd: [
            74,
            62,
            51
          ],
          credit: {
            title: "Deep Dish Pizza PD",
            author: "Telluride",
            license: "CC BY-SA 3.0",
            url: "https://commons.wikimedia.org/wiki/File:Deep_Dish_Pizza_PD.jpg"
          },
          lat: 41.88,
          lng: -87.63
        },
        {
          type: "Landmark",
          prompt: "Where is this golden pagoda?",
          img: "/clues/d4s3.jpg",
          alt: "Gilded spires and tiered pavilions around a marble terrace, with people walking barefoot",
          country: "Myanmar",
          regionName: "Yangon Region",
          region: [
            "yangon region",
            "rangoon division",
            "yangon division"
          ],
          cityName: "Yangon",
          city: [
            "yangon",
            "rangoon"
          ],
          spotLabel: "What is this pagoda called?",
          spotWord: "Pagoda",
          spotName: "Shwedagon Pagoda",
          spot: [
            "shwedagon",
            "shwedagon pagoda",
            "shwedagon zedi daw",
            "great dagon pagoda",
            "golden pagoda"
          ],
          airport: "RGN",
          fact: "The Shwedagon's main stupa rises about 99 m over Yangon, its gold plates crowned with thousands of diamonds and rubies. Legend says it holds eight hairs of the Buddha.",
          crowd: [
            58,
            47,
            42
          ],
          credit: {
            title: "Shwedagon Zedi Daw Yangon 4",
            author: "kallerna",
            license: "CC BY-SA 4.0",
            url: "https://commons.wikimedia.org/wiki/File:Shwedagon_Zedi_Daw_Yangon_4.jpg"
          },
          lat: 16.84,
          lng: 96.17
        },
        {
          type: "Street View",
          prompt: "Where is this stone street?",
          img: "/clues/d4s1.jpg",
          alt: "A wide street paved with polished pale stone between uniform stone houses, with a bell tower at the far end",
          country: "Croatia",
          regionName: "Dubrovnik-Neretva County",
          region: [
            "dubrovnik neretva county",
            "dubrovacko neretvanska",
            "dalmatia",
            "southern dalmatia"
          ],
          cityName: "Dubrovnik",
          city: [
            "dubrovnik",
            "ragusa"
          ],
          spotLabel: "What is this street called?",
          spotWord: "Street",
          spotName: "Stradun (Placa)",
          spot: [
            "stradun",
            "placa",
            "stradone",
            "stradun street"
          ],
          airport: "DBV",
          fact: "Stradun, the main street of Dubrovnik's walled old town, was rebuilt after the great earthquake of 1667, which is why its houses look so alike. Its limestone is polished smooth by centuries of footsteps.",
          crowd: [
            52,
            44,
            31
          ],
          credit: {
            title: "Main street-Dubrovnik-1",
            author: "L\xE1szl\xF3 Szalai (Beyond silence)",
            license: "Public domain",
            url: "https://commons.wikimedia.org/wiki/File:Main_street-Dubrovnik-1.jpg"
          },
          lat: 42.65,
          lng: 18.09
        },
        {
          type: "Language",
          prompt: "A friend who lives there sends you this. Where are you meeting?",
          postcard: {
            text: "All\xF4! On se rejoint au march\xE9 Jean-Talon vers midi? J'apporte des beignes.",
            from: "+1 514 \u2022\u2022\u2022 \u2022\u2022\u2022\u2022",
            note: "Text message, 11:05",
            lang: "fr"
          },
          country: "Canada",
          regionName: "Quebec",
          region: [
            "quebec",
            "quebec province",
            "province de quebec",
            "la belle province"
          ],
          cityName: "Montreal",
          city: [
            "montreal",
            "mtl"
          ],
          spotLabel: "What is the market called?",
          spotWord: "Market",
          spotName: "Jean-Talon Market",
          spot: [
            "jean talon",
            "jean talon market",
            "marche jean talon"
          ],
          airport: "YUL",
          fact: `"Hi! Shall we meet at Jean-Talon Market around noon? I'll bring doughnuts." +1 covers the US and Canada, but 514 is Montreal, and beignes is Quebec French. The market has run in Little Italy since 1933.`,
          crowd: [
            21,
            15,
            10
          ],
          lat: 45.5,
          lng: -73.57
        }
      ]
    }
  ];

  // <stdin>
  var f = itineraries_default[0], FLIGHT = { flight: f.flight, rounds: f.rounds.map((r) => ({ ...r, img: r.img ? "../../public" + r.img : void 0 })) };
  window.BT = { ...rules_exports, ...engine_exports, COUNTRY_NAMES: COUNTRIES.map((c) => c.name), CITIES: cities_default, norm, FLIGHT };
})();
