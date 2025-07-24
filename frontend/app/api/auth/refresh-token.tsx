// import { useEffect } from 'react';
// // import { useRouter } from 'next/router';

// export default function RefreshTokenPage() {
//     //   const router = useRouter();

//     useEffect(() => {
//         const handleRefresh = async () => {
//             try {
//                 const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
//                     credentials: 'include'
//                 });

//                 // Jika backend redirect langsung
//                 if (response.redirected) {
//                     window.location.href = response.url;
//                     return;
//                 }

//                 const data = await response.json();

//                 if (data.success) {
//                     window.location.href = data.redirectUrl;
//                 } else {
//                     window.location.href = '/auth/login';
//                 }
//             } catch {
//                 window.location.href = '/auth/login';
//             }
//         };

//         handleRefresh();
//     }, []);

//     return <div>Memproses refresh token...</div>;
// }