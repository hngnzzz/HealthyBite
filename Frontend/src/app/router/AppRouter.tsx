import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import PublicRoute from './PublicRoute'
import BlogPage from '../../pages/BlogPage'
import BodyReviewPage from '../../pages/BodyReviewPage'
import ChooseGoalsPage from '../../pages/ChooseGoalsPage'
import DashboardPage from '../../pages/DashboardPage'
import FillDetailsPage from '../../pages/FillDetailsPage'
import FoodSearchPage from '../../pages/FoodSearchPage'
import ForgotPasswordPage from '../../pages/ForgotPasswordPage'
import GoalManagementPage from '../../pages/GoalManagementPage'
import HomePage from '../../pages/HomePage'
import LoginPage from '../../pages/LoginPage'
import MealLogPage from '../../pages/MealLogPage'
import PlanReadyPage from '../../pages/PlanReadyPage'
import PrivacyPolicyPage from '../../pages/PrivacyPolicyPage'
import RegisterPage from '../../pages/RegisterPage'
import TermsPage from '../../pages/TermsPage'
import WelcomePage from '../../pages/WelcomePage'

const ProfilePage = lazy(() => import('../../pages/ProfilePage'))
const ReportsPage = lazy(() => import('../../pages/ReportsPage'))

function AppRouter() {
  return (
    <Suspense fallback={<div className="app-loading">Loading...</div>}>
      <Routes>
        <Route element={<PublicRoute redirectTo="/dashboard" />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        <Route element={<ProtectedRoute redirectIfActiveProfile />}>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/choose-goals" element={<ChooseGoalsPage />} />
          <Route path="/fill-details" element={<FillDetailsPage />} />
          <Route path="/plan-ready" element={<PlanReadyPage />} />
        </Route>

        <Route element={<ProtectedRoute requireActiveProfile />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/goal-management" element={<GoalManagementPage />} />
          <Route path="/body-review" element={<BodyReviewPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/food-search" element={<FoodSearchPage />} />
          <Route path="/meal-log" element={<MealLogPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
