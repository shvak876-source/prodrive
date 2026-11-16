import type { Car } from "../data/cars";
import { formatKm, formatPrice } from "../data/cars";

/** Catalog tile. The whole card is one button that opens the detail sheet. */
export function CarCard({ car, onOpen }: { car: Car; onOpen?: (c: Car) => void }) {
  return (
    <article className="car-card" data-reveal>
      {onOpen && (
        <button className="car-card-hit" onClick={() => onOpen(car)} aria-label={`פרטים על ${car.make} ${car.model}`} />
      )}
      <div className="car-card-media" style={{ ["--tint" as string]: car.color }}>
        <img src={car.image} alt={`${car.make} ${car.model} בצבע ${car.colorName}`} loading="lazy" width={800} height={450} />
        <span className={`tag tag-${car.condition === "משומש" ? "used" : "new"}`}>{car.condition}</span>
      </div>
      <div className="car-card-body">
        <div className="car-card-title">
          <div>
            <span className="eyebrow-sm">{car.make} · {car.year}</span>
            <h3>{car.model}</h3>
          </div>
          <span className="price">{formatPrice(car.price)}</span>
        </div>
        <ul className="specs-row">
          <li><b>{car.hp}</b> כ״ס</li>
          <li><b>{car.accel}</b> שנ׳ 0–100</li>
          <li>{car.fuel}</li>
          <li>{formatKm(car.km)}</li>
        </ul>
      </div>
    </article>
  );
}
