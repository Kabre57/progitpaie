"use client";

import { NeuTable, NeuTableHeader, NeuTableBody, NeuTableRow, NeuTableHead, NeuTableCell } from "@/components/ui/neu-table";
import { NeuBadge } from "@/components/ui/neu-badge";

interface UserData {
  _id: string;
  name: string;
  email: string;
  department?: string;
}

interface AttendanceRecord {
  _id: string;
  userId: UserData | string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  hoursWorked: number;
  status: "present" | "absent" | "late";
  notes?: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

function formatTime(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getUserName(userId: UserData | string): string {
  if (typeof userId === "object" && userId !== null) {
    return userId.name;
  }
  return "Salarié";
}

function getUserDepartment(userId: UserData | string): string {
  if (typeof userId === "object" && userId !== null) {
    return userId.department || "—";
  }
  return "—";
}

function getStatusBadgeVariant(status: string): "present" | "absent" | "late" | "default" {
  switch (status) {
    case "present":
      return "present";
    case "absent":
      return "absent";
    case "late":
      return "late";
    default:
      return "default";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "present":
      return "Présent";
    case "absent":
      return "Absent";
    case "late":
      return "En retard";
    default:
      return status;
  }
}

function formatHours(hours: number | null): string {
  if (hours === null || hours === undefined || hours === 0) return "—";
  return `${hours.toFixed(1)}h`;
}

export function AttendanceTable({ records }: AttendanceTableProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--neu-text-secondary)]">
        <p className="text-lg font-medium">Aucun enregistrement de présence trouvé</p>
        <p className="text-sm mt-1">Essayez d'ajuster vos critères de recherche ou le mois sélectionné.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <NeuTable>
        <NeuTableHeader>
          <NeuTableRow>
            <NeuTableHead>Nom du Salarié</NeuTableHead>
            <NeuTableHead>Direction / Service</NeuTableHead>
            <NeuTableHead>Date</NeuTableHead>
            <NeuTableHead>Heure Arrivée</NeuTableHead>
            <NeuTableHead>Heure Départ</NeuTableHead>
            <NeuTableHead>Durée Travaillée</NeuTableHead>
            <NeuTableHead>Statut</NeuTableHead>
          </NeuTableRow>
        </NeuTableHeader>
        <NeuTableBody>
          {records.map((record) => (
            <NeuTableRow key={record._id}>
              <NeuTableCell className="font-medium text-[var(--neu-text)]">
                {getUserName(record.userId)}
              </NeuTableCell>
              <NeuTableCell>{getUserDepartment(record.userId)}</NeuTableCell>
              <NeuTableCell>{formatDate(record.date)}</NeuTableCell>
              <NeuTableCell>{formatTime(record.checkIn)}</NeuTableCell>
              <NeuTableCell>{formatTime(record.checkOut)}</NeuTableCell>
              <NeuTableCell>{formatHours(record.hoursWorked)}</NeuTableCell>
              <NeuTableCell>
                <NeuBadge variant={getStatusBadgeVariant(record.status)}>
                  {getStatusLabel(record.status)}
                </NeuBadge>
              </NeuTableCell>
            </NeuTableRow>
          ))}
        </NeuTableBody>
      </NeuTable>
    </div>
  );
}
