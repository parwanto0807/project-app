import UserGuide from "@/components/help/UserGuide";
import React from "react";

export const metadata = {
  title: "Panduan Penggunaan | User Area",
  description: "Panduan penggunaan aplikasi untuk User",
};

const Page = () => {
  return (
    <div className="p-6">
      <UserGuide />
    </div>
  );
};

export default Page;
