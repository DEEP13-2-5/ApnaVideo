const server = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD
    ? "https://apnavideobackend-emjk.onrender.com"
    : "http://localhost:8000");

export default server;