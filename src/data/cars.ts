import type { BodyType } from "../three/CarModel";

/**
 * Sample catalog. Every model and make below is fictional placeholder data –
 * replace with the dealership's real inventory (or load it from an API/CMS later).
 */
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  category: "סדאן" | "SUV" | "קופה" | "חשמלי";
  body: BodyType;
  fuel: "בנזין" | "היברידי" | "חשמלי" | "דיזל";
  condition: "חדש" | "0 ק״מ" | "משומש";
  km: number;
  hp: number;
  /** 0–100 km/h in seconds */
  accel: number;
  gearbox: string;
  price: number;
  color: string;
  colorName: string;
  /** thumbnail rendered from the 3D model: /cars/<id>.png */
  image: string;
  highlights: string[];
}

const car = (c: Omit<Car, "image">): Car => ({ ...c, image: `/cars/${c.id}.png` });

export const CARS: Car[] = [
  car({ id: "aurex-gt", make: "Aurex", model: "GT Line", year: 2026, category: "קופה", body: "coupe", fuel: "בנזין", condition: "חדש", km: 0, hp: 420, accel: 3.9, gearbox: "אוטומטי 8", price: 489000, color: "#8f1d1d", colorName: "אדום רובי", highlights: ["מושבי ספורט מאווררים", "מערכת שמע 14 רמקולים", "בלמי קרמיקה"] }),
  car({ id: "velmora-s7", make: "Velmora", model: "S7", year: 2026, category: "סדאן", body: "sedan", fuel: "היברידי", condition: "חדש", km: 0, hp: 310, accel: 5.6, gearbox: "אוטומטי 8", price: 329000, color: "#1d2a3a", colorName: "כחול לילה", highlights: ["תצוגה עילית", "שיוט אדפטיבי", "גג פנורמי"] }),
  car({ id: "kestrel-x5", make: "Kestrel", model: "X5 Terra", year: 2025, category: "SUV", body: "suv", fuel: "היברידי", condition: "0 ק״מ", km: 12, hp: 340, accel: 6.1, gearbox: "אוטומטי 9", price: 389000, color: "#2f3a2f", colorName: "ירוק זית", highlights: ["7 מושבים", "הנעה כפולה", "וו גרירה חשמלי"] }),
  car({ id: "noviq-e1", make: "Noviq", model: "E1 Long Range", year: 2026, category: "חשמלי", body: "sedan", fuel: "חשמלי", condition: "חדש", km: 0, hp: 480, accel: 4.2, gearbox: "חשמלי", price: 279000, color: "#e8e6e1", colorName: "לבן פנינה", highlights: ["טווח 610 ק״מ", "טעינה מהירה 250kW", "עדכוני תוכנה אלחוטיים"] }),
  car({ id: "strada-rs", make: "Strada", model: "RS Corsa", year: 2024, category: "קופה", body: "coupe", fuel: "בנזין", condition: "משומש", km: 18500, hp: 510, accel: 3.5, gearbox: "רובוטי 7", price: 545000, color: "#c8a24a", colorName: "זהב שמפניה", highlights: ["יד ראשונה", "טיפולים במוסך מורשה", "חבילת קרבון"] }),
  car({ id: "velmora-x9", make: "Velmora", model: "X9 Grand", year: 2026, category: "SUV", body: "suv", fuel: "דיזל", condition: "חדש", km: 0, hp: 300, accel: 6.8, gearbox: "אוטומטי 8", price: 459000, color: "#111214", colorName: "שחור אובסידיאן", highlights: ["מתלי אוויר", "מושבי עיסוי", "מערכת ראיית לילה"] }),
  car({ id: "noviq-e3", make: "Noviq", model: "E3 Cross", year: 2026, category: "חשמלי", body: "suv", fuel: "חשמלי", condition: "חדש", km: 0, hp: 408, accel: 5.0, gearbox: "חשמלי", price: 315000, color: "#4a5560", colorName: "אפור גרפיט", highlights: ["טווח 540 ק״מ", "משאבת חום", "תא מטען 620 ל׳"] }),
  car({ id: "aurex-c4", make: "Aurex", model: "C4 Sport", year: 2025, category: "סדאן", body: "sedan", fuel: "בנזין", condition: "משומש", km: 24000, hp: 258, accel: 6.2, gearbox: "אוטומטי 8", price: 214000, color: "#7c7f86", colorName: "כסף ירחי", highlights: ["יד ראשונה", "אחריות יצרן בתוקף", "חבילת בטיחות מלאה"] }),
  car({ id: "kestrel-a2", make: "Kestrel", model: "A2 Urban", year: 2026, category: "SUV", body: "suv", fuel: "היברידי", condition: "חדש", km: 0, hp: 195, accel: 8.4, gearbox: "אוטומטי CVT", price: 178000, color: "#9a3b1e", colorName: "כתום נחושת", highlights: ["צריכה 4.6 ל׳/100", "מסך 12.3 אינץ׳", "חניה אוטומטית"] }),
  car({ id: "strada-gt4", make: "Strada", model: "GT4 Touring", year: 2026, category: "קופה", body: "coupe", fuel: "היברידי", condition: "0 ק״מ", km: 8, hp: 460, accel: 4.1, gearbox: "רובוטי 8", price: 498000, color: "#20324a", colorName: "כחול פלדה", highlights: ["מצב חשמלי לעיר", "גג זכוכית", "מערכת שמע פרימיום"] }),
  car({ id: "noviq-e5", make: "Noviq", model: "E5 Executive", year: 2026, category: "חשמלי", body: "sedan", fuel: "חשמלי", condition: "חדש", km: 0, hp: 600, accel: 3.6, gearbox: "חשמלי", price: 419000, color: "#1b1b1f", colorName: "שחור מט", highlights: ["טווח 700 ק״מ", "נהיגה אוטונומית רמה 2+", "מושבים אחוריים מתכווננים"] }),
  car({ id: "velmora-s3", make: "Velmora", model: "S3 Comfort", year: 2024, category: "סדאן", body: "sedan", fuel: "היברידי", condition: "משומש", km: 31000, hp: 218, accel: 7.9, gearbox: "אוטומטי 8", price: 158000, color: "#5b2333", colorName: "בורדו", highlights: ["יד ראשונה", "רכב ליסינג פרטי", "בדיקה ב-120 נקודות"] }),
];

/** Formats a price in shekels: 489000 → "₪489,000". */
export const formatPrice = (n: number) => `₪${n.toLocaleString("en-US")}`;
export const formatKm = (n: number) => (n === 0 ? "0 ק״מ" : `${n.toLocaleString("en-US")} ק״מ`);
