import { useEffect } from "react";

export function SeoHead() {
  useEffect(() => {
    document.title = "Agrolytics";
  }, []);

  return null;
}
