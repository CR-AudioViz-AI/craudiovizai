"use client";

import { useEffect, useState } from "react";
import { JavariWidget } from "@/components/javari/widget";

export default function JavariEmbedPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Notify parent of size changes
    const notifyParent = (isOpen: boolean) => {
      window.parent.postMessage({
        type: "javari-resize",
        data: {
          width: isOpen ? "384px" : "60px",
          height: isOpen ? "500px" : "60px",
          isOpen
        }
      }, "*");
    };

    // Listen for widget state changes
    const observer = new MutationObserver(() => {
      const widget = document.querySelector("[data-javari-open]");
      notifyParent(widget?.getAttribute("data-javari-open") === "true");
    });

    observer.observe(document.body, { attributes: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0">
      <JavariWidget sourceApp="embed" />
    </div>
  );
}
