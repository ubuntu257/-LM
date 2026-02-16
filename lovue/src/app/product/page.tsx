import Link from "next/link";
import { Check } from "lucide-react";

export default function Product() {
    return (
        <div className="bg-stone-50 min-h-screen">
            <div className="bg-white py-24 border-b border-stone-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="font-serif text-5xl md:text-6xl text-stone-900 mb-6">Our Products</h1>
                    <p className="text-stone-500 max-w-2xl mx-auto">
                        최고의 기술력과 디자인이 만난 프리미엄 펫 기어 컬렉션입니다.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 gap-16">
                    {/* Product 1: Shellwego */}
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col md:flex-row">
                        <div className="md:w-1/2 h-96 md:h-auto bg-stone-200 relative">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1623387641168-d9803ddd3f3e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                        </div>
                        <div className="md:w-1/2 p-12 flex flex-col justify-center">
                            <span className="text-stone-500 text-sm font-bold tracking-widest mb-2">PREMIUM STROLLER</span>
                            <h2 className="font-serif text-4xl text-stone-900 mb-6">Kimer's Shellwego</h2>
                            <p className="text-stone-600 mb-8 leading-relaxed">
                                조개껍데기에서 영감을 받은 독창적인 쉘 디자인.
                                외부의 충격으로부터 아이를 안전하게 보호하며,
                                아늑하고 포근한 공간을 제공합니다.
                            </p>
                            <ul className="space-y-4 mb-10">
                                {["항공 알루미늄 프레임", "원터치 폴딩 시스템", "최고급 서스펜션", "생활 방수 쉘 패브릭"].map((feature) => (
                                    <li key={feature} className="flex items-center text-stone-700">
                                        <Check size={18} className="text-stone-900 mr-3" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-4">
                                <Link href="/shop" className="px-8 py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors text-center w-full md:w-auto">
                                    구매하기
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Add more products here later */}
                </div>
            </div>
        </div>
    );
}
