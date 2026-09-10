import { AppShell } from "@/components/app-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({children}:{children:React.ReactNode}){const admin=await requireAdmin();return <AppShell admin={{name:admin.name,email:admin.email,mustChangePassword:admin.mustChangePassword}}>{children}</AppShell>}
