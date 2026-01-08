// Here we define the TypeScript interfaces for our data models
// It's like schema.rb in Rails but for frontend

export interface Profile {
  id: string;
  role: "admin" | "staff";
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface Project {
  id: string;
  name: string;
  status: "planning" | "active" | "completed";
}

export interface LogisticsTicket {
  id: string;
  transport_name: string; // "Shinkansen..."
  seat_number: string;
  departure_time: string; // ISO Date string
  ticket_file_url: string | null;
}

// ... you can keep adding the rest as we use them
