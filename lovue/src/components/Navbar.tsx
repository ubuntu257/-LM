"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShoppingBag } from "lucide-react";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navLinks = [
        { name: "Brand Story", href: "/brand-story" },
        { name: "Lumi Product", href: "/product/lumi" },
        { name: "정품 등록", href: "/registration" },
        { name: "고객 센터", href: "/cs" },
    ];

    return (
        <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="font-serif text-2xl font-bold tracking-wider text-stone-800">
                            Lovue
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-8 items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-stone-600 hover:text-stone-900 transition-colors text-sm font-medium tracking-wide uppercase"
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            href="/shop"
                            className="ml-4 px-6 py-2 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-colors flex items-center gap-2"
                        >
                            Shop <ShoppingBag size={16} />
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-stone-600 hover:text-stone-900 focus:outline-none"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-stone-100 shadow-lg">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="block px-3 py-4 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-md text-base font-medium text-center"
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 flex justify-center">
                            <Link
                                href="/shop"
                                className="w-full max-w-xs px-6 py-3 bg-stone-900 text-white text-base font-medium rounded-full hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                                onClick={() => setIsOpen(false)}
                            >
                                Shop <ShoppingBag size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
