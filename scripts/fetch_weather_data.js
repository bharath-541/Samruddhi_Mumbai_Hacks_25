const axios = require('axios');
const { getMongo } = require('../dist/lib/mongo');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

/**
 * Fetch weather data for all hospitals and store in MongoDB
 * This should be run daily (via cron job or scheduler)
 */
async function fetchAndStoreWeatherData() {
    console.log('\n🌤️  Fetching Weather Data for ML Model');
    console.log('='.repeat(60));

    try {
        const db = await getMongo();

        // Get all active hospitals
        const hospitalsCollection = db.collection('hospitals_cache');
        const hospitals = await hospitalsCollection.find({ is_active: true }).toArray();

        if (hospitals.length === 0) {
            console.log('⚠️  No hospitals found. Run seed_hospitals_ml.js first.');
            process.exit(0);
        }

        console.log(`\n📍 Found ${hospitals.length} hospitals`);

        for (const hospital of hospitals) {
            console.log(`\n🏥 ${hospital.name}`);

            const city = hospital.address?.city || 'Mumbai';
            const coords = hospital.coordinates || { lat: 19.0760, lng: 72.8777 }; // Mumbai default

            try {
                // Fetch weather data (using OpenWeatherMap for demo)
                const apiKey = process.env.GOOGLE_API_KEY;

                // In production, use Google Maps Weather API
                // For now, using fallback Mumbai averages
                const weatherData = {
                    hospital_id: hospital.id,
                    hospital_name: hospital.name,
                    city: city,
                    coordinates: coords,
                    temperature: 28.5 + (Math.random() * 5 - 2.5), // 26-31°C
                    humidity: 75 + (Math.random() * 15 - 7.5),    // 67-82%
                    aqi: 150 + (Math.random() * 100 - 50),        // 100-200
                    rainfall: Math.random() * 20,                  // 0-20mm
                    date: new Date().toISOString().split('T')[0],
                    timestamp: new Date(),
                    season: getCurrentSeason(),
                    festival_intensity: 0,  // Can be updated based on calendar
                    is_festival: false
                };

                // Store in MongoDB
                await db.collection('weather_data').updateOne(
                    {
                        hospital_id: hospital.id,
                        date: weatherData.date
                    },
                    { $set: weatherData },
                    { upsert: true }
                );

                console.log(`   ✅ Weather: ${weatherData.temperature.toFixed(1)}°C, ${weatherData.humidity.toFixed(0)}% humidity`);
                console.log(`      AQI: ${weatherData.aqi.toFixed(0)}, Rainfall: ${weatherData.rainfall.toFixed(1)}mm`);

            } catch (error) {
                console.error(`   ❌ Error:`, error.message);
            }
        }

        // Verify storage
        console.log('\n📊 Verifying stored weather data...');
        const today = new Date().toISOString().split('T')[0];
        const weatherCount = await db.collection('weather_data').countDocuments({ date: today });
        console.log(`✅ Stored weather data for ${weatherCount} hospitals`);

        console.log('\n✨ Weather data fetching complete!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 9) return 'Monsoon';
    if (month >= 12 || month <= 2) return 'Winter';
    if (month >= 3 && month <= 5) return 'Summer';
    return 'Spring';
}

fetchAndStoreWeatherData();
