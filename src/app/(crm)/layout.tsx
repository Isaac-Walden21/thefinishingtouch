import Sidebar from "@/components/Sidebar";

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <main className="min-h-screen lg:ml-64">{children}</main>
    </>
  );
}
