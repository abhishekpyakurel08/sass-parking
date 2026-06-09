import './styles/globals.css'
import Header from './components/Header'

export const metadata = {
  title: 'Sass Parking - Frontend',
  description: 'UI skeleton for the Sass Parking frontend'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="container">{children}</main>
      </body>
    </html>
  )
}
