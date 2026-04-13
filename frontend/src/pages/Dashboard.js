import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Body */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <DashboardNavbar />

        {/* ONLY ONE SCROLL AREA */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </div>

      </div>

    </div>
  );
};

export default Dashboard;