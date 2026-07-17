import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import Category from "@/models/Category";
import { connectDB } from "@/lib/mongodb";

async function getCategories() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    return categories.map(cat => ({
      _id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

const Header = async () => {
  const session = await auth();
  const categories = await getCategories();

  return (
    <header className="mb-14 mt-8 flex items-center justify-between">
      <Link href="/" className="flex items-center">
        <Image
          src="/assets/logo.png"
          alt="MyBestTools"
          width={48}
          height={48}
          priority
        />
        <span className="sr-only">MyBestTools</span>
      </Link>
      <nav aria-label="Main" className="text-sm md:text-base font-medium">
        <ul className="flex items-center gap-6">
          <li>
            <Link href="/" className="hover:underline">
              Main
            </Link>
          </li>
          {/* Category Navigation */}
          {categories.length > 0 && (
            <>
              {categories.map((category) => (
                <li key={category._id}>
                  <Link href={`/category/${category.slug}`} className="hover:underline">
                    {category.name}
                  </Link>
                </li>
              ))}
            </>
          )}
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
              className="absolute right-0 mt-2 hidden min-w-[180px] rounded-md border border-gray-200 bg-white py-2 text-sm shadow-lg group-focus-within:block md:group-hover:block dark:border-gray-700 dark:bg-gray-800"
            >
              <li role="none">
                <Link role="menuitem" href="/lab/list-elements" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  List Elements
                </Link>
              </li>
              <li role="none">
                <Link role="menuitem" href="/lab/nesting-and-indentation" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Nesting and Indentation
                </Link>
              </li>
              <li role="none">
                <Link role="menuitem" href="/lab/anchor-elements" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Anchor Elements
                </Link>
              </li>
              <li role="none">
                <Link
                  role="menuitem"
                  href="/lab/multipage"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Multipage
                </Link>
              </li>
              <li role="none">
                <Link
                  role="menuitem"
                  href="/lab/css"
                  className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  CSS
                </Link>
              </li>
            </ul>
          </li>
          <li>
            <Link href="/shop" className="hover:underline">
              Shop
            </Link>
          </li>
          {/* Login/Logout Button */}
          {session?.user ? (
            <li className="relative group">
              <button
                type="button"
                className="hover:underline focus:outline-none"
                aria-haspopup="menu"
              >
                {session.user.name || session.user.email}
              </button>
              <ul
                role="menu"
                className="absolute right-0 mt-2 hidden min-w-[180px] rounded-md border border-gray-200 bg-white py-2 text-sm shadow-lg group-focus-within:block md:group-hover:block dark:border-gray-700 dark:bg-gray-800"
              >
                <li role="none">
                  <Link role="menuitem" href="/admin" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Admin Dashboard
                  </Link>
                </li>
                <li role="none">
                  <form action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}>
                    <button
                      type="submit"
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </form>
                </li>
              </ul>
            </li>
          ) : (
            <li>
              <Link href="/admin/login" className="hover:underline font-semibold">
                Login
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
