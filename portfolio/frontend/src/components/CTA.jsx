import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { siteConfig } from "../site.config";

export default function CTA() {
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    const name =
      document.body.getAttribute("data-template") || document.title.trim();
    setTemplateName(name);
  }, []);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center bg-white px-6 py-3 rounded-full shadow-md w-[400px] max-sm:w-[80%]">
      <a
        href={siteConfig.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="w-6 h-6 mx-2 bg-cover bg-center"
        style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg')" }}
        title="WhatsApp"
      ></a>

      <Link
        id="order-btn"
        to={`/order?template=${encodeURIComponent(templateName)}`}
        className="bg-brand text-white font-bold px-4 py-2 rounded-full text-base mx-2 max-sm:text-sm"
        title="Order This Website"
      >
        Reserve Template
      </Link>

      <a
        href={siteConfig.scheduleCall}
        className="w-6 h-6 mx-2 bg-cover bg-center"
        style={{ backgroundImage: "url('https://img.icons8.com/ios-filled/50/007bff/phone.png')" }}
        title="Call"
      ></a>
    </div>
  );
}
