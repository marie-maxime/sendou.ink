import { lazy, Suspense } from "react";
import type { LinksFunction } from "@remix-run/node";
import styles from "~/styles/plans.css";
import type { SendouRouteHandle } from "~/utils/remix";

export const handle: SendouRouteHandle = {
  i18n: ["weapons"],
};

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

const Planner = lazy(() => import("~/components/Planner"));

export default function MapPlannerPage() {
  return (
    <Suspense fallback={<div className="plans__placeholder" />}>
      <Planner />
    </Suspense>
  );
}