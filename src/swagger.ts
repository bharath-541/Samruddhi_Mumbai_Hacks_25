/**
 * Swagger/OpenAPI Configuration for Samruddhi Backend
 * Complete API Documentation with Interactive UI
 */

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Samruddhi Hospital Management System API',
    version: '1.0.0',
    description: `
# Samruddhi Hospital Management System

A comprehensive healthcare management platform for Maharashtra, India.

## Features
- 🏥 Multi-hospital bed availability tracking
- 👨‍⚕️ Doctor and department management
- 🔐 Secure patient registration with ABHA ID
- 📋 Electronic Health Records (EHR) with MongoDB
- 🤝 Consent-based data sharing with QR codes
- 📊 Real-time bed demand analytics
- 🌐 Weather-based predictive modeling

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Getting Started
1. Register as a patient using \`POST /auth/patient/signup\`
2. Login to get your JWT token using \`POST /auth/patient/login\`
3. Use the token to access protected endpoints

## Base URL
- **Production**: https://samruddhi-backend.onrender.com
- **Local**: http://localhost:3000
    `,
    contact: {
      name: 'Samruddhi Team',
      email: 'support@samruddhi.health'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://samruddhi-backend.onrender.com',
      description: 'Production Server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Local Development Server'
    }
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check and system status endpoints'
    },
    {
      name: 'Authentication',
      description: 'Patient and staff authentication endpoints'
    },
    {
      name: 'Patients',
      description: 'Patient registration, profiles, and search'
    },
    {
      name: 'Hospitals',
      description: 'Hospital information, capacity, and dashboard'
    },
    {
      name: 'Doctors',
      description: 'Doctor listings and availability'
    },
    {
      name: 'Beds',
      description: 'Bed availability and management'
    },
    {
      name: 'Admissions',
      description: 'Patient admission and discharge workflow'
    },
    {
      name: 'Consent',
      description: 'Patient consent management for EHR access'
    },
    {
      name: 'EHR - Patient',
      description: 'Patient self-service EHR endpoints (no consent required)'
    },
    {
      name: 'EHR - Doctor',
      description: 'Doctor endpoints to add data to patient records'
    },
    {
      name: 'EHR - Hospital',
      description: 'Hospital access to patient EHR (requires consent)'
    },
    {
      name: 'File Upload',
      description: 'File upload endpoints for prescriptions and reports'
    },
    {
      name: 'Analytics',
      description: 'ML-powered analytics and predictions'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint'
      },
      ConsentToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Consent token obtained from consent grant endpoint'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          details: {
            type: 'string',
            description: 'Detailed error information'
          }
        }
      },
      Hospital: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: 'a1b2c3d4-1111-4444-8888-111111111111'
          },
          name: {
            type: 'string',
            example: 'King Edward Memorial (KEM) Hospital'
          },
          type: {
            type: 'string',
            enum: ['government', 'private', 'charitable'],
            example: 'government'
          },
          tier: {
            type: 'string',
            enum: ['primary', 'secondary', 'tertiary'],
            example: 'tertiary'
          },
          total_beds: {
            type: 'integer',
            example: 1800
          },
          icu_beds: {
            type: 'integer',
            example: 200
          },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              pincode: { type: 'string' }
            }
          },
          contact_phone: {
            type: 'string',
            example: '+91-22-24107000'
          },
          contact_email: {
            type: 'string',
            example: 'admin@kem.edu'
          },
          is_active: {
            type: 'boolean'
          }
        }
      },
      Patient: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          abha_id: {
            type: 'string',
            pattern: '^\\d{4}-\\d{4}-\\d{4}$',
            example: '1234-5678-9012'
          },
          name: {
            type: 'string'
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other', 'prefer_not_to_say']
          },
          blood_group: {
            type: 'string',
            example: 'O+'
          }
        }
      },
      Doctor: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Dr. Rajesh Kumar'
          },
          specialization: {
            type: 'string',
            example: 'Cardiologist'
          },
          license_number: {
            type: 'string'
          },
          is_on_duty: {
            type: 'boolean'
          },
          hospital_id: {
            type: 'string',
            format: 'uuid'
          }
        }
      },
      Bed: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          bed_number: {
            type: 'string',
            example: 'KEM-001'
          },
          type: {
            type: 'string',
            enum: ['general', 'icu', 'nicu', 'picu', 'emergency', 'isolation'],
            example: 'icu'
          },
          status: {
            type: 'string',
            enum: ['available', 'occupied', 'maintenance', 'reserved'],
            example: 'available'
          },
          floor_number: {
            type: 'integer'
          },
          room_number: {
            type: 'string'
          }
        }
      },
      Admission: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          patient_id: {
            type: 'string',
            format: 'uuid'
          },
          hospital_id: {
            type: 'string',
            format: 'uuid'
          },
          bed_id: {
            type: 'string',
            format: 'uuid'
          },
          primary_doctor_id: {
            type: 'string',
            format: 'uuid'
          },
          admission_date: {
            type: 'string',
            format: 'date-time'
          },
          reason: {
            type: 'string'
          },
          status: {
            type: 'string',
            enum: ['active', 'discharged']
          }
        }
      },
      ConsentRecord: {
        type: 'object',
        properties: {
          consentId: {
            type: 'string',
            format: 'uuid'
          },
          patientId: {
            type: 'string',
            format: 'uuid'
          },
          recipientId: {
            type: 'string',
            format: 'uuid'
          },
          recipientHospitalId: {
            type: 'string',
            format: 'uuid'
          },
          scope: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['profile', 'medical_history', 'prescriptions', 'test_reports', 'iot_devices']
            }
          },
          grantedAt: {
            type: 'string',
            format: 'date-time'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time'
          },
          valid: {
            type: 'boolean'
          },
          revoked: {
            type: 'boolean'
          }
        }
      }
    }
  }
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/server.ts'], // Path to API docs
};
