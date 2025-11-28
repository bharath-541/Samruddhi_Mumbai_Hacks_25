/**
 * ML Model Service - Bed Demand Prediction
 * Loads the ensemble model and makes predictions
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

interface ModelInput {
    date: string;
    day_of_week: number;
    month: number;
    week_of_year: number;
    is_weekend: boolean;
    season: string;
    festival_intensity: number;
    is_festival: boolean;
    temperature: number;
    humidity: number;
    aqi: number;
    rainfall: number;
    total_beds: number;
    icu_beds: number;
    doctors_count: number;
    nurses_count: number;
    hospital_type: string;
    current_bed_demand: number;
    lag_1_day: number;
    lag_7_day: number;
    lag_14_day: number;
    rolling_avg_7: number;
    rolling_avg_14: number;
    rolling_std_7: number;
}

interface PredictionResult {
    predicted_bed_demand: number;
    confidence: number;
    prediction_date: string;
    current_demand: number;
    surge_expected: boolean;
    surge_percentage: number;
}

/**
 * Call Python script to make prediction using the ML model
 */
export async function predictBedDemand(input: ModelInput): Promise<PredictionResult> {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../scripts/predict_ml.py');
        const modelPath = path.join(__dirname, '../../hospital_ensemble_complete.pkl');

        // Use venv python if available, otherwise fallback to system python
        const venvPython = path.join(process.cwd(), 'venv/bin/python3');
        const pythonCmd = fs.existsSync(venvPython) ? venvPython : 'python3';

        // Call Python script with input data
        const python = spawn(pythonCmd, [scriptPath, JSON.stringify(input), modelPath]);

        let output = '';
        let errorOutput = '';

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', errorOutput);
                reject(new Error(`Prediction failed: ${errorOutput}`));
                return;
            }

            try {
                const result = JSON.parse(output);

                // Calculate surge metrics
                const surgeDiff = result.predicted_bed_demand - input.current_bed_demand;
                const surgePercentage = input.current_bed_demand > 0
                    ? (surgeDiff / input.current_bed_demand) * 100
                    : 0;

                resolve({
                    predicted_bed_demand: Math.round(result.predicted_bed_demand),
                    confidence: result.confidence || 0.85,
                    prediction_date: new Date().toISOString().split('T')[0],
                    current_demand: input.current_bed_demand,
                    surge_expected: surgePercentage > 10, // >10% increase = surge
                    surge_percentage: parseFloat(surgePercentage.toFixed(2))
                });

            } catch (e) {
                reject(new Error(`Failed to parse prediction result: ${output}`));
            }
        });
    });
}

/**
 * Batch prediction for multiple hospitals
 */
export async function batchPredictBedDemand(inputs: ModelInput[]): Promise<PredictionResult[]> {
    const predictions: PredictionResult[] = [];

    for (const input of inputs) {
        try {
            const prediction = await predictBedDemand(input);
            predictions.push(prediction);
        } catch (error) {
            console.error('Batch prediction error for input:', input, error);
            // Continue with other predictions
        }
    }

    return predictions;
}
