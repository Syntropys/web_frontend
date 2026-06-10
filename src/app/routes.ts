import { createBrowserRouter, redirect } from "react-router";
import { RootLayout } from "./components/scroll-to-top";
import { RouterErrorBoundary } from "./components/error-boundary";
import Landing from "./pages/landing";
import Masuk from "./pages/masuk";
import Daftar from "./pages/daftar";
import LupaPassword from "./pages/lupa-password";
import ResetPassword from "./pages/reset-password";
import NotFound from "./pages/not-found";

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouterErrorBoundary,
    children: [
      { path: "/", Component: Landing },
      { path: "/masuk", Component: Masuk },
      { path: "/daftar", Component: Daftar },
      { path: "/lupa-password", Component: LupaPassword },
      { path: "/reset-password", Component: ResetPassword },
      { path: "/dashboard", loader: () => redirect("/dashboard/ringkasan") },
      {
        path: "/dashboard/ringkasan",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/ringkasan");
          return { Component };
        },
      },
      {
        path: "/dashboard/iklim",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/iklim");
          return { Component };
        },
      },
      {
        path: "/dashboard/prediksi",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/prediksi");
          return { Component };
        },
      },
      {
        path: "/dashboard/risiko",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/risiko");
          return { Component };
        },
      },
      {
        path: "/dashboard/peta",
        lazy: async () => {
          const { default: Component } = await import("./pages/dashboard/peta");
          return { Component };
        },
      },
      {
        path: "/dashboard/tren",
        lazy: async () => {
          const { default: Component } = await import("./pages/dashboard/tren");
          return { Component };
        },
      },
      {
        path: "/dashboard/prioritas",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/prioritas");
          return { Component };
        },
      },
      {
        path: "/dashboard/penyakit",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/penyakit");
          return { Component };
        },
      },
      {
        path: "/dashboard/admin/pengguna",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/admin/pengguna");
          return { Component };
        },
      },
      {
        path: "/dashboard/admin/ingesti",
        lazy: async () => {
          const { default: Component } =
            await import("./pages/dashboard/admin/ingesti");
          return { Component };
        },
      },
      { path: "*", Component: NotFound },
    ],
  },
]);
