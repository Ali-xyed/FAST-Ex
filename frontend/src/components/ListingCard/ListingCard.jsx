import { useNavigate } from 'react-router-dom';

const ListingCard = ({ listing }) => {
  const navigate = useNavigate();

  const getTypeColor = (type) => {
    switch (type) {
      case 'SELL': return 'bg-green-500';
      case 'RENT': return 'bg-blue-500';
      case 'EXCHANGE': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSellerClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${listing.email}`);
  };

  return (
    <div 
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer"
    >
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <div className="absolute top-3 right-3">
          <div className={`${getTypeColor(listing.type)} text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg`}>
            {listing.type}
          </div>
        </div>

        {listing.marked === 'SOLD' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white text-2xl font-black uppercase tracking-wider">SOLD</span>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-lg font-black tracking-tight text-gray-900 group-hover:text-black line-clamp-1 uppercase">
            {listing.title}
          </h3>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mb-4 font-medium leading-relaxed">
          {listing.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price</p>
            <p className="text-xl font-black text-black">
              {listing.sellListing?.price ? `Rs ${listing.sellListing.price}` : 
               listing.rentListing?.pricePerHour ? `Rs ${listing.rentListing.pricePerHour}/hr` : 
               'Negotiable'}
            </p>
          </div>
          
          <div 
            onClick={handleSellerClick}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              <span className="text-[10px] font-bold">{listing.email?.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
