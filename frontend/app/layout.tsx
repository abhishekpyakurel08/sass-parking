import '../styles/globals.css'
import TenantLoader from '../components/TenantLoader'
import AuthProvider from '../components/AuthProvider'

export const metadata = {
  title: 'ParkSaaS — Smart Parking Management',
  description: 'Multi-tenant parking management SaaS platform for modern parking businesses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <TenantLoader />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
