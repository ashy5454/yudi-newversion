// src/app/page.tsx

import { redirect } from "next/navigation";

export default function HomePage() {
  // Instantly send the user to /login
  redirect("/login");
}
