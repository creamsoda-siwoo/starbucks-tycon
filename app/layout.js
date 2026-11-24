import './globals.css';

export const metadata = {
  title: '스타벅스 타이쿤',
  description: '주문 받고 음료 만들고 매장을 키우는 스타벅스 경영 타이쿤 게임',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#00704a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jua&family=Gowun+Dodum&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
