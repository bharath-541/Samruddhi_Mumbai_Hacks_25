#!/usr/bin/env python3
"""
ML Model Prediction Script
Loads the ensemble model and makes bed demand predictions
"""

import sys
import json
import pickle
import pandas as pd
import numpy as np

def load_model(model_path):
    """Load the trained model from pickle file"""
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    return model

def prepare_features(input_data):
    """Convert input JSON to model features"""
    # Create DataFrame with required features
    features = {
        'day_of_week': input_data['day_of_week'],
        'month': input_data['month'],
        'week_of_year': input_data['week_of_year'],
        'is_weekend': 1 if input_data['is_weekend'] else 0,
        'festival_intensity': input_data['festival_intensity'],
        'is_festival': 1 if input_data['is_festival'] else 0,
        'temperature': input_data['temperature'],
        'humidity': input_data['humidity'],
        'aqi': input_data['aqi'],
        'rainfall': input_data['rainfall'],
        'total_beds': input_data['total_beds'],
        'icu_beds': input_data['icu_beds'],
        'doctors_count': input_data['doctors_count'],
        'nurses_count': input_data['nurses_count'],
        'current_bed_demand': input_data['current_bed_demand'],
        'lag_1_day': input_data['lag_1_day'],
        'lag_7_day': input_data['lag_7_day'],
        'lag_14_day': input_data['lag_14_day'],
        'rolling_avg_7': input_data['rolling_avg_7'],
        'rolling_avg_14': input_data['rolling_avg_14'],
        'rolling_std_7': input_data['rolling_std_7']
    }
    
    # Add season one-hot encoding
    seasons = ['Monsoon', 'Winter', 'Summer', 'Spring']
    for season in seasons:
        features[f'season_{season}'] = 1 if input_data['season'] == season else 0
    
    # Add hospital_type one-hot encoding
    hospital_types = ['Government', 'Private', 'Trust']
    for htype in hospital_types:
        features[f'hospital_type_{htype}'] = 1 if input_data['hospital_type'] == htype else 0
    
    # Convert to DataFrame
    df = pd.DataFrame([features])
    
    return df

def predict(model, features):
    """Make prediction using the ensemble model"""
    prediction = model.predict(features)
    
    # Calculate confidence (if model supports predict_proba)
    confidence = 0.85  # Default confidence
    try:
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(features)
            confidence = float(np.max(proba))
    except:
        pass
    
    return {
        'predicted_bed_demand': float(prediction[0]),
        'confidence': confidence
    }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Missing arguments'}))
        sys.exit(1)
    
    try:
        # Parse input
        input_data = json.loads(sys.argv[1])
        model_path = sys.argv[2]
        
        # Load model
        model = load_model(model_path)
        
        # Prepare features
        features = prepare_features(input_data)
        
        # Make prediction
        result = predict(model, features)
        
        # Output result as JSON
        print(json.dumps(result))
        sys.exit(0)
        
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
