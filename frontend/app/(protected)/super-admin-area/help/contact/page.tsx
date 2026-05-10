import ContactAdmin from "@/components/help/ContactAdmin";
import React from "react";

export const metadata = {
  title: "Kontak Admin | Super Admin Area",
  description: "Informasi kontak pengembang dan bantuan sistem",
};

const Page = () => {
  return (
    <div className="p-6">
      <ContactAdmin />
    </div>
  );
};

export default Page;
