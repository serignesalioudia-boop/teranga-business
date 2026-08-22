import { getUsers } from "@/server/actions/users";
import { UserTable } from "./_components/user-table";


export const metadata = { title: "Gestion des utilisateurs — Admin" };

type Props = { searchParams: Promise<{ search?: string; role?: string; page?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await getUsers({
    search: params.search,
    role: params.role,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Utilisateurs{" "}
        <span className="text-sm font-normal text-muted-foreground">({result.total})</span>
      </h1>
      <UserTable
        data={result}
        currentSearch={params.search}
        currentRole={params.role}
      />
    </div>
  );
}
