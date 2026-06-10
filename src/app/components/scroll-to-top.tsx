import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigation } from "react-router";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function NavigationProgress() {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (visible) {
        setProgress(100);
        const t = window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
        return () => window.clearTimeout(t);
      }
      return;
    }

    setVisible(true);
    setProgress(15);
    const t1 = window.setTimeout(() => setProgress(45), 100);
    const t2 = window.setTimeout(() => setProgress(70), 300);
    const t3 = window.setTimeout(() => setProgress(85), 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [isLoading, visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
    >
      <div
        className="h-full bg-[#C9A24B] shadow-[0_0_8px_rgba(201,162,75,0.6)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}

export function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <NavigationProgress />
      <Outlet />
    </>
  );
}
