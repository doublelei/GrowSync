import { getRole } from "@/app/auth/actions";
import { HomeClient } from "@/components/home-client";

export default async function Home() {
  const role = await getRole();
  return <HomeClient isParent={role === "parent"} />;
}
