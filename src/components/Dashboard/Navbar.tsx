export const Navbar = () => {
  return (
    <nav className="bg-stone-800 p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-xl font-bold text-white">Dashboard</div>
        <ul className="flex space-x-4">
          <li>
            <a href="/" className="text-white hover:text-gray-300">
              Home
            </a>
          </li>
          <li>
            <a href="/streams" className="text-white hover:text-gray-300">
              Streams
            </a>
          </li>
          <li>
            <a href="/profile" className="text-white hover:text-gray-300">
              Profile
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
