import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Body */}
      <div className="flex-1 bg-gray-50  overflow-auto">
        <Outlet />
      </div>

    </div>
  );
};

export default Dashboard;