# HealthyBite - Personal Nutrition Management System
HealthyBite is a full-stack web application for managing personal nutrition, health profiles, meal logs, body weight, and daily nutrition reports. The system helps users track calories, macronutrients, food intake, and personal health goals through a React frontend and an ASP.NET Core Web API backend.

## Overview
HealthyBite was developed as a graduation/thesis web application. The project focuses on personal nutrition tracking and supports the main user flow from authentication, onboarding, goal setup, food searching, meal logging, dashboard monitoring, and nutrition reporting.
The system is designed using a frontend-backend architecture:

- Frontend: React + TypeScript + Vite
- Backend: ASP.NET Core Web API
- Database: MariaDB/MySQL
- Deployment: Docker Compose

## Main Features
- User registration and login
- Health profile management
- Goal management based on personal body information
- Food search from local nutrition data and external food API configuration
- Meal logging by meal type such as breakfast, lunch, dinner, and snack
- Dashboard for daily nutrition summary
- Nutrition reports and progress tracking
- Weight log management
- Refresh token configuration for authentication flow
- Docker-based deployment using Docker Compose

## Tech Stack
### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios
- Nginx for production static hosting
### Backend
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- MariaDB/MySQL
- Swagger/OpenAPI
- Health Checks
- Docker
### Database
- MariaDB 10.4
- Entity Framework Core database mapping

## Project Structure
```txt
HealthyBite/
├── Frontend/                 # React + TypeScript frontend application
│   ├── src/                  # Frontend source code
│   ├── Dockerfile            # Frontend Docker build configuration
│   └── nginx.conf            # Nginx configuration for production
│
├── Backend/                  # ASP.NET Core Web API backend
│   ├── Controllers/          # API controllers
│   ├── Services/             # Business logic services
│   ├── Models/               # Entity models
│   ├── DTOs/                 # Request/response data transfer objects
│   ├── Data/                 # DbContext, seed data, and database-related files
│   ├── Extensions/           # Application and service configuration extensions
│   ├── Dockerfile            # Backend Docker build configuration
│   └── appsettings.json      # Backend configuration with placeholder values
│
├── docker-compose.yml        # Docker Compose configuration
├── .gitignore                # Ignored files and sensitive/generated folders
└── README.md                 # Project documentation
