// /lib/actions/paymentTerm.ts
import { PaymentTerm } from "@/types/quotation";

export async function fetchPaymentTerms(): Promise<{ terms: PaymentTerm[] }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/master/payment-term/getPaymentTerms`
  );
  if (!res.ok) throw new Error("Gagal fetch payment terms");
  const terms = await res.json();
  return { terms };
}

export async function fetchPaymentTermById(id: string): Promise<PaymentTerm> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/master/payment-term/${id}`
  );
  if (!res.ok) throw new Error("Gagal fetch payment term");
  return res.json();
}

export async function createPaymentTerm(
  data: Partial<PaymentTerm>
): Promise<PaymentTerm> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/master/payment-term`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Gagal create payment term");
  return res.json();
}

export async function updatePaymentTerm(
  id: string,
  data: Partial<PaymentTerm>
): Promise<PaymentTerm> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/master/payment-term/${id}`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error("Gagal update payment term");
  return res.json();
}

export async function deletePaymentTerm(
  id: string
): Promise<{ message: string }> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/master/payment-term/${id}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  );
  if (!res.ok) throw new Error("Gagal delete payment term");
  return res.json();
}
