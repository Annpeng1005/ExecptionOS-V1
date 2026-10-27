import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/workflow")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
