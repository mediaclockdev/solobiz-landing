"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";

interface SliderImage {
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

const CARD_DOC_ID = "mainCard";

export default function FirestoreSlider() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [swiperRef, setSwiperRef] = useState<any>(null);

  // Ensure client-side mount
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const docRef = doc(db, "cardPreviews", CARD_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setImages(data.sliderImages || []);
        } else {
          setImages([]);
        }
      } catch (err) {
        console.error("Error fetching slider images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  if (loading)
    return <p className="text-center py-10">Loading slider images...</p>;
  if (images.length === 0)
    return <p className="text-center py-10">No slider images uploaded yet.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-0">
      <div className="text-center mb-12">
        {/* <h2 className="text-3xl font-bold text-slate-900 mb-3">
          Our Business Card Gallery
        </h2>
        <p className="text-lg text-slate-600">
          Explore designs created by our community.
        </p> */}
      </div>

      {/* Slider */}
      <div className="relative">
        <Swiper
          onSwiper={setSwiperRef}
          modules={[Pagination, Autoplay]}
          spaceBetween={20} // adds 20px space (~20% of typical card width)
          slidesPerView={1}
          pagination={{ clickable: true, el: ".custom-pagination" }}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          loop
          breakpoints={{
            640: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
            1280: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="w-full"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div
                className="relative group cursor-pointer transform hover:scale-105 transition-transform duration-300 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center"
                style={{
                  // width: "100%",
                  height: "550px",
                  margin: "0 auto",
                }}
                onClick={() => setSelectedImage(img.url)}
              >
                <img
                  src={img.url}
                  alt={`Slider image ${idx + 1}`}
                  className="max-h-full max-w-full object-contain transition-all duration-300"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Pagination Dots Below Slider */}
        <div className="custom-pagination flex justify-center mt-6"></div>
      </div>

      {/* Lightbox using React Portal */}
      {mounted &&
        selectedImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="Selected"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-5 right-5 text-white text-3xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
