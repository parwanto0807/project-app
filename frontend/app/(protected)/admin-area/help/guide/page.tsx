import UserGuide from "@/components/help/UserGuide";
import React from "react";

export const metadata = {
  title: "Panduan Penggunaan | Admin Area",
  description: "Panduan penggunaan aplikasi untuk Admin",
};

const Page = () => {
  return (
    <div className="p-6">
      <UserGuide />
    </div>
  );
};

export default Page;
