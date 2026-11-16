/**
 * SAMPLE catalog for the brokerage: cars "on the market now" that the broker has located and checked.
 * Makes, models, numbers and prices are fictional placeholders, and every picture is a render of the
 * same 3D concept car in different paints – replace with real listings and photos before launch.
 */
export type Category = "משפחתי" | "SUV" | "חשמלי" | "יוקרה";
export type Paint = "carmine" | "pearl" | "graphite";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  category: Category;
  fuel: "בנזין" | "היברידי" | "חשמלי" | "דיזל";
  hand: number;
  km: number;
  /** what the seller asked */
  asked: number;
  /** what the broker expects to close at after negotiation (sample) */
  target: number;
  paint: Paint;
  angle: "a" | "b" | "c";
  colorName: string;
  /** one line from the inspection */
  note: string;
}

const C = (c: Car) => c;

export const CARS: Car[] = [
  C({ id: "velmora-s7", make: "Velmora", model: "S7 Hybrid", year: 2023, category: "משפחתי", fuel: "היברידי", hand: 1, km: 38000, asked: 168000, target: 156000, paint: "pearl", angle: "a", colorName: "לבן פנינה", note: "טיפולים מלאים ביבואן, ללא תאונות" }),
  C({ id: "aurex-c4", make: "Aurex", model: "C4 Comfort", year: 2022, category: "משפחתי", fuel: "בנזין", hand: 2, km: 61000, asked: 112000, target: 101500, paint: "graphite", angle: "b", colorName: "גרפיט", note: "צמיגים חדשים, מכון בדיקה עבר נקי" }),
  C({ id: "noviq-e1", make: "Noviq", model: "E1 Long Range", year: 2024, category: "חשמלי", fuel: "חשמלי", hand: 1, km: 14000, asked: 189000, target: 177000, paint: "pearl", angle: "c", colorName: "לבן פנינה", note: "בריאות סוללה 98%, אחריות יצרן" }),
  C({ id: "kestrel-x5", make: "Kestrel", model: "X5 Terra", year: 2023, category: "SUV", fuel: "היברידי", hand: 1, km: 29000, asked: 249000, target: 231500, paint: "graphite", angle: "a", colorName: "גרפיט", note: "7 מושבים, רכב פרטי מליסינג" }),
  C({ id: "strada-rs", make: "Strada", model: "RS Corsa", year: 2021, category: "יוקרה", fuel: "בנזין", hand: 2, km: 42000, asked: 389000, target: 362000, paint: "carmine", angle: "a", colorName: "אדום קרמין", note: "היסטוריה מלאה, נבדק במכון מורשה" }),
  C({ id: "noviq-e3", make: "Noviq", model: "E3 Cross", year: 2024, category: "חשמלי", fuel: "חשמלי", hand: 1, km: 9000, asked: 214000, target: 203000, paint: "graphite", angle: "c", colorName: "גרפיט", note: "משאבת חום, וו גרירה מקורי" }),
  C({ id: "kestrel-a2", make: "Kestrel", model: "A2 Urban", year: 2022, category: "SUV", fuel: "היברידי", hand: 1, km: 47000, asked: 139000, target: 128000, paint: "carmine", angle: "c", colorName: "אדום קרמין", note: "חניה אוטומטית, בלמים הוחלפו" }),
  C({ id: "velmora-x9", make: "Velmora", model: "X9 Grand", year: 2022, category: "יוקרה", fuel: "דיזל", hand: 1, km: 55000, asked: 329000, target: 306000, paint: "graphite", angle: "c", colorName: "גרפיט", note: "מתלי אוויר, טיפולים ביבואן" }),
  C({ id: "aurex-gt", make: "Aurex", model: "GT Line", year: 2023, category: "יוקרה", fuel: "בנזין", hand: 1, km: 18000, asked: 459000, target: 431000, paint: "carmine", angle: "b", colorName: "אדום קרמין", note: "בלמי קרמיקה, אחריות מורחבת" }),
  C({ id: "noviq-e5", make: "Noviq", model: "E5 Executive", year: 2024, category: "חשמלי", fuel: "חשמלי", hand: 1, km: 21000, asked: 299000, target: 283000, paint: "graphite", angle: "a", colorName: "גרפיט", note: "טווח 640 ק״מ, בריאות סוללה 97%" }),
  C({ id: "velmora-s3", make: "Velmora", model: "S3 Family", year: 2021, category: "משפחתי", fuel: "היברידי", hand: 2, km: 74000, asked: 98000, target: 89500, paint: "pearl", angle: "a", colorName: "לבן", note: "רכב שמור, ספר טיפולים מלא" }),
  C({ id: "kestrel-t7", make: "Kestrel", model: "T7 Adventure", year: 2023, category: "SUV", fuel: "דיזל", hand: 1, km: 33000, asked: 276000, target: 259000, paint: "pearl", angle: "b", colorName: "לבן פנינה", note: "הנעה כפולה, צמיגי שטח" }),
];

export const CATEGORIES: Category[] = ["משפחתי", "SUV", "חשמלי", "יוקרה"];

export const carImage = (c: Car) => `${import.meta.env.BASE_URL}img/c-${c.paint}-${c.angle}.webp`;
export const formatPrice = (n: number) => `₪${n.toLocaleString("en-US")}`;
export const formatKm = (n: number) => `${n.toLocaleString("en-US")} ק״מ`;
