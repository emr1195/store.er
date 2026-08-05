import PriceFormatter from "./PriceFormatter";

interface Props {
  price?: number;
  discount?: number;
  className?: string;
}

const PriceView = ({ price, discount = 0, className }: Props) => {
  const finalPrice = price === undefined ? undefined : price * (1 - discount / 100);
  return (
    <div className="flex items-center justify-between gap-5">
      {finalPrice !== undefined && (
        <PriceFormatter amount={finalPrice} className={className} />
      )}
    </div>
  );
};

export default PriceView;
