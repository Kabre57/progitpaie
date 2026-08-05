import { ContractDistribution } from "../value-objects/ContractDistribution";
import { PayrollCostsSummary } from "../value-objects/PayrollCostsSummary";

export interface DepartmentBreakdownItem {
  name: string;
  count: number;
}

export interface HRReportSummaryProps {
  companyId: string;
  totalEmployees: number;
  activeEmployees: number;
  departmentBreakdown: readonly DepartmentBreakdownItem[];
  contractTypes: ContractDistribution;
  lastMonthCosts: PayrollCostsSummary;
}

export class HRReportSummary {
  public readonly companyId: string;
  public readonly totalEmployees: number;
  public readonly activeEmployees: number;
  public readonly departmentBreakdown: readonly DepartmentBreakdownItem[];
  public readonly contractTypes: ContractDistribution;
  public readonly lastMonthCosts: PayrollCostsSummary;

  constructor(props: HRReportSummaryProps) {
    if (!props.companyId) throw new Error("companyId est obligatoire");

    this.companyId = props.companyId;
    this.totalEmployees = props.totalEmployees;
    this.activeEmployees = props.activeEmployees;
    this.departmentBreakdown = props.departmentBreakdown;
    this.contractTypes = props.contractTypes;
    this.lastMonthCosts = props.lastMonthCosts;
  }

  public get inactiveEmployees(): number {
    return this.totalEmployees - this.activeEmployees;
  }
}
