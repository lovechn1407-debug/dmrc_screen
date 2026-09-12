import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../Delhi-Metro-Network_data.csv');
const outputPath = path.join(__dirname, '../src/data/dmrcData.json');

// Ensure src/data directory exists
fs.mkdirSync(path.join(__dirname, '../src/data'), { recursive: true });

const lineColors = {
  "Red line": "#E52D27",
  "Yellow line": "#FFCC00",
  "Blue line": "#0066CC",
  "Blue line branch": "#0099FF",
  "Green line": "#28A745",
  "Green line branch": "#5CDB95",
  "Voilet line": "#8A2BE2",
  "Violet line": "#8A2BE2",
  "Pink line": "#FF59B3",
  "Magenta line": "#C71585",
  "Aqua line": "#00E5FF",
  "Orange line": "#FF8C00",
  "Gray line": "#808080",
  "Rapid Metro": "#00B4D8"
};

// Common Hindi Translations for DMRC Stations
const hindiTranslations = {
  "Kashmere Gate": "कश्मीरी गेट",
  "Rajiv Chowk": "राजीव चौक",
  "Central Secretariat": "केंद्रीय सचिवालय",
  "Hauz Khas": "हौज खास",
  "INADilli Haat INA": "दिल्ली हाट आई.एन.ए.",
  "Dilli Haat INA": "दिल्ली हाट आई.एन.ए.",
  "New Delhi": "नई दिल्ली",
  "Chandni Chowk": "चांदनी चौक",
  "Samaypur Badli": "समयपुर बादली",
  "Huda City Centre": "हुडा सिटी सेंटर",
  "Millennium City Centre Gurugram": "मिललेनियम सिटी सेंटर गुरुग्राम",
  "Rithala": "रिठाला",
  "Shaheed Sthal": "शहीद स्थल",
  "Dwarka Sector 21": "द्वारका सेक्टर 21",
  "Noida City Center": "नोएडा सिटी सेंटर",
  "Botanical Garden": "बॉटेनिकल गार्डन",
  "Janak Puri West": "जनकपुरी पश्चिम",
  "Vaishali": "वैशाली",
  "Anand Vihar": "आनंद विहार",
  "Yamuna Bank": "यमुना बैंक",
  "Kirti Nagar": "कीर्ति नगर",
  "Inderlok": "इंदरलोक",
  "Brigadier Hoshiar Singh": "ब्रिगेडियर होश्यार सिंह",
  "Raja Nahar Singh": "राजा नाहर सिंह",
  "Majlis Park": "मजलिस पार्क",
  "Shiv Vihar": "शिव विहार",
  "Lajpat Nagar": "लजपत नगर",
  "Mayur Vihar Phase-1": "मयूर विहार फेज़-1",
  "Welcome": "वेलकम",
  "Azadpur": "आजादपुर",
  "Netaji Subash Place": "नेताजी सुभाष प्लेस",
  "Delhi Aerocity": "दिल्ली एरोसिटी",
  "IGI Airport": "आई.जी.आई. एयरपोर्ट",
  "Noida Sector 51": "नोएडा सेक्टर 51",
  "Noida Sector 52": "नोएडा सेक्टर 52",
  "Depot Greater Noida": "डिपो ग्रेटर नोएडा",
  "Dwarka": "द्वारका",
  "Najafgarh": "नजफगढ़",
  "Mandawali - West Vinod Nagar": "मंडावली - वेस्ट विनोद नगर",
  "Akshardham": "अक्षरधाम",
  "Barakhamba": "बाराखम्बा",
  "Mandi House": "मंडी हाउस",
  "Supreme Court (Pragati Maidan)": "सुप्रीम कोर्ट (प्रगति मैदान)",
  "Karol Bagh": "करोल बाग",
  "Rajouri Garden": "राजौरी गार्डन",
  "Tilak Nagar": "तिलक नगर",
  "Uttam Nagar East": "उत्तम नगर ईस्ट",
  "Uttam Nagar West": "उत्तम नगर वेस्ट",
  "Subhash Nagar": "सुभाष नगर",
  "Tagore Garden": "टैगोर गार्डन",
  "Ramesh Nagar": "रमेश नगर",
  "Moti Nagar": "मोती नगर",
  "Patel Nagar": "पटेल नगर",
  "Shadipur": "शादीपुर",
  "Jhandewalan": "झंडेवालान",
  "R K Ashram Marg": "आर के आश्रम मार्ग",
  "Janpath": "जनपथ",
  "Khan Market": "खान मार्केट",
  "Jawaharlal Nehru Stadium": "जवाहरलाल नेहरू स्टेडियम",
  "Jangpura": "जंगपुरा",
  "Moolchand": "मूलचंद",
  "Kailash Colony": "कैलाश कॉलोनी",
  "Nehru Place": "नेहरू प्लेस",
  "Kalkaji Mandir": "कालकाजी मंदिर",
  "Govind Puri": "गोविंदपुरी",
  "Okhla": "ओखला",
  "Jasola": "जसोला",
  "Sarita Vihar": "सरिता विहार",
  "Mohan Estate": "मोहन स्टेट",
  "Tughlakabad": "तुगलकाबाद",
  "Badarpur Border": "बदरपुर बॉर्डर",
  "AIIMS": "एम्स",
  "Green Park": "ग्रीन पार्क",
  "Saket": "साकेत",
  "Qutab Minar": "कुतुब मीनार",
  "Chhattarpur": "छतरपुर",
  "Sultanpur": "सुल्तानपुर",
  "Ghitorni": "घिटोरनी",
  "Arjan Garh": "अर्जन गढ़",
  "Guru Dronacharya": "गुरु द्रोणाचार्य",
  "Sikandarpur": "सिकंदरपुर",
  "MG Road": "एम जी रोड",
  "IFFCO Chowk": "इफ्को चौक"
};

const rawContent = fs.readFileSync(csvPath, 'utf-8');
const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);

// Header: Station ID,Station Name,Distance from Start (km),Line,Opening Date,Station Layout,Latitude,Longitude
const header = lines[0].split(',');

const rawStations = [];

for (let i = 1; i < lines.length; i++) {
  const row = lines[i];
  // Simple CSV parser handling quotes
  const matches = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
  if (!matches || matches.length < 8) {
    // fallback regex split
    const parts = row.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
    if (parts.length >= 8) {
      processRow(parts);
    }
    continue;
  }
  processRow(matches);
}

function processRow(cols) {
  const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').trim());
  const id = parseInt(cleanCols[0], 10);
  let rawName = cleanCols[1];
  const distance = parseFloat(cleanCols[2]);
  let line = cleanCols[3];
  if (line === "Voilet line") line = "Violet line";
  const openingDate = cleanCols[4];
  const layout = cleanCols[5];
  const lat = parseFloat(cleanCols[6]);
  const lng = parseFloat(cleanCols[7]);

  if (isNaN(lat) || isNaN(lng)) return;

  // Extract base name and interchange connections
  let name = rawName;
  let connInfo = [];
  const connMatch = rawName.match(/\[Conn:\s*([^\]]+)\]/i);
  if (connMatch) {
    connInfo = connMatch[1].split(',').map(s => s.trim() + (s.trim().toLowerCase().includes('line') ? '' : ' line'));
    name = rawName.replace(/\[Conn:[^\]]+\]/gi, '').trim();
  }

  // Remove trailing notes like "(First station)"
  name = name.replace(/\(First station\)|\(last station\)/gi, '').trim();

  // Find Hindi translation or fallback to transliteration
  const hindiName = hindiTranslations[name] || name;

  rawStations.push({
    id,
    name,
    rawName,
    distance,
    line,
    openingDate,
    layout,
    lat,
    lng,
    connInfo,
    hindiName
  });
}

// Group stations by Line
const lineMap = {};

rawStations.forEach(st => {
  if (!lineMap[st.line]) {
    lineMap[st.line] = [];
  }
  lineMap[st.line].push(st);
});

// Sort stations in each line by distance from start
Object.keys(lineMap).forEach(lineName => {
  lineMap[lineName].sort((a, b) => a.distance - b.distance);
});

// Build Interchange Hubs
const stationOccurrences = {};
rawStations.forEach(st => {
  if (!stationOccurrences[st.name]) {
    stationOccurrences[st.name] = [];
  }
  stationOccurrences[st.name].push(st);
});

const outputData = {
  lines: Object.keys(lineMap).map(lineName => ({
    name: lineName,
    color: lineColors[lineName] || "#888888",
    stations: lineMap[lineName]
  })),
  allStations: rawStations,
  lineColors
};

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
console.log(`Successfully parsed ${rawStations.length} stations across ${Object.keys(lineMap).length} metro lines.`);
