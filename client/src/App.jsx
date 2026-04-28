import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import LandingPage from './pages/landing';
import RegisterPage from './pages/register';
import LoginPage from './pages/login';
import ForgotPasswordPage from './pages/forgotPassword';
import HomePage from './pages/home';
import ProfilePage from './pages/profile';
import OtherProfilePage from './pages/otherProfile';
import CreateListingPage from './pages/createListing';
import EditListingPage from './pages/editListing';
import ListingDetailsPage from './pages/listingDetails';
import MessagesPage from './pages/messages';
import AdminLoginPage from './pages/adminLogin';
import AdminPage from './pages/admin';
import AdminListingsPage from './pages/adminListings';
import AdminCommentsPage from './pages/adminComments';
import BargainOffersPage from './pages/bargainOffers';
import ExchangeRequestsPage from './pages/exchangeRequests';
import CreateExchangeRequestPage from './pages/createExchangeRequest';

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

          {/* Protected Routes */}
          <Route path="/home" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:email" element={<OtherProfilePage />} />
          <Route path="/create-listing" element={<CreateListingPage />} />
          <Route path="/edit-listing/:id" element={<EditListingPage />} />
          <Route path="/listing/:id" element={<ListingDetailsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/bargain-offers" element={<BargainOffersPage />} />
          <Route path="/exchange-requests" element={<ExchangeRequestsPage />} />
          <Route path="/exchange-request/:listingId" element={<CreateExchangeRequestPage />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminPage /></ProtectedAdminRoute>} />
          <Route path="/admin/listings" element={<ProtectedAdminRoute><AdminListingsPage /></ProtectedAdminRoute>} />
          <Route path="/admin/comments" element={<ProtectedAdminRoute><AdminCommentsPage /></ProtectedAdminRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
