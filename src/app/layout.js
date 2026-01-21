import './globals.css'
import ClientLayout from './ClientLayout'

export const metadata = {
  title: 'Skincare Consultation - Find Your Perfect Routine',
  description: 'Get personalized skincare recommendations based on your unique skin needs',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}