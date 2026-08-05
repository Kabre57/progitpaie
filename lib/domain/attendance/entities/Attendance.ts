import { AttendanceStatus } from "../value-objects/AttendanceStatus";
import { GeoPoint } from "../value-objects/GeoPoint";
import { WorkDuration } from "../value-objects/WorkDuration";

export interface AttendanceProps {
  id?: string;
  companyId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn: Date;
  checkOut?: Date | null;
  status: AttendanceStatus;
  workDuration: WorkDuration;
  location?: GeoPoint | null;
  notes?: string;
  exceptionStatus?: string | null;
  exceptionType?: string | null;
  exceptionReason?: string | null;
  overriddenById?: string | null;
  overriddenAt?: Date | null;
  outOfOffice?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Attendance {
  public readonly id?: string;
  public readonly companyId: string;
  public readonly userId: string;
  public readonly date: string;
  public readonly checkIn: Date;
  private _checkOut?: Date | null;
  private _status: AttendanceStatus;
  private _workDuration: WorkDuration;
  public readonly location?: GeoPoint | null;
  private _notes: string;
  public readonly exceptionStatus?: string | null;
  public readonly exceptionType?: string | null;
  public readonly exceptionReason?: string | null;
  private _overriddenById?: string | null;
  private _overriddenAt?: Date | null;
  public readonly outOfOffice: boolean;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: AttendanceProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.userId) throw new Error("userId est obligatoire");
    if (!props.date) throw new Error("date est obligatoire");

    this.id = props.id;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.date = props.date;
    this.checkIn = props.checkIn;
    this._checkOut = props.checkOut;
    this._status = props.status;
    this._workDuration = props.workDuration;
    this.location = props.location;
    this._notes = props.notes || "";
    this.exceptionStatus = props.exceptionStatus;
    this.exceptionType = props.exceptionType;
    this.exceptionReason = props.exceptionReason;
    this._overriddenById = props.overriddenById;
    this._overriddenAt = props.overriddenAt;
    this.outOfOffice = props.outOfOffice || false;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get checkOut(): Date | null | undefined {
    return this._checkOut;
  }

  public get status(): AttendanceStatus {
    return this._status;
  }

  public get workDuration(): WorkDuration {
    return this._workDuration;
  }

  public get notes(): string {
    return this._notes;
  }

  public get overriddenById(): string | null | undefined {
    return this._overriddenById;
  }

  public get overriddenAt(): Date | null | undefined {
    return this._overriddenAt;
  }

  public processCheckOut(checkOutTime: Date): void {
    if (this._checkOut) {
      throw new Error("L'employé a déjà pointé sa sortie pour aujourd'hui");
    }
    this._checkOut = checkOutTime;
    this._workDuration = WorkDuration.calculateFromTimes(this.checkIn, checkOutTime);
  }

  public overrideStatus(newStatus: AttendanceStatus, adminId: string, adminNotes?: string): void {
    this._status = newStatus;
    this._overriddenById = adminId;
    this._overriddenAt = new Date();
    if (adminNotes) {
      this._notes = this._notes ? `${this._notes} | Admin: ${adminNotes}` : `Admin: ${adminNotes}`;
    }
  }
}
