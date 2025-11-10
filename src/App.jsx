import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PropertyHomePage } from './pages/property/PropertyHomePage';
import { PropertiesPage } from './pages/management/PropertiesPage';
import { PropertyFormPage } from './pages/management/PropertyFormPage';
import { UnitsPage } from './pages/management/UnitsPage';
import { UnitFormPage } from './pages/management/UnitFormPage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';
import { ContractsPage } from './pages/contracts/ContractsPage';
import { ContractFormPage } from './pages/contracts/ContractFormPage';
import { ContractDetailPage } from './pages/contracts/ContractDetailPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import './lib/i18n';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/property/:propertyId" element={<PropertyHomePage />} />

              <Route
                path="/properties"
                element={
                  <ProtectedRoute>
                    <PropertiesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/create"
                element={
                  <ProtectedRoute>
                    <PropertyFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/properties/edit/:propertyId"
                element={
                  <ProtectedRoute>
                    <PropertyFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/units"
                element={
                  <ProtectedRoute>
                    <UnitsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/units/create"
                element={
                  <ProtectedRoute>
                    <UnitFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/units/edit/:unitId"
                element={
                  <ProtectedRoute>
                    <UnitFormPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tickets"
                element={
                  <ProtectedRoute>
                    <TicketsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/create"
                element={
                  <ProtectedRoute>
                    <CreateTicketPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/contracts"
                element={
                  <ProtectedRoute>
                    <ContractsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts/create"
                element={
                  <ProtectedRoute>
                    <ContractFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts/edit/:contractId"
                element={
                  <ProtectedRoute>
                    <ContractFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contracts/:contractId"
                element={
                  <ProtectedRoute>
                    <ContractDetailPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <PaymentsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
