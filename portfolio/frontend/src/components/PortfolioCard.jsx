import { useState } from "react";
import { Link } from "react-router-dom";

export default function PortfolioCard({ templateName, title, description, mainImage, thumbnails, link }) {
  const [featured, setFeatured] = useState(mainImage);

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border bg-white shadow transition hover:shadow-lg">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {featured && (
          <img
            src={featured}
            alt={title}
            className="h-40 w-full object-cover transition-all"
          />
        )}

        {thumbnails && thumbnails.length > 1 && (
          <div className="mt-2 flex justify-center gap-2 px-2">
            {thumbnails.map((img, idx) => (
              <img
                key={img}
                src={img}
                alt={title + " thumb " + (idx + 1)}
                className={`h-12 w-16 cursor-pointer rounded object-cover ${featured === img ? "ring-2 ring-brand" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setFeatured(img);
                }}
              />
            ))}
          </div>
        )}

        <div className="p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="mt-2 text-sm text-brand">Click to preview →</p>
        </div>
      </a>

      <div className="mt-auto border-t bg-gray-50 p-4">
        <Link
          to={`/order?template=${encodeURIComponent(templateName)}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Reserve This Template
        </Link>
      </div>
    </article>
  );
}
