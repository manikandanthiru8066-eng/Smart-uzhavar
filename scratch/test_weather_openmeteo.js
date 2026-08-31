const http = require('http');

const districts = ['Coimbatore', 'Madurai', 'Nilgiris', 'Chennai', 'Thanjavur', 'Erode', 'Tiruchirappalli', 'Kanyakumari'];

async function fetchWeather(district) {
  return new Promise((resolve, reject) => {
    const url = `http://localhost:8081/api/weather?district=${encodeURIComponent(district)}`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Testing Open-Meteo Weather Integration across Tamil Nadu Districts...\n');
  for (const d of districts) {
    try {
      const res = await fetchWeather(d);
      console.log(`📍 District: [${res.district}]`);
      console.log(`   Coordinates: Lat ${res.latitude}°N, Lng ${res.longitude}°E`);
      console.log(`   Current Weather: ${res.temperatureCelsius}°C | Humidity: ${res.humidityPercentage}% | Rain: ${res.rainfallMm}mm | Wind: ${res.windSpeedKmph} km/h`);
      console.log(`   Condition: ${res.condition} (${res.conditionTa || 'N/A'}) [WMO Code: ${res.weatherCode}]`);
      console.log(`   Live / Cached: isLive=${res.isLive !== false}, cached=${res.cached}`);
      console.log(`   7-Day Forecast Days: ${res.forecast ? res.forecast.length : 0} days`);
      if (res.forecast && res.forecast.length > 0) {
        console.log(`   Sample Forecast [Day 1 - ${res.forecast[0].date}]: Max ${res.forecast[0].tempMax}°C / Min ${res.forecast[0].tempMin}°C, Precip: ${res.forecast[0].precipitationMm}mm, Cond: ${res.forecast[0].condition}`);
        console.log(`   Sample Forecast [Day 7 - ${res.forecast[res.forecast.length - 1].date}]: Max ${res.forecast[res.forecast.length - 1].tempMax}°C / Min ${res.forecast[res.forecast.length - 1].tempMin}°C, Precip: ${res.forecast[res.forecast.length - 1].precipitationMm}mm, Cond: ${res.forecast[res.forecast.length - 1].condition}`);
      }
      console.log('------------------------------------------------------------');
    } catch (e) {
      console.error(`❌ Failed for district ${d}:`, e.message);
    }
  }
}

runTests();
