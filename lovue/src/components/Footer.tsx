import Link from "next/link";
import { Instagram, Youtube, Mail } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-stone-50 border-t border-stone-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link href="/" className="font-serif text-2xl font-bold tracking-wider text-stone-800">
                            Lovue
                        </Link>
                        <p className="text-stone-500 text-sm leading-relaxed max-w-xs">
                            함께 보는 세상의 즐거움.<br />
                            사랑하는 아이의 눈에 담길 세상을 디자인합니다.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-stone-900 font-semibold mb-4 text-sm">Brand</h3>
                            <ul className="space-y-3">
                                <li><Link href="/brand-story" className="text-stone-500 hover:text-stone-900 text-sm">Story</Link></li>
                                <li><Link href="/product" className="text-stone-500 hover:text-stone-900 text-sm">Products</Link></li>
                                <li><Link href="/community" className="text-stone-500 hover:text-stone-900 text-sm">Community</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-stone-900 font-semibold mb-4 text-sm">Support</h3>
                            <ul className="space-y-3">
                                <li><Link href="/contact" className="text-stone-500 hover:text-stone-900 text-sm">Contact Us</Link></li>
                                <li><Link href="/faq" className="text-stone-500 hover:text-stone-900 text-sm">FAQ</Link></li>
                                <li><Link href="/shipping" className="text-stone-500 hover:text-stone-900 text-sm">Shipping</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact / Social */}
                    <div>
                        <h3 className="text-stone-900 font-semibold mb-4 text-sm">Connect</h3>
                        <div className="flex space-x-4 mb-6">
                            <a href="#" className="p-2 bg-white rounded-full border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors">
                                <Instagram size={20} />
                            </a>
                            <a href="#" className="p-2 bg-white rounded-full border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors">
                                <Youtube size={20} />
                            </a>
                            <a href="mailto:contact@lovue.com" className="p-2 bg-white rounded-full border border-stone-200 text-stone-600 hover:text-stone-900 hover:border-stone-400 transition-colors">
                                <Mail size={20} />
                            </a>
                        </div>
                        <p className="text-stone-400 text-xs">
                            Addr. 서울특별시 강남구 테헤란로 123<br />
                            Biz License. 123-45-67890
                        </p>
                    </div>
                </div>

                <div className="border-t border-stone-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-stone-400 text-xs text-center md:text-left">
                        &copy; {new Date().getFullYear()} Ubuntu Corp. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link href="/privacy" className="text-stone-400 hover:text-stone-600 text-xs">Privacy Policy</Link>
                        <Link href="/terms" className="text-stone-400 hover:text-stone-600 text-xs">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
