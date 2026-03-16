import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <Breadcrumb />
        <main className="flex-1 overflow-auto bg-[#F4F5F7] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
