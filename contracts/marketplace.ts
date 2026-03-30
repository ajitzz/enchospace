export type BookingMode = 'request_to_book' | 'instant_book' | 'manual_approval';
export type PaymentMode = 'full_upfront' | 'deposit_plus_balance' | 'pay_later';
export type StayMode = 'long_stay_only' | 'short_stay_only' | 'both';

export interface ListingPolicyDTO {
  bookingMode: BookingMode;
  paymentMode: PaymentMode;
  stayMode: StayMode;
  minStayNights: number;
  maxStayNights?: number;
  depositPercent?: number;
  balanceDueDaysBeforeCheckin?: number;
  cancellationPolicyKey: 'flexible' | 'standard' | 'strict';
}

export interface CreateListingDTO {
  title: string;
  description?: string;
  address: {
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  unit: {
    unitName: string;
    unitType: 'APARTMENT' | 'ROOM' | 'STUDIO';
    bedrooms?: number;
    bathrooms?: number;
    areaSqft?: number;
    maxGuests?: number;
    basePrice: number;
    currency: string;
  };
  amenities: string[];
  mediaUrls: string[];
  policy: ListingPolicyDTO;
}

export interface BookingQuoteDTO {
  unitId: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
}

export interface AdminOverridePolicyDTO {
  unitId: string;
  forceBookingMode?: BookingMode;
  forcePaymentMode?: PaymentMode;
  forceStayMode?: StayMode;
  allowInstantBook?: boolean;
  allowPayLater?: boolean;
  reason: string;
}
