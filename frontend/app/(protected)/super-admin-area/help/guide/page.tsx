import UserGuide from "@/components/help/UserGuide";
import React from "react";

export const metadata = {
  title: "Panduan Penggunaan | Super Admin Area",
  description: "Panduan penggunaan aplikasi untuk Super Admin",
};

const Page = () => {
  return (
    <div className="p-6">
      <UserGuide />
    </div>
  );
};

export default Page;
