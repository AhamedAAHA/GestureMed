import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({ sidebarItems, children }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        {sidebarItems?.length > 0 && <Sidebar items={sidebarItems} />}
        <main className="dashboard-main page-transition">{children}</main>
      </div>
    </div>
  );
}
