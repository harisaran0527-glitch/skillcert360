export default function StudentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-[#f5f8fc]">{children}</div>;
}