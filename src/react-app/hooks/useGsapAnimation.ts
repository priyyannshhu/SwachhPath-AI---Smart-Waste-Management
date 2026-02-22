import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function useFadeInUp(delay: number = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          ease: "power3.out",
        }
      );
    }
  }, [delay]);

  return ref;
}

export function useStaggerFadeIn(containerSelector: string, itemSelector: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const items = ref.current.querySelectorAll(itemSelector);
      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }
  }, [containerSelector, itemSelector]);

  return ref;
}

export function useSlideIn(direction: "left" | "right" = "left") {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const x = direction === "left" ? -50 : 50;
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          x,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: "power3.out",
        }
      );
    }
  }, [direction]);

  return ref;
}

export function useScaleIn(delay: number = 0) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        {
          opacity: 0,
          scale: 0.9,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          delay,
          ease: "back.out(1.7)",
        }
      );
    }
  }, [delay]);

  return ref;
}

export function animateProgress(element: HTMLElement, targetWidth: number) {
  gsap.fromTo(
    element,
    { width: "0%" },
    {
      width: `${targetWidth}%`,
      duration: 1,
      ease: "power2.out",
    }
  );
}
