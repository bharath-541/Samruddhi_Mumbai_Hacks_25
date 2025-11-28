/**
 * Weather Data Service
 * Fetches weather data from Google APIs and stores in MongoDB
 * Required for ML bed demand prediction model
 */

import axios from 'axios';

interface WeatherData {
    temperature: number;      // Celsius
    humidity: number;         // Percentage
    aqi: number;             // Air Quality Index
    rainfall: number;        // mm
    location: {
        city: string;
        lat: number;
        lng: number;
    };
    timestamp: Date;
}

interface HospitalLocation {
    hospital_id: string;
    hospital_name: string;
    city: string;
    coordinates: { lat: number; lng: number };
}

/**
 * Fetch current weather data for a location using Google APIs
 */
export async function fetchWeatherData(
    lat: number,
    lng: number,
    city: string
): Promise<WeatherData> {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        throw new Error('GOOGLE_API_KEY not configured');
    }

    try {
        // Using OpenWeatherMap API (more suitable for temperature, humidity, rainfall)
        // You can switch to Google Maps Air Quality API for AQI
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

        // For AQI, use Google Air Quality API
        const aqiUrl = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;

        // Fetch weather data
        const weatherResponse = await axios.get(weatherUrl);
        const weather = weatherResponse.data;

        // Fetch AQI data
        let aqi = 150; // Default moderate AQI if API fails
        try {
            const aqiResponse = await axios.post(aqiUrl, {
                location: {
                    latitude: lat,
                    longitude: lng
                }
            });
            const aqiData = aqiResponse.data as any;
            aqi = aqiData?.indexes?.[0]?.aqi || aqi;
        } catch (aqiError) {
            console.warn('AQI fetch failed, using default:', aqiError);
        }

        const weatherData = weather as any;
        return {
            temperature: weatherData.main?.temp || 28.5,
            humidity: weatherData.main?.humidity || 75,
            aqi: aqi,
            rainfall: weatherData.rain?.['1h'] || 0, // Last 1 hour rainfall in mm
            location: { city, lat, lng },
            timestamp: new Date()
        };

    } catch (error: any) {
        console.error('Weather API error:', error.message);

        // Fallback to Mumbai average values if API fails
        return {
            temperature: 28.5,
            humidity: 75,
            aqi: 150,
            rainfall: 0,
            location: { city, lat, lng },
            timestamp: new Date()
        };
    }
}

/**
 * Fetch and store weather data for all active hospitals
 */
export async function updateWeatherForHospitals(): Promise<void> {
    const { getMongo } = await import('./mongo');
    const db = await getMongo();

    // Get all active hospitals with coordinates
    const hospitals = await db.collection('hospitals_cache').find({
        is_active: true,
        coordinates: { $exists: true }
    }).toArray();

    console.log(`Fetching weather for ${hospitals.length} hospitals...`);

    for (const hospital of hospitals) {
        try {
            const coords = hospital.coordinates;
            const weatherData = await fetchWeatherData(
                coords.lat,
                coords.lng,
                hospital.address?.city || 'Mumbai'
            );

            // Store in MongoDB
            await db.collection('weather_data').insertOne({
                hospital_id: hospital.id,
                hospital_name: hospital.name,
                ...weatherData,
                date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
            });

            console.log(`✅ Weather updated for ${hospital.name}`);

        } catch (error: any) {
            console.error(`❌ Error fetching weather for ${hospital.name}:`, error.message);
        }
    }
}

/**
 * Get current weather data for a specific hospital
 */
export async function getHospitalWeather(hospitalId: string): Promise<WeatherData | null> {
    const { getMongo } = await import('./mongo');
    const db = await getMongo();

    const today = new Date().toISOString().split('T')[0];

    const weatherDoc = await db.collection('weather_data').findOne({
        hospital_id: hospitalId,
        date: today
    });

    if (!weatherDoc) {
        return null;
    }

    return {
        temperature: weatherDoc.temperature,
        humidity: weatherDoc.humidity,
        aqi: weatherDoc.aqi,
        rainfall: weatherDoc.rainfall,
        location: weatherDoc.location,
        timestamp: weatherDoc.timestamp
    };
}

/**
 * Get weather data for ML model prediction
 * Returns current + historical averages
 */
export async function getWeatherForPrediction(hospitalId: string): Promise<{
    current: WeatherData;
    avg_7_days: { temperature: number; humidity: number; aqi: number; rainfall: number };
    avg_14_days: { temperature: number; humidity: number; aqi: number; rainfall: number };
}> {
    const { getMongo } = await import('./mongo');
    const db = await getMongo();

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // Current weather
    const current = await getHospitalWeather(hospitalId);

    if (!current) {
        throw new Error('No current weather data available');
    }

    // Historical averages
    const last7Days = await db.collection('weather_data')
        .find({
            hospital_id: hospitalId,
            timestamp: { $gte: sevenDaysAgo }
        })
        .toArray();

    const last14Days = await db.collection('weather_data')
        .find({
            hospital_id: hospitalId,
            timestamp: { $gte: fourteenDaysAgo }
        })
        .toArray();

    const avg7 = calculateAverages(last7Days);
    const avg14 = calculateAverages(last14Days);

    return {
        current,
        avg_7_days: avg7,
        avg_14_days: avg14
    };
}

function calculateAverages(data: any[]): any {
    if (data.length === 0) {
        return { temperature: 28, humidity: 75, aqi: 150, rainfall: 0 };
    }

    const sum = data.reduce((acc, d) => ({
        temperature: acc.temperature + d.temperature,
        humidity: acc.humidity + d.humidity,
        aqi: acc.aqi + d.aqi,
        rainfall: acc.rainfall + d.rainfall
    }), { temperature: 0, humidity: 0, aqi: 0, rainfall: 0 });

    const count = data.length;
    return {
        temperature: sum.temperature / count,
        humidity: sum.humidity / count,
        aqi: sum.aqi / count,
        rainfall: sum.rainfall / count
    };
}
