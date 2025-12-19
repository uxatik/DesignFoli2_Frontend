import React from 'react';
import Image from 'next/image';
import EmptyIcon from '@/assets/icons/image.png';

interface EmptyItemProps {
  title?: string;
  description?: string;
}

const EmptyItem = ({ 
  title = "No Data Found", 
  description = "Could not find any result, please check again" 
}: EmptyItemProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-12">
        <Image src={EmptyIcon} alt="No Data" width={80} height={80} />

      <div className=" text-[#1A1A1A] text-[20px] font-medium rounded-lg  mt-2">
        {title}
      </div>
      <div className="text-[#4D4D4D] text-[14px] font-medium ">
        {description}
      </div>
    </div>
    );
};

export default EmptyItem;
