import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SeoHead } from "./components/seo-head";
import { ErrorBoundary } from "./components/error-boundary";

export default function App() {
  return (
    <ErrorBoundary>
      <SeoHead />
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
