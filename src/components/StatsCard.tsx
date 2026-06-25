import React from "react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
}

export default function StatsCard({
  title,
  value,
  description,
  icon,
  iconBgColor = "bg-[#f5b731]/10",
}: StatsCardProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-3xl p-6 flex items-center justify-between shadow-lg relative overflow-hidden transition-all duration-300 hover:border-[#f5b731]/50 group">
      {/* Decorative gradient overlay */}
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[#f5b731]/5 rounded-full blur-xl group-hover:bg-[#f5b731]/10 transition-all duration-300"></div>

      <div className="flex flex-col space-y-1 z-10">
        <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
          {title}
        </span>
        <span className="text-3xl font-black text-white">{value}</span>
        <span className="text-xs text-gray-500 font-medium">{description}</span>
      </div>

      {icon && (
        <div className={`p-4 rounded-2xl ${iconBgColor} text-[#f5b731] z-10 flex items-center justify-center`}>
          {icon}
        </div>
      )}
    </div>
  );
}
