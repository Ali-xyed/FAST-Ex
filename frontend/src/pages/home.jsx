import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar/Navbar';
import SearchBar from '../components/SearchBar/SearchBar';
import FilterPanel from '../components/FilterPanel/FilterPanel';
import ListingCard from '../components/ListingCard/ListingCard';
import { listingAPI } from '../utils/api';
import toast from 'react-hot-toast';

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    minPrice: '',
    maxPrice: '',
    bargaining: false,
    search: '',
  });

  // Memoize filtered listings to avoid recalculating on every render
  const filteredListings = useMemo(() => {
    let result = listings;
    
    if (filters.minPrice || filters.maxPrice) {
      result = result.filter(listing => {
        if (filters.minPrice && listing.sellListing) {
          if (listing.sellListing.price < parseFloat(filters.minPrice)) return false;
        }
        if (filters.maxPrice && listing.sellListing) {
          if (listing.sellListing.price > parseFloat(filters.maxPrice)) return false;
        }
        return true;
      });
    }
    
    return result;
  }, [listings, filters.minPrice, filters.maxPrice]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      // Backend only supports 'type' and 'search' parameters
      if (filters.type) params.type = filters.type;
      // Only add search if it has a value to avoid backend issues
      if (filters.search && filters.search.trim()) params.search = filters.search.trim();

      const response = await listingAPI.getAll(params);
      
      // Detailed console logs to check backend response
      console.log('=== LISTINGS API RESPONSE ===');
      console.log('📦 Full Response:', response);
      console.log('📦 Response Data:', response.data);
      console.log('📊 Total Listings:', response.data?.length || 0);
      
      if (response.data && response.data.length > 0) {
        console.log('📸 First Listing (Full Object):', response.data[0]);
        console.log('🔑 Keys in First Listing:', Object.keys(response.data[0]));
        console.log('🖼️ imageUrl exists?', 'imageUrl' in response.data[0]);
        console.log('🖼️ imageUrl value:', response.data[0].imageUrl);
        console.log('📧 email:', response.data[0].email);
        console.log('📝 title:', response.data[0].title);
        console.log('💰 sellListing:', response.data[0].sellListing);
        console.log('🏠 rentListing:', response.data[0].rentListing);
        console.log('🔄 exchangeListing:', response.data[0].exchangeListing);
      } else {
        console.log('⚠️ No listings in response');
      }
      console.log('=== END RESPONSE ===');
      
      setListings(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching listings:', error);
      console.error('❌ Error details:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to load listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchListings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, filters.type, filters.search]);

  const handleFilterChange = (key, value) => {
    if (key === 'clear') {
      setFilters({
        type: '',
        minPrice: '',
        maxPrice: '',
        bargaining: false,
        search: '',
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSearch = (query) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans selection:bg-black selection:text-white">
      <Navbar />

      <main className="px-4 lg:px-8 py-8 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Browse Listings</h1>
          <p className="text-gray-400 font-medium">Discover items from your campus community</p>
        </div>

        <div className="mb-8">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
                    <div className="aspect-[4/3] bg-gray-200"></div>
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20">
                <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-2xl font-black mb-2">No listings found</h3>
                <p className="text-gray-400 font-medium mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => navigate('/create-listing')}
                  className="bg-black text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                  Create First Listing
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
