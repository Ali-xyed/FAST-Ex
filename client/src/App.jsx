import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/landing';
import RegisterPage from './pages/register';
import LoginPage from './pages/login';
import AdminLoginPage from './pages/adminLogin';
import ForgotPasswordPage from './pages/forgotPassword';
import HomePage from './pages/home';
import ProfilePage from './pages/profile';
import OtherProfilePage from './pages/otherProfile';
import CreateListingPage from './pages/createListing';
import EditListingPage from './pages/editListing';
import ListingDetailsPage from './pages/listingDetails';
import MessagesPage from './pages/messages';
import NotificationsPage from './pages/notifications';
import AdminPage from './pages/admin';
import AdminListingsPage from './pages/adminListings';
import AdminCommentsPage from './pages/adminComments';
import BargainOffersPage from './pages/bargainOffers';
import ExchangeRequestsPage from './pages/exchangeRequests';
import CreateExchangeRequestPage from './pages/createExchangeRequest';
import SettingsPage from './pages/settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/users" element={<AdminPage />} />
          <Route path="/admin/listings" element={<AdminListingsPage />} />
          <Route path="/admin/comments" element={<AdminCommentsPage />} />

          {/* Protected Routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile/:email" element={<OtherProfilePage />} />
          <Route path="/create-listing" element={<CreateListingPage />} />
          <Route path="/edit-listing/:id" element={<EditListingPage />} />
          <Route path="/listing/:id" element={<ListingDetailsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/bargain-offers" element={<BargainOffersPage />} />
          <Route path="/exchange-requests" element={<ExchangeRequestsPage />} />
          <Route path="/exchange-request/:listingId" element={<CreateExchangeRequestPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
