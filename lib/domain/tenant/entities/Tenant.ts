import { TenantId } from "../value-objects/TenantId";
import { TenantStatus } from "../value-objects/TenantStatus";

export interface TenantProps {
  id: TenantId;
  name: string;
  taxNumber?: string;
  cnpsNumber?: string;
  rccm?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant {
  private props: TenantProps;

  constructor(props: TenantProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error("La raison sociale de l'entreprise est obligatoire");
    }
    this.props = props;
  }

  public get id(): TenantId {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get taxNumber(): string | undefined {
    return this.props.taxNumber;
  }

  public get cnpsNumber(): string | undefined {
    return this.props.cnpsNumber;
  }

  public get rccm(): string | undefined {
    return this.props.rccm;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get city(): string | undefined {
    return this.props.city;
  }

  public get country(): string | undefined {
    return this.props.country;
  }

  public get phone(): string | undefined {
    return this.props.phone;
  }

  public get email(): string | undefined {
    return this.props.email;
  }

  public get isMain(): boolean {
    return this.props.isMain;
  }

  public get status(): TenantStatus {
    return this.props.status;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  public activate(): void {
    this.props.status = new TenantStatus("ACTIVE");
    this.props.updatedAt = new Date();
  }

  public suspend(): void {
    if (this.props.isMain) {
      throw new Error("L'entreprise principale (siège) ne peut pas être suspendue");
    }
    this.props.status = new TenantStatus("SUSPENDED");
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    if (this.props.isMain) {
      throw new Error("L'entreprise principale (siège) ne peut pas être désactivée");
    }
    this.props.status = new TenantStatus("INACTIVE");
    this.props.updatedAt = new Date();
  }
}
