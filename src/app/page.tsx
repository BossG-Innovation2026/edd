import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

// Only Module 3.1 exists so far, so the home page sends users straight to the report form.
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? "/report" : "/login");
}
