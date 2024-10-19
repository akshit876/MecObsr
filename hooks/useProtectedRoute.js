import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export function useProtectedRoute() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading

    if (!session) {
      toast.error("You must be signed in to view this page");
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  return { session, status };
}
