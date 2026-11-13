import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LogOut,
  MapPin,
  Shield,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import {
  AdminRegistryRecord,
  BorrowBoxUserProfile,
  IndianCity,
  ProductListing,
  RentalRequestRecord,
  UserActiveMode,
} from '../types/marketplace';
import {
  ROLE_DEFINITIONS,
  computeEffectivePermissions,
  shouldShowAdminPanelOption,
} from '../utils/adminRbac';
import {
  ALL_CITIES,
  formatINR,
  validateProfileUpdateInput,
} from '../utils/rentalLogic';
import {
  INDIA_STATES_AND_UTS,
  getStateForCity,
  getLocalitiesForCity,
} from '../data/indiaLocations';
import { persistUserProfile } from '../services/marketplaceService';
import { PageRoute } from '../components/Navbar';

interface ProfilePageProps {
  userProfile: BorrowBoxUserProfile;
  verifiedAdminRecord?: AdminRegistryRecord | null;
  onProfileUpdated: (updated: BorrowBoxUserProfile) => void;
  onLogout: () => Promise<void>;
  onNavigate: (route: PageRoute) => void;
  userListings: ProductListing[];
  userRequests: RentalRequestRecord[];
  onToggleUnlist?: (listingId: string, relist: boolean) => Promise<void> | void;
  onDeleteListing?: (listingId: string) => Promise<void> | void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  verifiedAdminRecord = null,
  onProfileUpdated,
  onLogout,
  onNavigate,
  userListings,
  userRequests,
  onToggleUnlist,
  onDeleteListing,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [photoURL, setPhotoURL] = useState(userProfile.photoURL);
  const [city, setCity] = useState<IndianCity>(userProfile.city);
  const [selectedState, setSelectedState] = useState<string>(
    () => getStateForCity(userProfile.city) || ''
  );
  const [neighborhood, setNeighborhood] = useState(userProfile.neighborhood);

  const availableCities = React.useMemo(() => {
    if (!selectedState) return ALL_CITIES;
    const st = INDIA_STATES_AND_UTS.find((s) => s.name === selectedState);
    return st ? st.cities : ALL_CITIES;
  }, [selectedState]);

  const localitySuggestions = React.useMemo(() => {
    return city ? getLocalitiesForCity(city) : [];
  }, [city]);
  const [phone, setPhone] = useState(userProfile.phone);
  const [activeMode, setActiveMode] = useState<UserActiveMode>(
    userProfile.activeMode
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ProductListing | null>(null);

  const formattedCreatedAt = new Date(
    userProfile.createdAtISO
  ).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleModeSwitch = async (newMode: UserActiveMode) => {
    setActiveMode(newMode);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const updated = await persistUserProfile(userProfile.uid, {
        name,
        photoURL,
        city,
        neighborhood,
        phone,
        activeMode: newMode,
      });
      onProfileUpdated(updated);
      setSuccessMessage(
        `Switched active perspective to ${
          newMode === 'renter' ? 'Renter' : 'Owner'
        } mode.`
      );
    } catch {
      setErrorMessage('Failed to update active mode.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const validation = validateProfileUpdateInput({
      name,
      photoURL,
      city,
      neighborhood,
      phone,
      activeMode,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const updated = await persistUserProfile(userProfile.uid, {
        name: name.trim(),
        photoURL: photoURL.trim(),
        city,
        neighborhood: neighborhood.trim(),
        phone: phone.trim(),
        activeMode,
      });

      onProfileUpdated(updated);
      setSuccessMessage(
        'Your profile and contact details have been saved successfully.'
      );
    } catch {
      setErrorMessage('Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePerformLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
      onNavigate({ page: 'home' });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const hasVerifiedAdminAccess =
    shouldShowAdminPanelOption(verifiedAdminRecord) ||
    Boolean(userProfile?.isAdmin);
  const adminPermissions = verifiedAdminRecord
    ? computeEffectivePermissions(
        verifiedAdminRecord.role,
        verifiedAdminRecord.customPermissions,
        verifiedAdminRecord.revokedPermissions
      )
    : null;

  return (
    <div className="bg-transparent min-h-screen py-10 lg:py-14 text-slate-900 dark:text-[#F8FAFC]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => onNavigate({ page: 'home' })}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-[#F05A36] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </button>

          <div className="flex items-center gap-3">
            {hasVerifiedAdminAccess && (
              <button
                type="button"
                onClick={() => onNavigate({ page: 'admin' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F05A36]/15 border border-[#F05A36]/35 text-[#F05A36] text-xs font-semibold hover:bg-[#F05A36]/25 transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePerformLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Profile Card & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Avatar & Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#161E2E] space-y-5 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5733] to-[#F05A36] text-white flex items-center justify-center text-xl font-bold overflow-hidden shadow-lg shadow-[#F05A36]/25">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={name}
                      className="w-full h-full object-cover"
                      onError={() => setPhotoURL('')}
                    />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
                    {name}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                    {userProfile.email}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#F05A36] mt-1 font-semibold">
                    <MapPin className="w-3 h-3" />
                    <span>{city || 'India'}</span>
                  </span>
                </div>
              </div>

              {/* Mode Switcher */}
              <div className="p-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200/80 dark:border-white/[0.06] flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('renter')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeMode === 'renter'
                      ? 'bg-white dark:bg-[#1D293B] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                      : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  Renter Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('owner')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeMode === 'owner'
                      ? 'bg-white dark:bg-[#1D293B] text-slate-900 dark:text-[#F8FAFC] shadow-sm'
                      : 'text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  Owner Mode
                </button>
              </div>

              {/* Account Details */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-[#94A3B8] pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
                <div className="flex justify-between">
                  <span>Member Since:</span>
                  <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{formattedCreatedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trust Status:</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Member</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Listings / Activity Section */}
            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#161E2E] space-y-4 shadow-xl">
              {activeMode === 'renter' ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                      Your Renter Activity
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1D293B] text-slate-600 dark:text-[#94A3B8] font-semibold">
                      {userRequests.length} Requests
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    View items you have rented or requested from neighborhood owners.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'browse' })}
                    className="w-full px-4 py-2 bg-[#F05A36] text-white text-xs font-semibold rounded-xl hover:bg-[#E65100] bb-glow-button cursor-pointer"
                  >
                    Explore Items to Rent
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                        Your Owner Listings
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                        You have {userListings.length} item listing(s) (
                        {
                          userListings.filter(
                            (i) =>
                              i.isListed !== false &&
                              i.status !== 'unlisted' &&
                              i.status !== 'archived'
                          ).length
                        }{' '}
                        active ·{' '}
                        {
                          userListings.filter(
                            (i) =>
                              i.isListed === false ||
                              i.status === 'unlisted' ||
                              i.status === 'archived'
                          ).length
                        }{' '}
                        unlisted)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate({ page: 'list-item' })}
                      className="px-3 py-1.5 bg-[#F05A36] text-white text-xs font-semibold rounded-xl hover:bg-[#E65100] bb-glow-button cursor-pointer"
                    >
                      + List Item
                    </button>
                  </div>

                  {userListings.length > 0 ? (
                    <div className="space-y-2.5 pt-1 max-h-96 overflow-y-auto pr-1">
                      {userListings.map((item) => {
                        const isUnlisted =
                          item.isListed === false || item.status === 'unlisted';
                        return (
                          <div
                            key={item.id}
                            className="bg-slate-50 dark:bg-[#111827] p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] truncate max-w-[28ch]">
                                  {item.title}
                                </h3>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                                  <span>{item.category}</span>
                                  <span>·</span>
                                  <span className="font-mono-tabular font-semibold text-[#F05A36]">
                                    {formatINR(item.dailyPriceINR)}/day
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  isUnlisted
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                }`}
                              >
                                {isUnlisted ? 'Unlisted' : 'Active'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.06]">
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleUnlist &&
                                  onToggleUnlist(item.id, isUnlisted)
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                                  isUnlisted
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                }`}
                                title={
                                  isUnlisted
                                    ? 'Make item live in marketplace'
                                    : 'Hide item from search'
                                }
                              >
                                {isUnlisted ? (
                                  <Eye className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                                <span>
                                  {isUnlisted ? 'Re-list' : 'Unlist / Pause'}
                                </span>
                              </button>

                              <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => setItemToDelete(item)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer"
                                  title="Permanently delete listing"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigate({
                                      page: 'details',
                                      itemId: item.id,
                                    })
                                  }
                                  className="text-[11px] font-semibold text-[#F05A36] hover:underline cursor-pointer"
                                >
                                  View →
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-white/[0.1] rounded-xl text-xs text-slate-500">
                      No equipment listed yet.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column: Edit Profile Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.08] rounded-2xl bg-white/90 dark:bg-[#161E2E] space-y-6 shadow-2xl">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Edit Profile & Isolated Contact Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                  Your profile and contact details are securely managed with end-to-end privacy for seamless neighborhood handovers.
                </p>
              </div>

              {successMessage && (
                <div
                  role="status"
                  className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSaveProfile} noValidate className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#94A3B8] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your legal or display name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#F05A36]"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* State & City Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#94A3B8] mb-1.5">
                      State / UT
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        const newSt = e.target.value;
                        setSelectedState(newSt);
                        const stateObj = INDIA_STATES_AND_UTS.find(
                          (s) => s.name === newSt
                        );
                        if (stateObj && stateObj.cities.length > 0) {
                          setCity(stateObj.cities[0]);
                          setNeighborhood('');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#F05A36]"
                    >
                      <option value="">Select State</option>
                      {INDIA_STATES_AND_UTS.map((st) => (
                        <option key={st.name} value={st.name}>
                          {st.name} ({st.type === 'ut' ? 'UT' : 'State'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#94A3B8] mb-1.5">
                      City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value as IndianCity);
                        setNeighborhood('');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#F05A36]"
                    >
                      <option value="">Select City</option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.city}</p>
                    )}
                  </div>
                </div>

                {/* Locality */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#94A3B8] mb-1.5">
                    Neighborhood / Locality
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g. Indiranagar, Connaught Place, Bandra West"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#F05A36]"
                  />
                  {localitySuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[11px] text-slate-500">Popular:</span>
                      {localitySuggestions.slice(0, 5).map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setNeighborhood(loc)}
                          className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 dark:bg-[#1D293B] text-slate-600 dark:text-[#94A3B8] hover:text-[#F05A36] cursor-pointer"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.neighborhood && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.neighborhood}
                    </p>
                  )}
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#94A3B8] mb-1.5">
                    Mobile Phone Number (Confidential)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number (+91)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#F05A36]"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used strictly for emergency verification and handover OTP. Never published publicly.
                  </p>
                  {errors.phone && (
                    <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Profile Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#94A3B8] mb-1.5">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    value={photoURL}
                    onChange={(e) => setPhotoURL(e.target.value)}
                    placeholder="https://... (or leave empty for monogram)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-white/[0.08] text-sm text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-[#64748B] focus:outline-none focus:border-[#F05A36]"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-[#F05A36] hover:bg-[#E65100] text-white text-xs font-semibold bb-glow-button cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Item Confirmation Modal */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.1] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3
                  id="profile-delete-title"
                  className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]"
                >
                  Delete Item Listing?
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Are you sure you want to permanently delete &ldquo;
              <strong>{itemToDelete.title}</strong>&rdquo;? It will disappear
              from the marketplace and your owner listings.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = itemToDelete.id;
                  setItemToDelete(null);
                  if (onDeleteListing) {
                    await onDeleteListing(id);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
