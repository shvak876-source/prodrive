import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { SmoothScroll } from "./motion/SmoothScroll";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import Home from "./pages/Home";

const Catalog = lazy(() => import("./pages/Catalog"));
const About = lazy(() => import("./pages/About"));
const RenderCar = lazy(() => import("./pages/RenderCar"));

export default function App() {
  const { pathname } = useLocation();
  // internal page used only to render catalog thumbnails from the 3D model
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
      <Header />
      <main id="main">
        <Suspense fallback={<div className="page-loading" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </SmoothScroll>
  );
}
