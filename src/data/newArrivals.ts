/**
 * The 20 pieces added from the studio drop on 9 Sept 2026.
 *
 * Every title, colour and fabric below was written from the photograph itself,
 * not from the filename — the Drive filenames do not describe their contents
 * (the file called "striped-wide-sleeve-set" is a pink pleated peplum set, the
 * one called "red-ajrakh-patchwork-kaftan" is an olive velvet vest, and so on).
 *
 * Two files share a stem with a "__2" suffix but are different garments, so
 * they are listed as separate products. Pairing them would have reproduced the
 * hover bug where one photo swaps to an unrelated piece.
 *
 * These live in code rather than in Supabase so the catalogue can carry them
 * without a production database write. `useCatalogProducts` merges them in.
 * When they move into Supabase, delete this file and that merge.
 *
 * Prices are not set here: normalizeCatalogPrice() derives every price
 * deterministically from the id, keeping the catalogue in the 1,200-12,000 band.
 */

export interface SeedProduct {
  id: string;
  title: string;
  brand: string;
  city: string;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  fabric: string;
  description: string;
  occasion_tags: string[];
  style_tags: string[];
}

const T = "/catalogue/tops";
const C = "/catalogue/indian-coords";

export const NEW_ARRIVALS: SeedProduct[] = [
  // ---------------------------------------------------------------- Tops
  {
    id: "drop-tops-01", title: "Kilim Appliqué Felt Waistcoat", brand: "Kanthaa Studio", city: "Delhi",
    category: "Tops", images: [`${T}/felt-vest-kilim-applique.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Ivory", "Rust", "Teal"],
    fabric: "Wool felt with woven kilim appliqué",
    description: "Undyed wool felt with two kilim panels appliquéd across the front and finished with beaded tassels. Cut to your measurements.",
    occasion_tags: ["Festive", "Day"], style_tags: ["Appliqué", "Handcraft"],
  },
  {
    id: "drop-tops-02", title: "Floral Jacquard Wrap Waistcoat", brand: "Sootra Atelier", city: "Delhi",
    category: "Tops",
    // A genuine pair: the same waistcoat on the hanger and laid flat.
    images: [`${T}/silk-floral-wrap-vest.jpg`, `${T}/olive-short-vest-floral-lining.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Mustard", "Rust"],
    fabric: "Silk jacquard",
    description: "Mustard floral jacquard on one front, tonal rust on the other, closing with a side tie. Notch collar, no buttons.",
    occasion_tags: ["Festive", "Day"], style_tags: ["Jacquard", "Wrap"],
  },
  {
    id: "drop-tops-03", title: "Olive Velvet Patchwork Waistcoat", brand: "Kaarigari House", city: "Kolkata",
    category: "Tops", images: [`${T}/red-ajrakh-patchwork-kaftan.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Olive", "Plum", "Gold"],
    fabric: "Cotton velvet with zardozi patchwork",
    description: "Olive velvet with a diagonal run of embroidered diamonds in plum, gold and green. Ties at the shoulder and waist rather than buttoning.",
    occasion_tags: ["Festive", "Evening"], style_tags: ["Patchwork", "Zardozi"],
  },
  {
    id: "drop-tops-04", title: "Ajrakh Patchwork Kaftan Top", brand: "Kanthaa Studio", city: "Delhi",
    category: "Tops", images: [`${T}/green-magenta-panel-dress__2.jpg`],
    sizes: ["Free Size"], colors: ["Madder Red", "Indigo", "Black"],
    fabric: "Naturally dyed ajrakh cotton",
    description: "Twelve different ajrakh prints pieced into one wide-sleeved kaftan, with a patch pocket cut from a thirteenth. Free size, gathered at the yoke.",
    occasion_tags: ["Day", "Resort"], style_tags: ["Ajrakh", "Natural Dye", "Patchwork"],
  },
  {
    id: "drop-tops-05", title: "Indigo Block Print Cropped Jacket", brand: "Baagh Studio", city: "Jaipur",
    category: "Tops", images: [`${T}/cream-jacket-blockprint-cuffs.jpg`],
    sizes: ["S", "M", "L", "XL"], colors: ["Ivory", "Indigo"],
    fabric: "Handloom cotton with hand block print",
    description: "Open-front cropped jacket in ivory cotton, with indigo block printing running across the hem and turned-back cuffs.",
    occasion_tags: ["Day", "Work"], style_tags: ["Block Print", "Indigo"],
  },
  {
    id: "drop-tops-06", title: "Charm-Fringed Raw Silk Top", brand: "Meher & Noor", city: "Delhi",
    category: "Tops", images: [`${T}/sage-mirrorwork-vest.jpg`],
    sizes: ["XS", "S", "M", "L"], colors: ["Cream"],
    fabric: "Raw silk",
    description: "A cropped raw silk shell with metal charms hung on cords along the hem, so the fringe moves and catches the light.",
    occasion_tags: ["Evening", "Cocktail"], style_tags: ["Fringe", "Contemporary"],
  },
  {
    id: "drop-tops-07", title: "Linen Kimono Jacket with Tapestry Cuffs", brand: "Ranghar Studio", city: "Mumbai",
    category: "Tops", images: [`${T}/olive-velvet-patchwork-vest.jpg`],
    sizes: ["Free Size"], colors: ["Oatmeal", "Green", "Pink"],
    fabric: "Slub linen with woven tapestry panels",
    description: "Oatmeal slub linen cut as a wide kimono, with floral tapestry set into the deep cuffs and hem.",
    occasion_tags: ["Day"], style_tags: ["Kimono", "Linen"],
  },
  {
    id: "drop-tops-08", title: "Sage Mirrorwork Tie-Front Waistcoat", brand: "Baagh Studio", city: "Jaipur",
    category: "Tops", images: [`${T}/cream-fringe-tassel-dress.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Sage"],
    fabric: "Cotton with hand shisha mirrorwork",
    description: "Sage cotton worked all over with shisha mirrors and chain stitch, closing at the front with a tasselled tie.",
    occasion_tags: ["Festive", "Day"], style_tags: ["Mirrorwork", "Jaipur"],
  },
  {
    id: "drop-tops-09", title: "Olive Cropped Vest with Floral Lining", brand: "Kanthaa Studio", city: "Delhi",
    category: "Tops", images: [`${T}/green-magenta-panel-dress.jpg`],
    sizes: ["XS", "S", "M", "L"], colors: ["Olive"],
    fabric: "Cotton twill, printed cotton lining",
    description: "A short curved-hem vest in olive twill, lined in a rose print you only see when it opens.",
    occasion_tags: ["Day"], style_tags: ["Layering", "Everyday"],
  },

  // -------------------------------------------------------- Indian Co-ords
  {
    id: "drop-coord-01", title: "Ochre Embroidered Top & Dhoti Pants", brand: "Anant Threadworks", city: "Mumbai",
    category: "Kurta Set", images: [`${C}/brown-embroidered-kurta-dhoti.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Ochre", "Beige"],
    fabric: "Cotton silk with thread and mirror embroidery",
    description: "Ochre top with ivory leaf embroidery and tasselled ties, worn with pleated dhoti pants in soft beige.",
    occasion_tags: ["Festive", "Day"], style_tags: ["Embroidery", "Dhoti"],
  },
  {
    id: "drop-coord-02", title: "Olive & Magenta Panelled Kurta", brand: "Kaarigari House", city: "Kolkata",
    category: "Kurta Set", images: [`${C}/brown-patchwork-silk-vest.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Olive", "Magenta"],
    fabric: "Silk",
    description: "Full-length olive silk with magenta gota running down the panel seams and a deep magenta hem. Cut to your height.",
    occasion_tags: ["Festive", "Wedding"], style_tags: ["Panelled", "Silk"],
  },
  {
    id: "drop-coord-03", title: "Blush Halter Sharara Set", brand: "Aranya Studio", city: "Mumbai",
    category: "Kurta Set", images: [`${C}/festive-kurti.jpg`],
    sizes: ["XS", "S", "M", "L"], colors: ["Blush Pink"],
    fabric: "Georgette with thread embroidery",
    description: "Halter-neck kurta with floral embroidery down the front, a gathered sharara and a matching dupatta.",
    occasion_tags: ["Wedding", "Festive"], style_tags: ["Sharara", "Embroidery"],
  },
  {
    id: "drop-coord-04", title: "Gold Embellished Cami & Palazzo", brand: "Meher & Noor", city: "Delhi",
    category: "Kurta Set", images: [`${C}/gold-embellished-cami-palazzo.jpg`],
    sizes: ["XS", "S", "M", "L"], colors: ["Gold", "Olive"],
    fabric: "Embellished net over silk",
    description: "An asymmetric embellished cami over wide palazzos in matching gold work. Straps set to your measurement.",
    occasion_tags: ["Wedding", "Cocktail"], style_tags: ["Embellished", "Evening"],
  },
  {
    id: "drop-coord-05", title: "Ivory Handloom Kurta Set", brand: "Sootra Atelier", city: "Delhi",
    category: "Kurta Set", images: [`${C}/ivory-tissue-set.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Ivory", "Red", "Green"],
    fabric: "Handloom cotton",
    description: "Ivory handloom with woven red, green and navy borders at the cuff, placket and hem, worn with matching straight pants.",
    occasion_tags: ["Day", "Festive"], style_tags: ["Handloom", "Minimal"],
  },
  {
    id: "drop-coord-06", title: "Pink Kurta with Floral Palazzo", brand: "Baagh Studio", city: "Jaipur",
    category: "Kurta Set", images: [`${C}/pink-floral-kurta-set.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Pale Pink"],
    fabric: "Chanderi, printed cotton palazzo",
    description: "Pale pink chanderi kurta with scalloped edges and small mirror detail, over a soft floral print palazzo.",
    occasion_tags: ["Day", "Festive"], style_tags: ["Chanderi", "Floral"],
  },
  {
    id: "drop-coord-07", title: "Paisley Print Kurta & Sage Palazzo", brand: "Ranghar Studio", city: "Mumbai",
    category: "Kurta Set", images: [`${C}/pink-peplum-top-printed-pants.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Multicolour", "Sage"],
    fabric: "Lawn cotton",
    description: "A multicolour paisley kurta finished with pompom trim at the sleeve, worn with sage palazzos embroidered at the hem.",
    occasion_tags: ["Day", "Festive"], style_tags: ["Paisley", "Print"],
  },
  {
    id: "drop-coord-08", title: "Fuchsia & Orange Slip Kurta Set", brand: "Aranya Studio", city: "Mumbai",
    category: "Kurta Set", images: [`${C}/pink-sharara-set-dupatta.jpg`],
    sizes: ["XS", "S", "M", "L"], colors: ["Fuchsia", "Orange"],
    fabric: "Georgette",
    description: "A fuchsia slip kurta edged in orange, with matching flared pants and a narrow tie dupatta.",
    occasion_tags: ["Festive", "Cocktail"], style_tags: ["Colourblock", "Contemporary"],
  },
  {
    id: "drop-coord-09", title: "Beige Floral Print Kurta Set", brand: "Kaarigari House", city: "Kolkata",
    category: "Kurta Set", images: [`${C}/rust-drape-set.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Beige", "Indigo"],
    fabric: "Cotton",
    description: "Beige cotton printed with indigo florals, fringed at the hem and cuff, worn with wide pleated pants.",
    occasion_tags: ["Day", "Work"], style_tags: ["Print", "Everyday"],
  },
  {
    id: "drop-coord-10", title: "Pink Pleated Peplum Set", brand: "Kanthaa Studio", city: "Delhi",
    category: "Kurta Set", images: [`${C}/striped-wide-sleeve-set.jpg`],
    sizes: ["XS", "S", "M", "L"], colors: ["Rose Pink"],
    fabric: "Pleated cotton, printed rayon",
    description: "A pleated peplum top with a scalloped lace hem, worn over wide-leg pants in a bandhani-style paisley print.",
    occasion_tags: ["Day", "Festive"], style_tags: ["Pleated", "Peplum"],
  },
  {
    id: "drop-coord-11", title: "Mauve Printed Flared Kurta Set", brand: "Kaarigari House", city: "Kolkata",
    category: "Kurta Set", images: [`${C}/striped-wide-sleeve-set__2.jpg`],
    sizes: ["XS", "S", "M", "L", "XL"], colors: ["Mauve", "Purple"],
    fabric: "Printed chiffon",
    description: "An all-over mauve print with gold piping, cut with wide flared sleeves and tasselled ties, over a matching salwar and dupatta.",
    occasion_tags: ["Festive", "Wedding"], style_tags: ["Print", "Flared"],
  },
];

/** The two categories this drop belongs to, in the order they should surface. */
export const FEATURED_CATEGORIES = ["Tops", "Indian Co-ords"] as const;
