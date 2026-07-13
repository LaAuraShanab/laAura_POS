import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { LoginPage } from "../pages/LoginPage";
import { PosPage } from "../pages/pos/PosPage";
import { ProductsListPage } from "../pages/products/ProductsListPage";
import { DashboardPage } from "../pages/home/DashboardPage";
import { ReportingPage } from "../pages/reporting/ReportingPage";
import { TransactionsListPage } from "../pages/transactions/TransactionsListPage";
import { UsersListPage } from "../pages/users/UsersListPage";
import { CustomersListPage } from "../pages/customers/CustomersListPage";
import { AuditLogPage } from "../pages/audit/AuditLogPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";
import { DefaultRedirect } from "./DefaultRedirect";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DefaultRedirect /> },
          {
            element: <RequireRole roles={["ADMIN", "MANAGER", "CASHIER"]} />,
            children: [
              { path: "pos", element: <PosPage /> },
              { path: "customers", element: <CustomersListPage /> },
            ],
          },
          {
            element: <RequireRole roles={["ADMIN", "MANAGER", "REPORTER"]} />,
            children: [
              { path: "home", element: <DashboardPage /> },
              { path: "reporting", element: <ReportingPage /> },
            ],
          },
          {
            element: <RequireRole roles={["ADMIN", "MANAGER", "REPORTER", "CASHIER"]} />,
            children: [{ path: "transactions", element: <TransactionsListPage /> }],
          },
          {
            element: <RequireRole roles={["ADMIN", "MANAGER"]} />,
            children: [{ path: "products", element: <ProductsListPage /> }],
          },
          {
            element: <RequireRole roles={["ADMIN"]} />,
            children: [
              { path: "users", element: <UsersListPage /> },
              { path: "audit-log", element: <AuditLogPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
