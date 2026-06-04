# Backend Convention
## Overview
The backend follows a layered architecture using ASP.NET Core Web API and Entity Framework Core.
Main layers:
```txt
Controllers
    ↓
Services
    ↓
Data Access (EF Core)
    ↓
MariaDB
```
## Folder Structure

```txt
Backend/
├── Controllers/
├── Services/
├── Models/
├── DTOs/
├── Data/
├── Extensions/
├── Helpers/
├── Mappings/
└── Program.cs
```

## Naming Convention
### Controllers
Format:
```txt
[Entity]Controller.cs
```

Examples:
```txt
AuthController.cs
ProfilesController.cs
FoodItemsController.cs
MealLogsController.cs
DashboardController.cs
```
### Services
Format:
```txt
[Entity]Service.cs
```
Examples:
```txt
AuthService.cs
ProfileService.cs
MealLogService.cs
DashboardService.cs
```

### DTOs
Format:
```txt
CreateProfileDto
UpdateProfileDto
LoginRequestDto
LoginResponseDto
```

### Models
Entity names use singular nouns:
```txt
User
Profile
FoodItem
MealLog
MealLogDetail
RefreshToken
WeightLog
```

## API Convention
### RESTful Design
GET
```http
GET /api/profiles/me
GET /api/fooditems/search
```
POST
```http
POST /api/auth/login
POST /api/profiles
POST /api/meallogs
```
PUT
```http
PUT /api/profiles/{id}
```
DELETE
```http
DELETE /api/meallogs/{id}
```

## Dependency Injection
All services must be registered through:
```txt
Extensions/ServiceCollectionExtensions.cs
```
Avoid creating services manually using:
```csharp
new Service()
```

## Database Convention
Primary Key:
```txt
Id
```
Foreign Key:
```txt
UserId
ProfileId
MealLogId
```
Table Naming:
```txt
users
health_profiles
foods
meal_logs
meal_log_items
refresh_tokens
weight_logs
```

## Error Handling
Use unified API response format.
Example:

```json
{
  "success": false,
  "message": "Profile not found"
}
```

## Security
Never commit:
* JWT secret
* Database password
* API keys
* .env files
Use environment variables instead.
