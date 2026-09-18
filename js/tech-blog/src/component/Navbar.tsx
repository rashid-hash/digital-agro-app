import Link from "next/link";
import { Search } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-900">
              Tech<span className="text-blue-600">Blog.</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Home</Link>
            <Link href="/trending" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Trending</Link>
            <Link href="/ai" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">AI & Tech</Link>
            <Link href="/reviews" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Reviews</Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-slate-500 hover:text-slate-900 transition bg-slate-100 rounded-full">
              <Search className="w-5 h-5" />
            </button>
            <Link 
              href="/admin/login" 
              className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-slate-800 transition"
            >
              Admin
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}