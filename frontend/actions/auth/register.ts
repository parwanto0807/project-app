
import { fetchWithRefresh } from '@/lib/fetchWithRefresh';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export const register = async (values: {
    name: string;
    email: string;
    password: string;
}) => {
    try {
        const response = await fetchWithRefresh(`${apiUrl}/api/auth/admin/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
            return { error: data.message || "Something went wrong" };
        }

        return { success: "Account created successfully!" };
    } catch {
        return { error: "Failed to connect to server" };
    }
};
