export interface NotificationPort {
  notifyPayslipFinalized(userId: string, month: number, year: number): Promise<void>;
}
