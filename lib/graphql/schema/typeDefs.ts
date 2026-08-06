export const typeDefs = `#graphql
  type Company {
    id: ID!
    name: String!
    taxNumber: String
    cnpsNumber: String
    rccm: String
    city: String
    country: String
    employees: [Employee!]!
  }

  type Employee {
    id: ID!
    name: String!
    email: String!
    role: String!
    employeeId: String
    departmentId: String
    salary: Float!
    sursalaire: Float!
    transportAllowance: Float!
    housingAllowance: Float!
    jobTitle: String
    category: String
    contractType: String
    joiningDate: String!
    isActive: Boolean!
    companyId: String!
    payrolls: [Payroll!]!
    attendances: [Attendance!]!
  }

  type Payroll {
    id: ID!
    userId: String!
    month: Int!
    year: Int!
    basicSalary: Float!
    sursalaire: Float!
    transportAllowance: Float!
    housingAllowance: Float!
    grossSalary: Float!
    itsTax: Float!
    igrTax: Float!
    cnpsEmployee: Float!
    cnpsEmployer: Float!
    fdfpTax: Float!
    totalDeductions: Float!
    netSalary: Float!
    status: String!
  }

  type Attendance {
    id: ID!
    userId: String!
    date: String!
    checkIn: String!
    checkOut: String
    status: String!
    hoursWorked: Float!
    overtimeMinutes: Int!
  }

  type Query {
    company(id: ID!): Company
    employees(search: String, limit: Int): [Employee!]!
    employee(id: ID!): Employee
    payrolls(month: Int, year: Int): [Payroll!]!
    attendances(date: String): [Attendance!]!
  }

  type Mutation {
    refreshMaterializedViews: Boolean!
  }
`;
