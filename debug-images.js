// Debug helper - paste this in browser console to check image URLs

console.log('=== DEBUG IMAGE URLS ===');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

// Check if images are in the DOM
const images = document.querySelectorAll('img');
console.log(`Found ${images.length} images on page`);

images.forEach((img, idx) => {
  console.log(`Image ${idx + 1}:`, {
    src: img.src,
    alt: img.alt,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    complete: img.complete,
    error: img.complete && img.naturalWidth === 0
  });
});

// Test if backend is serving files
const testUrl = 'http://localhost:5000/uploads/receipts/test.jpg';
fetch(testUrl)
  .then(res => {
    console.log('Test fetch status:', res.status);
    if (res.status === 404) {
      console.log('❌ File not found - check if file exists in public/uploads/receipts/');
    } else if (res.status === 200) {
      console.log('✅ Backend can serve files from /uploads');
    }
  })
  .catch(err => console.error('Fetch error:', err));
