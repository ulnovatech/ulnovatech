import { useEffect, useState } from "react";
import PortfolioCard from "../components/PortfolioCard";
import FAQ from "../components/FAQ";
import { Toaster } from "react-hot-toast";

export default function Home() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use env variable for API URL
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${API_URL}/portfolios.php`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setTemplates(data.templates);
        } else {
          setError(data.error || "Failed to load templates");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [API_URL]);

  if (loading) {
    return (
      <div className="text-center mt-10">
        <p className="text-lg">Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Available Templates</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <PortfolioCard
            key={tpl.name}
            templateName={tpl.name}
            title={tpl.title}
            description={tpl.description}
            mainImage={tpl.mainImage}
            thumbnails={tpl.thumbnails}
            link={tpl.entry}
          />
        ))}
      </div>

      {/* WHY CHOOSE US Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              WHY CHOOSE US?
            </h2>
            <p className="text-xl text-gray-600">
              Why clients trust us for Website design & customization excellence
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            {[
              { color: "blue", text: "Premium design", iconPath: "M15 12a3 3 0 11-6 0 3 3 0 010 0z" },
              { color: "green", text: "Fast Turnaround Time", iconPath: "M13 10V3L4 14h7v7l9-11h-7z" },
              { color: "purple", text: "Perfectly responsive", iconPath: "M4 8V4h4l5 5" },
              { color: "indigo", text: "SEO-Optimized", iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { color: "red", text: "Exceptional support", iconPath: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
              { color: "teal", text: "Seamless animations", iconPath: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01" }
            ].map((feature, i) => (
              <div key={i} className="p-4">
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <svg className={`w-6 h-6 text-${feature.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.iconPath} />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900">{feature.text}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />
      <Toaster position="top-right" />
    </div>
  );
}
