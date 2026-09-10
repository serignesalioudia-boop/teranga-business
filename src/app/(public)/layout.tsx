import { Header, Footer } from "@/components/layout/header-footer";
import { ConditionalHeader } from "@/components/layout/conditional-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <ConditionalHeader>
        <Header />
      </ConditionalHeader>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
