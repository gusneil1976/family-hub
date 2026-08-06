export function MealImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain img avoids configuring next/image remote patterns for a low-traffic family app
    <img src={src} alt={alt} className={className} />
  );
}
