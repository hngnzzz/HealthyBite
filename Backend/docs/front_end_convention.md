# Front End Convention
## Overview
The frontend is built using:
* React
* TypeScript
* Vite
* React Router
* Axios
## Folder Structure
```txt
Frontend/src
├── pages/
├── components/
├── services/
├── auth/
├── app/
├── hooks/
├── utils/
└── assets/
```
## Page Naming
Format:
```txt
[Feature]Page.tsx
```
Examples:
```txt
LoginPage.tsx
RegisterPage.tsx
DashboardPage.tsx
FoodSearchPage.tsx
MealLogPage.tsx
ProfilePage.tsx
ReportsPage.tsx
```
## Component Naming
Format:
```txt
PascalCase
```
Examples:
```txt
Navbar.tsx
MealCard.tsx
FoodSearchResult.tsx
```
## Service Naming
Format:
```txt
camelCase + Service
```
Examples:
```txt
authService.ts
mealLogService.ts
dashboardService.ts
foodService.ts
```
## Routing Convention
Public routes:
```txt
/login
/register
/forgot-password
```
Protected routes:
```txt
/dashboard
/profile
/meal-log
/reports
```
Use:
```txt
ProtectedRoute.tsx
PublicRoute.tsx
```
for route protection.
## API Calls
All API requests must use:
```txt
axiosClient.ts
```
Do not create Axios instances inside pages.
Correct:
```ts
authService.login()
```
Incorrect:
```ts
axios.post(...)
```
inside page components.
## State Management
Keep page state local whenever possible.
Use Context only for:
* Authentication
* Global session data
## Styling
Prefer:
```txt
Feature-based structure
Reusable components
Consistent spacing
```
Avoid:
```txt
Inline styles everywhere
Duplicated UI code
```
## Code Style
Use:
```txt
PascalCase → Components
camelCase → Variables
UPPER_CASE → Constants
```

Example:
```ts
const activeProfileId = 1;
const API_BASE_URL = "/api";
```
