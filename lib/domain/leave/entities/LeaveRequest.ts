import { LeaveType } from "../value-objects/LeaveType";
import { LeaveStatus } from "../value-objects/LeaveStatus";
import { LeavePeriod } from "../value-objects/LeavePeriod";

export interface LeaveRequestProps {
  id?: string;
  companyId: string;
  userId: string;
  leaveType: LeaveType;
  period: LeavePeriod;
  reason: string;
  status: LeaveStatus;
  approvedById?: string | null;
  adminComment?: string;
  appliedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class LeaveRequest {
  public readonly id?: string;
  public readonly companyId: string;
  public readonly userId: string;
  public readonly leaveType: LeaveType;
  public readonly period: LeavePeriod;
  public readonly reason: string;
  private _status: LeaveStatus;
  private _approvedById?: string | null;
  private _adminComment: string;
  public readonly appliedAt: Date;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  constructor(props: LeaveRequestProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");
    if (!props.userId) throw new Error("userId est obligatoire");
    if (!props.reason || props.reason.trim().length === 0) throw new Error("Le motif est obligatoire");

    this.id = props.id;
    this.companyId = props.companyId;
    this.userId = props.userId;
    this.leaveType = props.leaveType;
    this.period = props.period;
    this.reason = props.reason.trim();
    this._status = props.status;
    this._approvedById = props.approvedById;
    this._adminComment = props.adminComment || "";
    this.appliedAt = props.appliedAt || new Date();
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get status(): LeaveStatus {
    return this._status;
  }

  public get approvedById(): string | null | undefined {
    return this._approvedById;
  }

  public get adminComment(): string {
    return this._adminComment;
  }

  public approve(adminId: string, comment?: string): void {
    if (!this._status.isPending()) {
      throw new Error("Seule une demande de congé en attente peut être approuvée");
    }
    this._status = LeaveStatus.approved();
    this._approvedById = adminId;
    if (comment) this._adminComment = comment.trim();
  }

  public reject(adminId: string, comment?: string): void {
    if (!this._status.isPending()) {
      throw new Error("Seule une demande de congé en attente peut être rejetée");
    }
    this._status = LeaveStatus.rejected();
    this._approvedById = adminId;
    if (comment) this._adminComment = comment.trim();
  }
}
