import { useState, useEffect } from "react";
import { LogisticsTicket, Accommodation } from "../types";

// Unified type for the UI
export interface TripDetails {
  id: string;
  name: string;
  dates: string;
  tickets: LogisticsTicket[];
  accommodations: Accommodation[];
}

const MOCK_TRIP: TripDetails = {
  id: "trip_001",
  name: "Trip: Osaka",
  dates: "June 10--12",
  tickets: [
    {
      id: "ticket_001",
      project_id: "proj_001",
      transport_name: "Shinkansen Nozomi 247",
      seat_number: "Seat 12B",
      departure_time: "2026-06-10T09:00:00Z",
      ticket_file_url: null,
    },
    {
      id: "ticket_002",
      project_id: "proj_001",
      transport_name: "Shinkansen Hikari 500",
      seat_number: "Seat 4A",
      departure_time: "2026-06-12T18:00:00Z",
      ticket_file_url: null,
    }
  ],
  accommodations: [
    {
      id: "hotel_001",
      project_id: "proj_001",
      name: "Hotel Granvia Osaka",
      address: "3-1-1 Umeda, Kita-ku, Osaka",
      map_url: "https://maps.google.com/?q=Hotel+Granvia+Osaka",
      check_in: "2026-06-10T15:00:00Z",
      check_out: "2026-06-12T11:00:00Z",
    }
  ]
};

export function useTravel() {
  const [trip, setTrip] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      setTrip(MOCK_TRIP);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { trip, loading };
}
