import './globals.css'

export const metadata = {
  description: 'Blog and resume driven by Payload and a typed Elysia content API.',
  title: 'Zick.me · Blog & Resume',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
