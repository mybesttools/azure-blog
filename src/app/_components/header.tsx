import Link from "next/link";

const Header = () => {
  return (
    <header className="mb-14 mt-8 flex items-center justify-between">
      <Link
        href="/"
        className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight hover:underline"
      >
        Blog
      </Link>
      <nav aria-label="Main" className="text-sm md:text-base font-medium">
        <ul className="flex items-center gap-6">
          <li>
            <Link href="/" className="hover:underline">
              Main
            </Link>
          </li>
          <li className="relative group">
            <button
              type="button"
              className="hover:underline focus:outline-none"
              aria-haspopup="menu"
            >
              Lab
            </button>
            <ul
              role="menu"
              className="absolute right-0 mt-2 hidden min-w-[180px] rounded-md border border-gray-200 bg-white py-2 text-sm shadow-lg group-focus-within:block md:group-hover:block"
            >
              <li role="none">
                <Link
                  role="menuitem"
                  href="/lab/html-intro"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  HTML Intro
                </Link>
              </li>
              <li role="none">
                <Link
                  role="menuitem"
                  href="/lab/multipage"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  Multipage
                </Link>
              </li>
              <li role="none">
                <Link
                  role="menuitem"
                  href="/lab/css"
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  CSS
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
