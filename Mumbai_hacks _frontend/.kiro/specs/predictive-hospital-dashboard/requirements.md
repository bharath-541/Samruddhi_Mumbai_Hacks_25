# Requirements Document

## Introduction

The Predictive Hospital AI Dashboard is a React-based frontend web application designed to help hospital administrators and medical staff visualize patient surge predictions, resource metrics, and AI-generated recommendations. This frontend application will use dummy data to simulate real-time hospital metrics, AI predictions, and recommendations, providing a complete user interface that can later be connected to a backend API.

## Requirements

### Requirement 1

**User Story:** As a hospital administrator, I want to view real-time hospital metrics and AI predictions on a centralized dashboard, so that I can make informed decisions about resource allocation and patient care.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL display dummy data for AQI, bed occupancy percentage, ICU usage percentage, and staff availability percentage
2. WHEN the dashboard is accessed THEN the system SHALL show the current date and time with auto-update functionality
3. WHEN displaying operational states THEN the system SHALL show simulated status indicators (🟢 Normal, 🟠 Alert, � Suroge) based on dummy data
4. WHEN viewing the overview page THEN the system SHALL present a 7-day patient inflow forecast as a line chart using mock data

### Requirement 2

**User Story:** As a medical staff member, I want to receive early warnings about predicted patient surges, so that I can prepare for increased workload and ensure adequate patient care.

#### Acceptance Criteria

1. WHEN displaying surge predictions THEN the system SHALL show alert banners with simulated details and timelines using dummy data
2. WHEN showing environmental alerts THEN the system SHALL display mock alerts like "🚨 Surge expected in 72 hours due to Diwali pollution spike"
3. WHEN simulating system status THEN the system SHALL demonstrate status indicator changes using dummy data scenarios
4. WHEN alerts are displayed THEN the system SHALL ensure they are visible across all relevant pages in the frontend

### Requirement 3

**User Story:** As a hospital planner, I want to access detailed predictions with filtering capabilities, so that I can analyze different scenarios and plan accordingly.

#### Acceptance Criteria

1. WHEN accessing the predictions page THEN the system SHALL display an interactive chart showing mock forecasted patient numbers
2. WHEN using prediction filters THEN the system SHALL allow filtering by event type (Festival/Pollution/Epidemic) and update dummy data accordingly
3. WHEN selecting timeframes THEN the system SHALL support 24-hour, 72-hour, and 7-day prediction windows with corresponding mock data
4. WHEN filters are applied THEN the system SHALL update the chart with filtered dummy data in real-time

### Requirement 4

**User Story:** As a hospital operations manager, I want to receive AI-generated recommendations for staffing, supplies, and patient advisories, so that I can take proactive measures to handle predicted surges.

#### Acceptance Criteria

1. WHEN displaying recommendations THEN the system SHALL show mock recommendations categorized into Staffing Plan, Supplies Plan, and Patient Advisory groups
2. WHEN viewing staffing recommendations THEN the system SHALL display dummy actions like "Increase ER staff by 30%, recall on-call staff"
3. WHEN viewing supply recommendations THEN the system SHALL show mock suggestions like "Order 100 oxygen cylinders"
4. WHEN displaying patient advisories THEN the system SHALL show sample messages like "Send SMS: Air quality severe. Elderly & asthma patients stay indoors"
5. WHEN presented with recommendations THEN the system SHALL provide interactive buttons to Accept, Modify, or Dismiss each recommendation (with frontend-only state management)

### Requirement 5

**User Story:** As a medical professional, I want to understand the reasoning behind AI predictions and recommendations, so that I can validate the system's suggestions and build trust in the technology.

#### Acceptance Criteria

1. WHEN accessing the explainability page THEN the system SHALL provide mock detailed explanations for predictions
2. WHEN viewing explanations THEN the system SHALL show simulated data sources like "AQI API: SO₂ = 95 µg/m³ (↑40%)"
3. WHEN displaying reasoning THEN the system SHALL include dummy historical correlations like "Past Diwali = +60% respiratory cases"
4. WHEN showing predictions THEN the system SHALL display mock confidence levels like "Confidence: 82%"
5. WHEN explanations are provided THEN the system SHALL include sample citations and references to mock data sources

### Requirement 6

**User Story:** As a mobile user, I want to access the dashboard on my smartphone or tablet, so that I can stay informed about hospital status while away from my desktop.

#### Acceptance Criteria

1. WHEN accessing the dashboard on mobile devices THEN the system SHALL display a collapsible hamburger menu for navigation
2. WHEN viewing on mobile THEN the system SHALL show a compact view with the top 3 alerts and recommendations only
3. WHEN the screen size is small THEN the system SHALL maintain readability and functionality of all critical features
4. WHEN navigating on mobile THEN the system SHALL provide easy access to all main sections through the hamburger menu

### Requirement 7

**User Story:** As a user, I want the dashboard to have a clean, professional appearance appropriate for a medical environment, so that I can focus on the data without distractions.

#### Acceptance Criteria

1. WHEN the dashboard loads THEN the system SHALL apply a minimal clinical theme with white and light gray colors
2. WHEN displaying interactive elements THEN the system SHALL use blue highlights for emphasis
3. WHEN showing alerts THEN the system SHALL use red and yellow colors appropriately
4. WHEN rendering components THEN the system SHALL apply soft shadows and 2xl rounded corners for a modern appearance
5. WHEN displaying charts and data THEN the system SHALL ensure high contrast and readability for medical professionals

### Requirement 8

**User Story:** As a system administrator, I want the dashboard to be built with modern, maintainable technologies, so that it can be easily updated and scaled as hospital needs evolve.

#### Acceptance Criteria

1. WHEN developing the application THEN the system SHALL be built using React framework
2. WHEN styling components THEN the system SHALL use TailwindCSS for consistent design
3. WHEN displaying charts THEN the system SHALL use Recharts library for data visualization
4. WHEN building UI components THEN the system SHALL leverage ShadCN UI for consistent component library
5. WHEN the application is deployed THEN the system SHALL be responsive and performant across different devices and browsers