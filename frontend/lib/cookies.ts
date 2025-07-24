import Cookies from 'js-cookie';

const TOKEN_KEY = 'token';

// Menyimpan token ke cookie
export const setToken = (token: string) => {
  Cookies.set(TOKEN_KEY, token, {
    expires: 1, // 1 hari
    secure: true, // hanya diakses melalui HTTPS
    sameSite: 'Strict',
  });
};

// Mengambil token dari cookie
export const getToken = () => {
  return Cookies.get(TOKEN_KEY);
};

// Menghapus token (untuk logout)
export const removeToken = () => {
  Cookies.remove(TOKEN_KEY);
};
