import React, { useEffect, useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
import { ProductListing } from '../../types/marketplace';
import { formatINR } from '../../utils/rentalLogic';
import {
  WISHLIST_CHANGE_EVENT,
  loadWishlistIds,
  toggleWishlistId,
} from '../../utils/wishlist';
import { ProductImage } from '../ProductImage';

export interface ProductCardProps {
  listing: ProductListing;
  onSelect: (listingId: string) => void;
}

const ProductCardComponent: React.FC<ProductCardProps> = ({
  listing,
  onSelect,
}) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(() =>
    loadWishlistIds().includes(listing.id)
  );

  useEffect(() => {
    const syncWishlist = () => {
      setIsFavorite(loadWishlistIds().includes(listing.id));
    };
    window.addEventListener(WISHLIST_CHANGE_EVENT, syncWishlist);
    window.addEventListener('storage', syncWishlist);
    return () => {
      window.removeEventListener(WISHLIST_CHANGE_EVENT, syncWishlist);
      window.removeEventListener('storage', syncWishlist);
    };
  }, [listing.id]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const next = toggleWishlistId(listing.id);
    setIsFavorite(next.includes(listing.id));
  };

  const isAvailable = listing.status !== 'archived';
  const rentalPeriodLabel =
    listing.minRentalDays && listing.minRentalDays > 1
      ? `per day · Min ${listing.minRentalDays}d`
      : 'per day';

  return (
    <article className="group relative h-full bg-white dark:bg-[#121824] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl overflow-hidden flex flex-col bb-card-interactive shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* Wishlist Control */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-label={
          isFavorite
            ? `Remove ${listing.title} from wishlist`
            : `Save ${listing.title} to wishlist`
        }
        aria-pressed={isFavorite}
        className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-10 h-10 sm:w-9 sm:h-9 rounded-full border flex items-center justify-center bb-btn-interactive cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05A36] ${
          isFavorite
            ? 'bg-white/95 dark:bg-[#0B0F17]/90 border-[#F05A36]/55 text-[#F05A36] shadow-sm shadow-[#F05A36]/20'
            : 'bg-white/85 dark:bg-[#0B0F17]/80 border-slate-200 dark:border-white/[0.12] text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
        }`}
      >
        <Heart
          className={`w-4 h-4 transition-transform duration-180 ${
            isFavorite ? 'fill-[#F05A36] text-[#F05A36] scale-110' : 'scale-100'
          }`}
        />
      </button>

      <button
        type="button"
        onClick={() => onSelect(listing.id)}
        className="text-left flex flex-col flex-1 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#F05A36] cursor-pointer"
      >
        {/* Product Image + Availability Indicator */}
        <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-[#111827] overflow-hidden border-b border-slate-200/80 dark:border-white/[0.08] relative shrink-0">
          <ProductImage
            srcKeyOrUrl={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full bb-card-image"
          />
          <span
            className={`absolute bottom-2 left-2 sm:bottom-3 sm:left-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border backdrop-blur-md ${
              isAvailable
                ? 'bg-white/90 dark:bg-[#0B0F17]/85 text-slate-800 dark:text-[#F8FAFC] border-slate-200 dark:border-white/[0.1]'
                : 'bg-white/90 dark:bg-[#0B0F17]/85 text-slate-500 dark:text-[#94A3B8] border-slate-200 dark:border-white/[0.08]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
          </span>
        </div>

        {/* Card Body with Senior UI/UX Polish */}
        <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2.5 sm:gap-3">
          <div className="space-y-1.5 min-w-0">
            {/* Location */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-[#94A3B8] min-w-0 font-medium">
              <MapPin className="w-3 h-3 text-[#F05A36] shrink-0" />
              <span className="truncate">
                {listing.neighborhood}, {listing.city}
              </span>
            </div>

            {/* Product Name */}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC] group-hover:text-[#F05A36] transition-colors duration-150 line-clamp-2 leading-snug">
              {listing.title}
            </h3>
          </div>

          {/* Rental Price & Rental Period */}
          <div className="pt-2.5 border-t border-slate-200/80 dark:border-white/[0.08] flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
              <span className="text-base sm:text-lg font-extrabold text-[#F05A36] font-mono-tabular">
                {formatINR(listing.dailyPriceINR)}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-[#94A3B8] truncate font-medium">
                {rentalPeriodLabel}
              </span>
            </div>
            <span className="text-xs font-bold text-[#F05A36] group-hover:text-[#E65100] transition-colors shrink-0">
              Rent →
            </span>
          </div>
        </div>
      </button>
    </article>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
