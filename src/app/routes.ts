import { createBrowserRouter, redirect } from "react-router";
import { RootLayout } from "./components/scroll-to-top";
import { RouterErrorBoundary } from "./components/error-boundary";
import { HydrateFallback } from "./components/hydrate-fallback";
import Landing from "./pages/landing";

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouterErrorBoundary,
    HydrateFallback,
    children: [
      {
        path: "/",
        Component: Landing,
      },
      {
        path: "/masuk",
        lazy: async () => {
          const { default: Component } = await import("./pages/masuk");
          return { Component };
        },
      },
      {
        path: "/daftar",
        lazy: async () => {
          const { default: Component } = await import("./pages/daftar");
          return { Component };
        },
      },
      {
        path: "/lupa-password",
        lazy: async () => {
          const { default: Component } = await import("./pages/lupa-password");
          return { Component };
        },
      },
      {
        path: "/reset-password",
        lazy: async () => {
          const { default: Component } = await import("./pages/reset-password");
          return { Component };
        },
      },
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
      {
        path: "*",
        lazy: async () => {
          const { default: Component } = await import("./pages/not-found");
          return { Component };
        },
      },
    ],
  },
]);
