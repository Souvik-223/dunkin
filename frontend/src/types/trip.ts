export interface TripInput {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
  start_time?: string;
  driver_name?: string;
  carrier_name?: string;
  truck_tractor_no?: string;
}

export interface TripPreset {
  id: string;
  title: string;
  description: string;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
}

export interface TripHistoryItem {
  id: number;
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  current_cycle_used_hours: number;
  total_distance_miles: number;
  total_duration_hours: number;
  total_driving_hours: number;
  days_count: number;
  created_at: string;
}

export interface LocationInfo {
  lat: number;
  lng: number;
  display_name: string;
}

export interface LocationSuggestion {
  id: string;
  name: string;
  state?: string;
  country?: string;
  country_code?: string;
  display_name: string;
  short_name: string;
  lat: number;
  lng: number;
}

export interface StopData {
  stop_type: 'START' | 'PICKUP' | 'DROPOFF' | 'REST_30M' | 'REST_10H' | 'FUEL' | 'BREAKPOINT';
  location_name: string;
  coordinates: [number, number];
  arrival_time: string;
  departure_time: string;
  duration_hours: number;
  description: string;
  miles_from_start: number;
  // Real Place & Verified Facility details (100% Free)
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  rating?: number;
  user_ratings_total?: number;
  photo_url?: string;
  amenities?: string[];
  brand?: string;
  google_maps_url?: string;
}

export interface RouteLeg {
  name: string;
  from: string;
  to: string;
  distance_miles: number;
  duration_hours: number;
  has_route?: boolean;
}

export interface RouteData {
  total_distance_miles: number;
  coordinates: [number, number][];
  legs: RouteLeg[];
  has_breakpoint?: boolean;
  breakpoint_location?: string;
  breakpoint_message?: string;
}

export interface TripSummary {
  total_distance_miles: number;
  total_duration_hours: number;
  total_driving_hours: number;
  total_on_duty_hours: number;
  total_rest_hours: number;
  start_time: string;
  estimated_arrival: string;
  initial_cycle_used_hours: number;
  final_cycle_used_hours: number;
  cycle_remaining_hours: number;
  days_count: number;
  has_breakpoint?: boolean;
  breakpoint_location?: string;
  breakpoint_message?: string;
}

export interface DutySegment {
  status: 'OFF_DUTY' | 'SLEEPER_BERTH' | 'DRIVING' | 'ON_DUTY_NOT_DRIVING';
  row: number; // 1: Off Duty, 2: Sleeper, 3: Driving, 4: On Duty
  start_hour: number;
  end_hour: number;
  duration_hours: number;
  start_time_str: string;
  end_time_str: string;
  location: string;
  remarks: string;
}

export interface GraphPoint {
  x: number; // 0.0 to 24.0 hours
  y: number; // 1 to 4 row index
}

export interface ELDGridTotals {
  off_duty_hours: number;
  sleeper_berth_hours: number;
  driving_hours: number;
  on_duty_not_driving_hours: number;
  total_hours: number;
}

export interface ELDRemark {
  time: string;
  status: string;
  location: string;
  remark: string;
}

export interface ELDRecap {
  rule: string;
  on_duty_hours_today: number;
  total_hours_last_7_days_including_today: number;
  total_hours_available_tomorrow: number;
  cycle_limit: number;
}

export interface ELDLogSheet {
  day_number: number;
  total_days: number;
  date: string;
  formatted_date: string;
  header: {
    driver_name: string;
    carrier_name: string;
    main_office_address: string;
    home_terminal_address: string;
    truck_tractor_numbers: string;
    from_location: string;
    to_location: string;
    total_miles_driving_today: number;
  };
  grid_data: {
    segments: DutySegment[];
    graph_points: GraphPoint[];
    totals: ELDGridTotals;
  };
  remarks: ELDRemark[];
  recap: ELDRecap;
}

export interface TripPlanResult {
  trip_id?: number | null;
  locations: {
    origin: LocationInfo;
    pickup: LocationInfo;
    dropoff: LocationInfo;
  };
  route: RouteData;
  stops: StopData[];
  summary: TripSummary;
  log_sheets: ELDLogSheet[];
}
