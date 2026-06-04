# Git Convention
## Branch Strategy
### Main
```txt
main
```
Production-ready source code.
### Development
```txt
dev
```
Integration branch.
### Feature Branch
Format:
```txt
feature/<feature-name>
```
Examples:
```txt
feature/authentication
feature/food-search
feature/meal-log
feature/dashboard
```
### Bug Fix Branch
Format:
```txt
fix/<issue-name>
```
Examples:
```txt
fix/login-error
fix/profile-update
```
## Commit Convention
Format:
```txt
type: short description
```
### Feature
```txt
feat: add meal logging API
feat: implement dashboard summary
```
### Fix
```txt
fix: resolve login validation issue
fix: correct profile update logic
```
### Refactor
```txt
refactor: simplify meal log service
```
### Documentation
```txt
docs: update README
docs: add backend convention
```
### Style
```txt
style: format code using prettier
```
### Test
```txt
test: add authentication tests
```
## Pull Request Convention
Title:
```txt
[Feature] Meal Logging Module
```
Description:
```txt
Summary
Changes
Testing Result
```
## Merge Rules
Before merging:
* Build frontend successfully
* Build backend successfully
* Verify Docker Compose configuration
* Verify database migration compatibility
## Files Not Allowed in Git
Never commit:
```txt
.env
node_modules/
dist/
bin/
obj/
.vs/
.idea/
```
## Recommended Workflow
```bash
git checkout dev
git pull origin dev
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```
Create Pull Request → Review → Merge into dev → Merge into main.
