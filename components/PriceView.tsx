import { twMerge } from "tailwind-merge";
import PriceFormatter from "./PriceFormatter";

interface Props {
  price?: number;
  className?: string;
}

const PriceView = ({ price, className }: Props) => {
  return (
    <div className="flex items-center justify-between gap-5">
      {price !== undefined && (
        <PriceFormatter amount={price} className={className} />
      )}
    </div>
  );
};

export default PriceView;
