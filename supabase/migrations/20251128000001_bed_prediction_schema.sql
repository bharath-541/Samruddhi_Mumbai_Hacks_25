-- Migration: Add bed prediction model parameters to hospitals table
-- Date: 2025-11-28
-- Purpose: Support ML-based bed demand forecasting

-- Add model-required columns to hospitals table
ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS total_beds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icu_beds INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS doctors_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nurses_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_bed_demand INT DEFAULT 0,  -- Auto-updated from admissions
  ADD COLUMN IF NOT EXISTS hospital_type TEXT CHECK (hospital_type IN ('Government', 'Private', 'Trust')),
  ADD COLUMN IF NOT EXISTS bed_occupancy_rate DECIMAL(5,2) DEFAULT 0.0;  -- Auto-calculated

-- Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_hospitals_bed_demand ON hospitals(current_bed_demand);
CREATE INDEX IF NOT EXISTS idx_hospitals_total_beds ON hospitals(total_beds);
CREATE INDEX IF NOT EXISTS idx_hospitals_type ON hospitals(hospital_type);

-- Function to auto-update current_bed_demand from admissions
CREATE OR REPLACE FUNCTION update_hospital_bed_demand()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_bed_demand for the hospital
  UPDATE hospitals
  SET 
    current_bed_demand = (
      SELECT COUNT(*)
      FROM admissions
      WHERE hospital_id = NEW.hospital_id
        AND status = 'admitted'  -- Only count active admissions
        AND discharge_time IS NULL
    ),
    bed_occupancy_rate = ROUND(
      (SELECT COUNT(*)::DECIMAL FROM admissions 
       WHERE hospital_id = NEW.hospital_id 
         AND status = 'admitted'
         AND discharge_time IS NULL)
      / NULLIF(total_beds, 0) * 100, 
      2
    ),
    updated_at = NOW()
  WHERE id = NEW.hospital_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update bed demand on admission changes
DROP TRIGGER IF EXISTS trigger_update_bed_demand ON admissions;
CREATE TRIGGER trigger_update_bed_demand
  AFTER INSERT OR UPDATE OR DELETE ON admissions
  FOR EACH ROW
  EXECUTE FUNCTION update_hospital_bed_demand();

-- Function to sync hospital_type from type column
CREATE OR REPLACE FUNCTION sync_hospital_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Capitalize type to match model expectations (Government/Private/Trust)
  NEW.hospital_type = INITCAP(COALESCE(NEW.type, 'Government'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-sync hospital_type
DROP TRIGGER IF EXISTS trigger_sync_hospital_type ON hospitals;
CREATE TRIGGER trigger_sync_hospital_type
  BEFORE INSERT OR UPDATE OF type ON hospitals
  FOR EACH ROW
  EXECUTE FUNCTION sync_hospital_type();

-- Create table for historical bed demand (for model training)
CREATE TABLE IF NOT EXISTS hospital_bed_demand_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_of_week INT NOT NULL,  -- 0=Monday, 6=Sunday
  month INT NOT NULL,
  week_of_year INT NOT NULL,
  is_weekend BOOLEAN NOT NULL,
  season TEXT NOT NULL,  -- Summer, Monsoon, Winter, Spring
  festival_intensity INT DEFAULT 0,
  is_festival BOOLEAN DEFAULT FALSE,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  aqi DECIMAL(6,2),
  rainfall DECIMAL(6,2),
  current_bed_demand INT NOT NULL,
  total_beds INT NOT NULL,
  icu_beds INT NOT NULL,
  doctors_count INT NOT NULL,
  nurses_count INT NOT NULL,
  hospital_type TEXT NOT NULL,
  lag_1_day INT,
  lag_7_day INT,
  lag_14_day INT,
  rolling_avg_7 DECIMAL(10,2),
  rolling_avg_14 DECIMAL(10,2),
  rolling_std_7 DECIMAL(10,2),
  predicted_demand INT,  -- ML model prediction
  prediction_confidence DECIMAL(5,4),  -- Model confidence score
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_bed_history_hospital_date 
  ON hospital_bed_demand_history(hospital_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_bed_history_date 
  ON hospital_bed_demand_history(date DESC);

-- Function to log daily bed demand
CREATE OR REPLACE FUNCTION log_daily_bed_demand()
RETURNS void AS $$
BEGIN
  INSERT INTO hospital_bed_demand_history (
    hospital_id,
    date,
    day_of_week,
    month,
    week_of_year,
    is_weekend,
    season,
    current_bed_demand,
    total_beds,
    icu_beds,
    doctors_count,
    nurses_count,
    hospital_type
  )
  SELECT
    h.id,
    CURRENT_DATE,
    EXTRACT(DOW FROM CURRENT_DATE)::INT,
    EXTRACT(MONTH FROM CURRENT_DATE)::INT,
    EXTRACT(WEEK FROM CURRENT_DATE)::INT,
    EXTRACT(DOW FROM CURRENT_DATE) IN (0, 6),  -- Weekend check
    CASE 
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (6, 7, 8, 9) THEN 'Monsoon'
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (12, 1, 2) THEN 'Winter'
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) IN (3, 4, 5) THEN 'Summer'
      ELSE 'Spring'
    END,
    h.current_bed_demand,
    h.total_beds,
    h.icu_beds,
    h.doctors_count,
    h.nurses_count,
    h.hospital_type
  FROM hospitals h
  WHERE h.is_active = TRUE
  ON CONFLICT DO NOTHING;  -- Prevent duplicates
END;
$$ LANGUAGE plpgsql;

-- Comment on columns for documentation
COMMENT ON COLUMN hospitals.total_beds IS 'Total bed capacity for ML predictions';
COMMENT ON COLUMN hospitals.icu_beds IS 'ICU bed capacity for critical care forecasting';
COMMENT ON COLUMN hospitals.doctors_count IS 'Number of doctors (affects capacity)';
COMMENT ON COLUMN hospitals.nurses_count IS 'Number of nurses (affects capacity)';
COMMENT ON COLUMN hospitals.current_bed_demand IS 'Auto-updated from active admissions';
COMMENT ON COLUMN hospitals.bed_occupancy_rate IS 'Percentage of beds occupied (auto-calculated)';
COMMENT ON TABLE hospital_bed_demand_history IS 'Historical bed demand data for ML model training and predictions';
