"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled up to given distance
    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set the top cordinate to 0
    // make scrolling smooth
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        window.addEventListener("scroll", toggleVisibility);
        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }, []);

    return (
        <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ease-in-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
            <button
                type="button"
                onClick={scrollToTop}
                className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-300 group"
                aria-label="Back to top"
            >
                <ArrowUp className="h-6 w-6 group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
        </div>
    );
}
