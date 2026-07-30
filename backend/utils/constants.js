export const APP_ROLES = ["admin", "zone_manager", "volunteer"];

export const SKILLS = [
  "medical",
  "security",
  "crowd",
  "lost_found",
  "translator",
  "logistics",
  "fire",
];

export const VOLUNTEER_STATUSES = ["available", "busy", "off", "sos"];

export const INCIDENT_TYPES = [
  "medical",
  "lost_child",
  "crowd_surge",
  "fire",
  "security",
  "lost_item",
];

export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"];
export const INCIDENT_STATUSES = ["open", "dispatched", "resolved"];
export const ASSIGNMENT_STATUSES = ["pending", "dispatched", "acknowledged", "completed"];
export const TASK_STATUSES = ["open", "in_progress", "completed"];
export const ATTENDANCE_STATUSES = ["checked_in", "checked_out", "absent"];
export const SYSTEM_LOG_LEVELS = ["debug", "info", "warn", "error"];

export const NOTIFICATION_TYPES = ["info", "success", "warning", "critical"];

export const ZONE_BLUEPRINTS = [
  { id: "Z1", name: "Sangam Nose", density: 92, active: 1840, capacity: 2200, x: 50, y: 48 },
  { id: "Z2", name: "Ghat 5 - Triveni", density: 78, active: 1120, capacity: 1500, x: 36, y: 32 },
  { id: "Z3", name: "Akhara Sector", density: 64, active: 980, capacity: 1400, x: 68, y: 28 },
  { id: "Z4", name: "Camp A-7", density: 41, active: 540, capacity: 1000, x: 22, y: 64 },
  { id: "Z5", name: "Parking P3", density: 35, active: 320, capacity: 800, x: 78, y: 70 },
  { id: "Z6", name: "Medical Camp 2", density: 58, active: 280, capacity: 500, x: 58, y: 76 },
  { id: "Z7", name: "Lost and Found Hub", density: 49, active: 210, capacity: 400, x: 30, y: 80 },
];

export const SAMPLE_NAMES = [
  "Aarav Sharma",
  "Priya Patel",
  "Rohit Verma",
  "Ananya Iyer",
  "Vikram Singh",
  "Meera Nair",
  "Kabir Joshi",
  "Ishita Rao",
  "Arjun Mehta",
  "Sneha Kulkarni",
  "Devansh Gupta",
  "Kavya Reddy",
  "Yash Malhotra",
  "Tanvi Bose",
  "Nikhil Khanna",
  "Riya Chatterjee",
  "Aditya Pillai",
  "Sara Das",
  "Manav Bhatt",
  "Pooja Menon",
  "Harsh Vardhan",
  "Neha Pandey",
  "Karan Kapoor",
  "Diya Saxena",
  "Rahul Choudhary",
];

export const LANGUAGES = [
  "Hindi",
  "English",
  "Bhojpuri",
  "Bengali",
  "Tamil",
  "Marathi",
  "Gujarati",
];

export const DEFAULT_USERS = [
  {
    email: "admin@sevakai.dev",
    password: "Admin@123456",
    role: "admin",
    fullName: "Shivani Operations",
    phone: "+91 9000000001",
    zoneId: "Z1",
  },
  {
    email: "manager@sevakai.dev",
    password: "Manager@123456",
    role: "zone_manager",
    fullName: "Raghav Zone Lead",
    phone: "+91 9000000002",
    zoneId: "Z1",
  },
  {
    email: "volunteer@sevakai.dev",
    password: "Volunteer@123456",
    role: "volunteer",
    fullName: "Aarav Sharma",
    phone: "+91 9000000003",
    zoneId: "Z2",
  },
];

export const SHIFT_TEMPLATE = [
  { time: "06:00 - 10:00", activity: "Morning support" },
  { time: "10:00 - 10:30", activity: "Mandatory break", break: true },
  { time: "10:30 - 14:00", activity: "Lost and found triage" },
  { time: "14:00 - 18:00", activity: "Crowd watch" },
];
