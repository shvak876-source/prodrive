import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { SmoothScroll } from "./motion/SmoothScroll";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import Landing from "./pages/Landing";

const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const RenderCar = lazy(() => import("./pages/RenderCar"));
const ShootCar = lazy(() => import("./pages/ShootCar"));

export default function App() {
  const { pathname } = useLocation();
  // internal page used only to render the site's still images from the 3D model
  if (pathname === "/__shoot") {
    return (
      <Suspense fallback={null}>
        <ShootCar />
      </Suspense>
    );
  }
  if (pathname === "/__render") {
    return (
      <Suspense fallback={null}>
        <RenderCar />
      </Suspense>
    );
  }
  return (
    <SmoothScroll>
      <a className="skip" href="#main">דלג לתוכן</a>
      <SiteHeader />
      <main id="main">
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter />
    </SmoothScroll>
  );
}
