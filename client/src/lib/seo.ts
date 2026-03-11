import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  noIndex?: boolean;
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSEO({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  noIndex = false,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title.includes("WedSaas") ? title : `${title} | WedSaas`;
    document.title = fullTitle;

    if (description) {
      setMeta("description", description);
      setMeta("og:description", ogDescription ?? description, true);
      setMeta("twitter:description", ogDescription ?? description);
    }

    setMeta("og:title", ogTitle ?? fullTitle, true);
    setMeta("twitter:title", ogTitle ?? fullTitle);

    if (ogImage) {
      setMeta("og:image", ogImage, true);
      setMeta("twitter:image", ogImage);
    }

    if (ogUrl) {
      setMeta("og:url", ogUrl, true);
    }

    if (noIndex) {
      setMeta("robots", "noindex, nofollow");
    } else {
      setMeta("robots", "index, follow");
    }

    return () => {
      document.title = "WedSaas — Undangan Pernikahan Digital yang Elegan & Modern";
    };
  }, [title, description, ogTitle, ogDescription, ogImage, ogUrl, noIndex]);
}
