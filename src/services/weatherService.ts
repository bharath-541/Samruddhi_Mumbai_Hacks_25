export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'fog';
  aqi: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  location: string;
  lastUpdated: Date;
}

export interface WeatherForecast {
  date: Date;
  high: number;
  low: number;
  condition: WeatherData['condition'];
  precipitationChance: number;
}

export class WeatherService {
  private static instance: WeatherService;
  
  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private getRandomCondition(): WeatherData['condition'] {
    const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'stormy', 'fog'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private getRandomWindDirection(): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  public getCurrentWeather(): WeatherData {
    // Mock weather data for Mumbai/Kharghar area
    return {
      temperature: Math.round(24 + Math.random() * 12), // 24-36°C
      humidity: Math.round(60 + Math.random() * 30), // 60-90%
      windSpeed: Math.round(5 + Math.random() * 15), // 5-20 km/h
      windDirection: this.getRandomWindDirection(),
      condition: this.getRandomCondition(),
      aqi: Math.round(50 + Math.random() * 100), // 50-150 AQI
      pressure: Math.round(1010 + Math.random() * 20), // 1010-1030 hPa
      visibility: Math.round(5 + Math.random() * 10), // 5-15 km
      uvIndex: Math.round(3 + Math.random() * 8), // 3-11
      location: 'Kharghar, Navi Mumbai',
      lastUpdated: new Date()
    };
  }

  public getWeatherForecast(days: number = 5): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];
    
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date,
        high: Math.round(28 + Math.random() * 8),
        low: Math.round(20 + Math.random() * 6),
        condition: this.getRandomCondition(),
        precipitationChance: Math.round(Math.random() * 100)
      });
    }
    
    return forecast;
  }

  public getWeatherIcon(condition: WeatherData['condition']): string {
    switch (condition) {
      case 'sunny':
        return '☀️';
      case 'cloudy':
        return '☁️';
      case 'rainy':
        return '🌧️';
      case 'stormy':
        return '⛈️';
      case 'fog':
        return '🌫️';
      default:
        return '☀️';
    }
  }

  public getAQIStatus(aqi: number): { status: string; color: string } {
    if (aqi <= 50) return { status: 'Good', color: 'text-green-600' };
    if (aqi <= 100) return { status: 'Moderate', color: 'text-yellow-600' };
    if (aqi <= 150) return { status: 'Unhealthy for Sensitive', color: 'text-orange-600' };
    if (aqi <= 200) return { status: 'Unhealthy', color: 'text-red-600' };
    if (aqi <= 300) return { status: 'Very Unhealthy', color: 'text-purple-600' };
    return { status: 'Hazardous', color: 'text-red-800' };
  }
}
