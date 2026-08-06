export type UserRole = "super_admin" | "admin" | "employee";
export type AttendanceStatus = "present" | "absent" | "late" | "half-day" | "on-leave";
export type LeaveType = "sick" | "casual" | "annual" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type PayrollStatus = "draft" | "finalized";
export type NotificationType = "info" | "success" | "warning" | "error";

export interface IUser {
  id: string;
  _id?: string; // Backward compatibility
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId?: string | null;
  departmentId?: string | null;
  department?: IDepartment | string | null;
  shiftId?: string | null;
  shift?: IShift | string | null;
  salary?: number;
  joiningDate?: Date;
  isActive?: boolean;
  leaveBalance?: {
    annual: number;
    sick: number;
    casual: number;
  };
  leaveBalanceAnnual?: number;
  leaveBalanceSick?: number;
  leaveBalanceCasual?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendance {
  id: string;
  _id?: string;
  userId: string | IUser;
  date: string;
  checkIn: Date;
  checkOut: Date | null;
  status: AttendanceStatus;
  hoursWorked: number;
  workingMinutes?: number;
  notes: string;
  location?: { lat: number; lng: number } | null;
  locationLat?: number | null;
  locationLng?: number | null;
  overriddenBy?: string | IUser | null;
  overriddenById?: string | null;
  overriddenAt?: Date | null;
  outOfOffice?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDepartment {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  managerId?: string | IUser | null;
  manager?: IUser | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShift {
  id: string;
  _id?: string;
  name: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  lateThresholdMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeave {
  id: string;
  _id?: string;
  userId: string | IUser;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string | IUser | null;
  approvedById?: string | null;
  adminComment?: string;
  appliedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayroll {
  id: string;
  _id?: string;
  userId: string | IUser;
  month: number;
  year: number;
  basicSalary: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  unpaidLeaveDays: number;
  absentDeduction: number;
  lateDeduction: number;
  unpaidLeaveDeduction: number;
  bonuses: number;
  netSalary: number;
  status: PayrollStatus;
  generatedAt: Date;
  finalizedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotification {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IAuditLog {
  id: string;
  _id?: string;
  performedBy: string | IUser;
  performedById?: string;
  action: string;
  targetModel: string;
  targetId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  code?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
}

// Request body types
export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  department?: string;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface CheckInRequestBody {
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface CheckOutRequestBody {
  notes?: string;
}

export interface CreateDepartmentBody {
  name: string;
  description?: string;
  managerId?: string;
}

export interface CreateShiftBody {
  name: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  lateThresholdMinutes?: number;
}

export interface CreateEmployeeBody {
  name: string;
  email: string;
  password: string;
  department?: string;
  shift?: string;
  salary?: number;
  joiningDate?: Date;
}

export interface UpdateEmployeeBody {
  name?: string;
  email?: string;
  password?: string;
  department?: string;
  shift?: string;
  salary?: number;
  isActive?: boolean;
}

export interface ApplyLeaveBody {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface ApproveLeaveBody {
  adminComment?: string;
}

export interface AttendanceOverrideBody {
  status: AttendanceStatus;
  notes?: string;
}

export interface GeneratePayrollBody {
  month: number;
  year: number;
}

export interface UpdatePayrollBody {
  bonuses?: number;
}

export interface LocationSettingsBody {
  officeLat: number;
  officeLng: number;
  radiusMeters: number;
  strictGeofence: boolean;
}
