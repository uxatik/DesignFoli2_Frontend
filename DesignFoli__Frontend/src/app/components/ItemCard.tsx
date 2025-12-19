import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ItemCardProps {
  id?: number;
  title?: string;
  category?: string;
  imageUrl?: string;
  href?: string;
}

const ItemCard = ({
  id = 2,
  title = "Project Title",
  category = "mobile app",
  imageUrl = "/assets/images/cardImage.png",
  href = "#",
}: ItemCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    // If id exists and is not 0, navigate to the dynamic project page
    if (id) {
      router.push(`/${id}`);
    }
    // Otherwise use the href as fallback
    else if (href && href !== "#") {
      router.push(href);
    }
  };

  return (
    <div
      className="h-60 w-72 relative overflow-hidden rounded-lg cursor-pointer group hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      {/* Image section - top 70% of card */}
      <div className="w-full h-[70%] relative overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={title}
          className="object-contain w-full h-full pt-2"
          width={288} // 72 * 4 = 288 (multiplying by 4 for higher resolution)
          height={168} // 60 * 0.7 * 4 = 168 (70% of height, multiplied by 4)
        />
      </div>

      {/* Text content - bottom 30% with white background */}
      <div className="absolute bottom-0 left-0 w-full h-[30%] bg-white p-3">
        <div className="text-xs uppercase font-semibold tracking-wider mb-1 text-[#333399]">
          {category}
        </div>
        <h3 className="text-[#1A1A1A] text-lg font-semibold line-clamp-1">
          {title}
        </h3>
      </div>
    </div>
  );
};

export default ItemCard;
