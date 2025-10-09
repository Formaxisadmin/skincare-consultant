import './globals.css'

export const metadata = {
  title: 'Skincare Consultation - Find Your Perfect Routine',
  description: 'Get personalized skincare recommendations based on your unique skin needs',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}