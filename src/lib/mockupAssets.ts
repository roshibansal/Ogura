// Generated helper mapping mockup asset keys to static URLs
export const MOCKUP_IMAGES: Record<string, string> = {
  "bags-02": "/mockup-assets/bags-02.jpg",
  "bags-07": "/mockup-assets/bags-07.jpg",
  "bags-14": "/mockup-assets/bags-14.jpg",
  "bottoms-03": "/mockup-assets/bottoms-03.jpg",
  "coord-indian-04": "/mockup-assets/coord-indian-04.jpg",
  "coord-western-02": "/mockup-assets/coord-western-02.jpg",
  "dresses-western-04": "/mockup-assets/dresses-western-04.jpg",
  "dresses-western-11": "/mockup-assets/dresses-western-11.jpg",
  "dresses-western-19": "/mockup-assets/dresses-western-19.jpg",
  "dresses-western-25": "/mockup-assets/dresses-western-25.jpg",
  "indowesteern-03": "/mockup-assets/indowesteern-03.jpg",
  "jumpsuits-02": "/mockup-assets/jumpsuits-02.jpg",
  "lengha-03": "/mockup-assets/lengha-03.jpg",
  "lengha-07": "/mockup-assets/lengha-07.jpg",
  "lengha-12": "/mockup-assets/lengha-12.jpg",
  "lengha-21": "/mockup-assets/lengha-21.jpg",
  "lengha-30": "/mockup-assets/lengha-30.jpg",
  "saree-02": "/mockup-assets/saree-02.jpg",
  "saree-09": "/mockup-assets/saree-09.jpg",
  "saree-15": "/mockup-assets/saree-15.jpg",
  "shoes-05": "/mockup-assets/shoes-05.jpg",
  "shoes-14": "/mockup-assets/shoes-14.jpg",
  "tops-western-01": "/mockup-assets/tops-western-01.jpg",
  "tops-western-09": "/mockup-assets/tops-western-09.jpg"
};

export function getMockupImage(key: string, fallback?: string): string {
  return MOCKUP_IMAGES[key] || fallback || "/placeholder.svg";
}
