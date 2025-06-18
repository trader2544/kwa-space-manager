# KWA KAMANDE rental management system
KWA KAMANDE rental management system designed for landlords, property managers, and tenants. It provides a modern web interface to manage rental units, tenants, rent payments, and maintenance requests.

---

## Key Features

- **Rental Unit Management**
  - Organize rental units (houses/rooms), set amenities, pricing, and availability.
  - Track vacant and occupied units.

- **Tenant Management**
  - Add and update tenant profiles.
  - Assign tenants to rental units.
  - View tenant assignments and rental history.

- **Rent Payment Tracking**
  - Record rent payments, including amount, payment method, reference, and payment status.
  - View monthly rent statistics: expected, paid, remaining, and tenant breakdown.
  - Support for multiple payment methods (e.g., Mpesa).

- **Maintenance Management**
  - Tenants can submit maintenance requests specifying type, priority, and description.
  - Administrators can view, update, and resolve maintenance requests.

- **Role-based Dashboards**
  - Separate dashboards for administrators and tenants.
  - Administrators: manage units, tenants, payments, and maintenance.
  - Tenants: view assignments, submit requests, and track rent status.

---

## Technology Stack

- **Frontend**: React (TypeScript)
- **Backend/Database**: Supabase (PostgreSQL, API)
- **UI Components**: Custom UI with state management hooks
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites

- Node.js v14 or above
- npm or yarn

### Installation

```bash
git clone https://github.com/trader2544/kwa-space-manager.git
cd kwa-space-manager
npm install
# or
yarn install
```

### Configuration

- Copy `.env.example` to `.env` and configure your Supabase credentials and other environment variables.

---

## Usage

**Development:**
```bash
npm start
# or
yarn start
```

**Production:**
```bash
npm run build
# or
yarn build
```

**Testing:**
```bash
npm test
# or
yarn test
```

---

## Main Modules

- `src/components/admin/TenantsManagement.tsx` - Manage tenants and assignments.
- `src/components/admin/RentManagement.tsx` - Manage and track rent payments.
- `src/components/admin/MaintenanceManagement.tsx` - Oversee maintenance requests.
- `src/components/tenant/TenantDashboard.tsx` - Tenant home dashboard.
- `src/components/tenant/RentPayments.tsx` - Tenant payment history and status.
- `src/components/tenant/MaintenanceRequests.tsx` - Submit and view tenant maintenance requests.

---

## License

MIT

---

## Contact

For questions, support, or feedback, please [open an issue](https://github.com/trader2544/kwa-space-manager/issues).
