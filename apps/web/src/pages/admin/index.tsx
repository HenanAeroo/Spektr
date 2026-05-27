import { fetchPromos } from "@/features/promos/actions/fetchPromos";
import { fetchUsers } from "@/features/promos/actions/fetchUsers";
import { Dashboard } from "@/features/admin/components/Dashboard";
import { ObjectivesAdmin } from "@/features/admin/components/ObjectivesAdmin";
import { PromoManager } from "@/features/admin/components/PromoManager";
import { StudentDetail } from "@/features/admin/components/StudentDetail";
import { StudentsList } from "@/features/admin/components/StudentsList";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";

const AdminPage = () => {
  const tanstackNavigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    p?: string;
    uid?: number | string;
  };
  const page = search.p ?? "dashboard";
  const uid = search.uid;

  const { data: promos = [] } = useQuery({
    queryKey: ["promos"],
    queryFn: fetchPromos,
  });
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const navigate = (target: string) => {
    if (target.startsWith("student-detail:")) {
      const userId = target.split(":")[1];
      tanstackNavigate({
        to: "/michel",
        search: { p: "student-detail", uid: Number(userId) },
      });
    } else {
      tanstackNavigate({ to: "/michel", search: { p: target } });
    }
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard navigate={navigate} users={users} promos={promos} />;
      case "students":
        return (
          <StudentsList users={users} promos={promos} navigate={navigate} />
        );
      case "student-detail":
        return uid ? (
          <StudentDetail
            userId={Number(uid)}
            promos={promos}
            navigate={navigate}
          />
        ) : (
          <StudentsList users={users} promos={promos} navigate={navigate} />
        );
      case "promos":
        return <PromoManager users={users} promos={promos} />;
      case "objectifs":
        return <ObjectivesAdmin promos={promos} />;
      default:
        return <Dashboard navigate={navigate} users={users} promos={promos} />;
    }
  };

  return (
    <div className="py-7 px-8 bg-spektr-bg min-h-full">{renderPage()}</div>
  );
};

export default AdminPage;
