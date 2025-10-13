import { useEffect } from "react";

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit?: () => void;
  }
}

export default function GoogleTranslate() {
  useEffect(() => {
    // Check if script already exists
    if (!document.getElementById("google-translate-script")) {
      // Create script
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    // Callback when script loads
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr,ta,bn",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };
  }, []);

  return (
    <div
      id="google_translate_element"
      style={{ position: "fixed", top: 10, right: 10, zIndex: 9999 }}
    ></div>
  );
}
