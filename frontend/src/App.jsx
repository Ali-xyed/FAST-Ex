import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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
import AdminPage from './pages/admin';
import BargainOffersPage from './pages/bargainOffers';
import ExchangeRequestsPage from './pages/exchangeRequests';

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
          <Route path="/admin" element={<AdminPage />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
