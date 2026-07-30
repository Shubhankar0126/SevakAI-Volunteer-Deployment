import axios from "axios";
import { apiClient } from "../client";
import type {
  AttendanceRecord,
  AuthPayload,
  Incident,
  MatchResult,
  NotificationItem,
  OperationsSnapshot,
  Volunteer,
} from "@/lib/operations";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

async function getData<T>(promise: Promise<{ data: ApiEnvelope<T> }>) {
  const response = await promise;
  return response.data.data;
}

export const authApi = {
  async me(): Promise<AuthPayload | null> {
    try {
      return await getData<AuthPayload>(apiClient.get("/auth/me"));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return null;
      }
      throw error;
    }
  },
  register(payload: {
    fullName: string;
    phone?: string;
    role: AuthPayload["role"];
    email: string;
    password: string;
  }) {
    return getData<AuthPayload>(apiClient.post("/auth/register", payload));
  },
  login(payload: { email: string; password: string }) {
    return getData<AuthPayload>(apiClient.post("/auth/login", payload));
  },
  logout() {
    return getData<{ ok: true }>(apiClient.post("/auth/logout"));
  },
};

export const dashboardApi = {
  snapshot() {
    return getData<OperationsSnapshot>(apiClient.get("/dashboard/snapshot"));
  },
  analytics() {
    return getData<
      Pick<OperationsSnapshot, "hourlyLoad" | "zonePerformance" | "volunteers" | "zones">
    >(apiClient.get("/analytics"));
  },
  report() {
    return getData(apiClient.get("/reports/summary"));
  },
};

export const volunteerApi = {
  list(params?: Record<string, string>) {
    return getData<Volunteer[]>(apiClient.get("/volunteers", { params }));
  },
};

export const incidentApi = {
  list(params?: Record<string, string>) {
    return getData<Incident[]>(apiClient.get("/incidents", { params }));
  },
  create(payload: {
    type: Incident["type"];
    zoneId?: string;
    zone?: string;
    severity: Incident["severity"];
    note: string;
    required?: Incident["required"];
    x?: number;
    y?: number;
  }) {
    return getData<Incident>(apiClient.post("/incidents", payload));
  },
  updateStatus(incidentId: string, status: Incident["status"]) {
    return getData<Incident>(apiClient.patch(`/incidents/${incidentId}/status`, { status }));
  },
  resolve(incidentId: string) {
    return getData<Incident>(apiClient.post(`/incidents/${incidentId}/resolve`));
  },
  triggerSos(kind: "critical" | "medical" | "crowd") {
    return getData<Incident>(apiClient.post("/incidents/sos", { kind }));
  },
};

export const assignmentApi = {
  recommendations(incidentId: string, limit = 8) {
    return getData<MatchResult[]>(
      apiClient.get(`/assignments/${incidentId}/recommendations`, {
        params: { limit },
      }),
    );
  },
  dispatch(incidentId: string, limit = 3) {
    return getData<MatchResult[]>(apiClient.post(`/assignments/${incidentId}/dispatch`, { limit }));
  },
};

export const notificationApi = {
  list() {
    return getData<NotificationItem[]>(apiClient.get("/notifications"));
  },
  markRead(notificationId: string) {
    return getData<NotificationItem>(apiClient.patch(`/notifications/${notificationId}/read`));
  },
};

export const attendanceApi = {
  me() {
    return getData<AttendanceRecord | null>(apiClient.get("/attendance/me"));
  },
};

export const assistantApi = {
  ask(question: string) {
    return getData<{ answer: string }>(apiClient.post("/gemini/assistant", { question }));
  },
};
