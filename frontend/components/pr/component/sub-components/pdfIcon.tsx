export const PdfIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M6 2a2 2 0 0 0-2 2v16c0 1.103.897 2 2 2h12a2 2 0 0 0 2-2V8l-6-6H6z" />
    <path fill="#fff" d="M14 2v6h6" />
    <text
      x="7"
      y="18"
      fill="red"
      fontSize="8"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      Preview Pdf
    </text>
  </svg>
);