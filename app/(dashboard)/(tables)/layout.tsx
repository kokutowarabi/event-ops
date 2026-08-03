export default function TablesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <section className="mx-auto h-[calc(100svh-5.5rem)] max-w-7xl px-4 py-5 md:py-6">
      {children}
    </section>
  )
}
