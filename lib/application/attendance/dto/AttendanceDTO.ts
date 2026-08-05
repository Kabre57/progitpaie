export interface AttendanceUserDTO {
  id: string;
  name: string;
  email: string;
  employeeId?: string | null;
}

export interface GeoPointDTO {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  distanceMeters?: number | null;
  isWithinFence: boolean;
}

export interface AttendanceDTO {
  id: string;
  companyId: string;
  userId: string;
  user?: AttendanceUserDTO;
  date: string;
  checkIn: string;
  checkOut?: string | null;
  status: string;
  hoursWorked: number;
  workingMinutes: number;
  overtimeMinutes: number;
  overtimeRate: number;
  location?: GeoPointDTO | null;
  notes: string;
  exceptionStatus?: string | null;
  exceptionType?: string | null;
  exceptionReason?: string | null;
  overriddenById?: string | null;
  overriddenBy?: { id: string; name: string } | null;
  overriddenAt?: string | null;
  outOfOffice: boolean;
  createdAt?: string;
  updatedAt?: string;
}
