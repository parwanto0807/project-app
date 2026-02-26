import { redirect } from "next/navigation";

export default function MasterRedirectPage() {
    redirect("/super-admin-area/master/customers");
}
