import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/workflow")({
  head: () => ({ meta: [
    { title: "Live Workflow — ExceptionOS" },
    { name: "description", content: "The ExceptionOS live workflow is now Agent Run." },
    { property: "og:title", content: "Live Workflow — ExceptionOS" },
    { property: "og:description", content: "Continue to the fictional Agent Run simulation." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
