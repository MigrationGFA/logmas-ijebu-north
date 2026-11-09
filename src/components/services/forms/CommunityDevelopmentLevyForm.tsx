// Community Development Levy classification constants.
// Ported from the Ifo implementation for the levy flow (property classification,
// then property type with its fee). The apply widget renders the levy section
// inline and imports only these constants; the standalone levy form component
// was not ported. Fees below are default figures and can be changed per LGA.
import { Building2, Home, Landmark, Layers, Store } from "lucide-react";

export const LEVY_CLASSIFICATIONS = [
  { id: "residential", label: "Residential Property", icon: Home },
  { id: "commercial", label: "Commercial Property", icon: Store },
  { id: "mixed_use", label: "Mixed-Use Property (Commercial + Residential)", icon: Layers },
  { id: "institutional", label: "Institutional Property", icon: Landmark },
  { id: "other", label: "Other / Specified Property", icon: Building2 },
] as const;

export interface PropertyTypeConfig {
  id: string;
  name: string;
  fee: number;
  unit: string;
}

export const PROPERTY_TYPES_BY_CLASSIFICATION: Record<string, PropertyTypeConfig[]> = {
  residential: [
    { id: "self_contained", name: "Self-contained / Single Room", fee: 5000, unit: "Per unit" },
    { id: "room_and_parlour", name: "Room & Parlour", fee: 7500, unit: "Per unit" },
    { id: "one_bed_flat", name: "1-Bedroom Apartment", fee: 10000, unit: "Per unit" },
    { id: "two_bed_flat", name: "2-Bedroom Apartment", fee: 15000, unit: "Per unit" },
    { id: "three_bed_flat", name: "3-Bedroom Apartment", fee: 20000, unit: "Per unit" },
    { id: "four_bed_flat", name: "4-Bedroom Apartment", fee: 25000, unit: "Per unit" },
    { id: "detached_bungalow", name: "Detached Bungalow", fee: 25000, unit: "Per property" },
    { id: "semi_detached_bungalow", name: "Semi-Detached Bungalow", fee: 30000, unit: "Per property" },
    { id: "five_bed_house", name: "5-Bedroom House", fee: 30000, unit: "Per property" },
    { id: "six_plus_bed_house", name: "6+ Bedroom House", fee: 40000, unit: "Per property" },
    { id: "semi_detached_duplex", name: "Semi-Detached Duplex", fee: 45000, unit: "Per property" },
    { id: "detached_duplex", name: "Detached Duplex", fee: 50000, unit: "Per property" },
    { id: "two_storey_building", name: "2-Storey Residential Building", fee: 60000, unit: "Per property" },
    { id: "three_plus_storey", name: "3+ Storey Residential Building", fee: 75000, unit: "Per property" },
    { id: "block_flats_1_2", name: "Block of Flats (1–2 beds per unit)", fee: 15000, unit: "Per apartment unit" },
    { id: "block_flats_3_4", name: "Block of Flats (3–4 beds per unit)", fee: 20000, unit: "Per apartment unit" },
    { id: "luxury_executive", name: "Luxury / Executive Residential Property", fee: 100000, unit: "Per property" },
  ],
  commercial: [
    { id: "small_shop", name: "Small Shop / Kiosk", fee: 10000, unit: "Per shop" },
    { id: "standard_shop", name: "Standard Shop", fee: 15000, unit: "Per shop" },
    { id: "large_shop", name: "Large Shop", fee: 25000, unit: "Per shop" },
    { id: "small_office", name: "Small Office", fee: 20000, unit: "Per premises" },
    { id: "medium_office", name: "Medium Office", fee: 35000, unit: "Per premises" },
    { id: "large_office", name: "Large Office", fee: 50000, unit: "Per premises" },
    { id: "shopping_complex", name: "Shopping Complex", fee: 100000, unit: "Per property" },
    { id: "plaza", name: "Plaza", fee: 150000, unit: "Per property" },
    { id: "supermarket", name: "Supermarket", fee: 100000, unit: "Per property" },
    { id: "restaurant", name: "Restaurant / Eatery", fee: 50000, unit: "Per premises" },
    { id: "event_centre", name: "Event Centre", fee: 100000, unit: "Per property" },
    { id: "guest_house", name: "Guest House", fee: 100000, unit: "Per property" },
    { id: "hotel_small", name: "Hotel — Small", fee: 150000, unit: "Per property" },
    { id: "hotel_medium", name: "Hotel — Medium", fee: 250000, unit: "Per property" },
    { id: "hotel_large", name: "Hotel — Large", fee: 400000, unit: "Per property" },
    { id: "warehouse", name: "Warehouse", fee: 100000, unit: "Per property" },
    { id: "factory", name: "Factory / Industrial Premises", fee: 250000, unit: "Per property" },
    { id: "filling_station", name: "Filling Station", fee: 200000, unit: "Per property" },
  ],
  institutional: [
    { id: "private_nursery_primary", name: "Private Nursery / Primary School", fee: 50000, unit: "Per property" },
    { id: "private_secondary", name: "Private Secondary School", fee: 100000, unit: "Per property" },
    { id: "tertiary_institution", name: "Tertiary Institution", fee: 200000, unit: "Per property" },
    { id: "private_hospital", name: "Private Hospital", fee: 100000, unit: "Per property" },
    { id: "clinic_maternity", name: "Clinic / Maternity Home", fee: 50000, unit: "Per property" },
    { id: "pharmacy", name: "Pharmacy", fee: 30000, unit: "Per premises" },
    { id: "laboratory", name: "Laboratory", fee: 30000, unit: "Per premises" },
    { id: "private_religious", name: "Private Religious Facility", fee: 50000, unit: "Per property" },
    { id: "large_religious", name: "Large Religious Complex", fee: 100000, unit: "Per property" },
    { id: "ngo_facility", name: "NGO / Community Facility", fee: 30000, unit: "Per property" },
  ],
  other: [
    { id: "other_specified", name: "Specialized / Other Unclassified Property", fee: 0, unit: "Routed to Officer for Classification" },
  ],
};
