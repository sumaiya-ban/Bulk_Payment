import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import Dashboard from "./pages/Dashboard";

import Customers from "./pages/Customers";
import CreateCustomer from "./pages/CreateCustomer";
import EditCustomer from "./components/dashboard/EditCustomer";
import DashboardOverview from "./components/dashboard/DashboardOverview";
import Recipients from "./pages/Recipients";
import CreateRecipents from "./pages/CreateRecipents";
import EditRecipient from "./components/dashboard/EditRecipient";
import Transaction from "./pages/Transaction";
import KYCVerificationPage from "./components/dashboard/KYCVerificationPage";
import Profile from "./pages/Profile";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Setting from "./components/dashboard/Setting";
import Landing from "./components/dashboard/Landing";
import MessageRequest from "./components/dashboard/MessageRequest";
import SupportChatPage from "./components/dashboard/SupportChatPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Dashboard Layout */}
        <Route path="/dashboard" element={<Dashboard />}>
  
          {/* Child Pages */}
          <Route index element={<DashboardOverview />} />
           <Route path="profile" element={<Profile />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/create" element={<CreateCustomer />} />
          <Route path="customers/edit/:id" element={<EditCustomer />} />
<Route path="recipients" element={<Recipients />} />
<Route path="recipients/create" element={<CreateRecipents />} />
 <Route path="recipients/edit/:id" element={<EditRecipient />} />
 <Route path="transactions" element={<Transaction />}  />
 <Route path="verification" element={<KYCVerificationPage />}  />
 <Route path="setting" element={<Setting />}  />
 <Route path="landing" element={<Landing />}  />
 <Route path="message-request" element={<MessageRequest />}  />
 <Route path="support-chat" element={<SupportChatPage />}  />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
