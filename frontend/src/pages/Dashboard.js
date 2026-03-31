import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Body */}
      <div className="flex-1 bg-gray-50 overflow-auto flex flex-col">
        <DashboardNavbar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
