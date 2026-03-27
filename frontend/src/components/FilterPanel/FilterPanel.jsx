import { LISTING_TYPES, CATEGORIES } from '../../utils/constants';

const FilterPanel = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 sticky top-24">
      <h3 className="text-sm font-black uppercase tracking-wider mb-6">Filters</h3>

      <div className="space-y-6">
        {/* Type Filter */}
        <div>
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Listing Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="type"
                value=""
                checked={!filters.type}
                onChange={() => onFilterChange('type', '')}
                className="w-4 h-4 text-black focus:ring-black"
              />
              <span className="text-sm font-bold group-hover:text-black transition-colors">All Types</span>
            </label>
            {LISTING_TYPES.map((type) => (
              <label key={type.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={filters.type === type.value}
                  onChange={(e) => onFilterChange('type', e.target.value)}
                  className="w-4 h-4 text-black focus:ring-black"
                />
                <span className="text-sm font-bold group-hover:text-black transition-colors">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
            Price Range
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
            />
          </div>
        </div>

        {/* Bargaining */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.bargaining || false}
              onChange={(e) => onFilterChange('bargaining', e.target.checked)}
              className="w-4 h-4 text-black focus:ring-black rounded"
            />
            <span className="text-sm font-bold group-hover:text-black transition-colors">Bargaining Allowed</span>
          </label>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => onFilterChange('clear')}
          className="w-full bg-gray-100 text-black py-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
