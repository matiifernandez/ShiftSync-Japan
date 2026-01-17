// Here we define the TypeScript interfaces for our data models
// It's like schema.rb in Rails but for frontend

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null; // Nullable for now as per schema logic (though ideally required)
  role: "admin" | "staff";
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  preferred_language?: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: "planning" | "active" | "completed";
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role_in_project: string | null;
}

export interface Conversation {
  id: string;
  organization_id: string;
  type: "group" | "direct";
  project_id?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content_original: string;
  content_translated?: string;
  original_language?: string;
  created_at: string;
}

export interface ScheduleItem {
  id: string;
  project_id: string;
  user_id?: string;
  date: string;
  type: "work_shift" | "travel_day" | "off_day";
  start_time?: string;
  end_time?: string;
  location_name?: string;
  notes?: string;
  profiles?: { full_name: string; avatar_url: string };
}

export interface LogisticsTicket {
  id: string;
  project_id: string;
  user_id?: string;
  transport_name: string | null; // "Shinkansen..."
  departure_station?: string;
  arrival_station?: string;
  seat_number: string | null;
  departure_time: string; // ISO Date string
  arrival_time?: string;
  ticket_file_url: string | null;
  profiles?: { full_name: string };
}

export interface Accommodation {
  id: string;
  project_id: string;
  name: string;
  address?: string;
  map_url?: string;
  check_in?: string;
  check_out?: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  project_id?: string;
  user_id: string;
  amount: number;
  currency: string;
  description?: string;
  receipt_url?: string;
  category: "transport" | "accommodation" | "fuel" | "parking" | "meals" | "other";
  paid_by: "employee" | "company";
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: { full_name: string; avatar_url: string }; // For joins
}