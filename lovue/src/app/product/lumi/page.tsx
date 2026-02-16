import Link from "next/link";
import { Check, ShieldCheck, Truck, Trophy } from "lucide-react";

export default function LumiProduct() {
    return (
        <div className="bg-white min-h-screen pb-24">
            {/* Product Hero */}
            <div className="relative h-[70vh] bg-stone-100">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-end px-4 pb-24 max-w-7xl mx-auto">
                    <span className="text-stone-300 font-bold tracking-widest mb-2 uppercase">The New Standard</span>
                    <h1 className="font-serif text-5xl md:text-7xl text-white font-bold mb-6">Lovue Lumi</h1>
                    <p className="text-white/80 max-w-xl text-lg leading-relaxed">
                        가장 편안하고, 가장 견고한 프리미엄 펫 트라이크.<br />
                        어둠 속에서도 빛나는 당신과 아이의 산책을 위해 탄생했습니다.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {/* Product Info */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="font-serif text-3xl text-stone-900 mb-6">Product Highlights</h2>
                            <p className="text-stone-600 leading-relaxed text-lg">
                                "루미(Lumi)"는 빛을 의미합니다. 야간 산책 시에도 아이를 안전하게 지켜주는
                                360도 반사 리플렉터와, 낮에는 우아한 실루엣을 자랑하는 프리미엄 디자인이 특징입니다.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                                <ShieldCheck className="text-stone-800 mb-4" size={32} />
                                <h3 className="font-bold text-stone-900 mb-2">Triple Safety System</h3>
                                <p className="text-stone-500 text-sm">3중 안전 장치로 어떤 상황에서도 아이를 안전하게 보호합니다.</p>
                            </div>
                            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                                <Trophy className="text-stone-800 mb-4" size={32} />
                                <h3 className="font-bold text-stone-900 mb-2">Premium Materials</h3>
                                <p className="text-stone-500 text-sm">항공 등급 알루미늄 프레임과 생활 방수 기능성 원단.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-serif text-2xl text-stone-900 mb-6">Detailed Specs</h3>
                            <ul className="space-y-4">
                                {[
                                    "무게: 6.8kg (업계 최경량급)",
                                    "사용 권장 몸무게: ~15kg",
                                    "프레임 소재: 아노다이징 코팅 알루미늄",
                                    "타이어: 360도 회전 EVA 타이어 + 독립 서스펜션",
                                    "폴딩: 원터치 퀵 폴딩 시스템"
                                ].map((spec, i) => (
                                    <li key={i} className="flex items-center text-stone-700 bg-stone-50 p-4 rounded-lg">
                                        <Check size={18} className="text-stone-900 mr-4 flex-shrink-0" />
                                        {spec}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Sticky Sidebar / Purchase Info */}
                    <div className="sticky top-24 self-start space-y-8">
                        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-lg">
                            <h3 className="font-serif text-2xl text-stone-900 mb-2">Lovue Lumi (2026 Model)</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-3xl font-bold text-stone-900">450,000원</span>
                                <span className="text-stone-400 line-through text-sm">520,000원</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">배송비</span>
                                    <span className="text-stone-900 font-medium">무료배송</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">적립금</span>
                                    <span className="text-stone-900 font-medium">2% (9,000원)</span>
                                </div>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <button className="flex-1 py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors">
                                    구매하기
                                </button>
                            </div>
                            <p className="text-center text-xs text-stone-400">
                                * 제주/도서산간 지역은 추가 배송비가 발생할 수 있습니다.
                            </p>
                        </div>

                        <div className="bg-stone-50 p-6 rounded-2xl flex items-center gap-4">
                            <Truck className="text-stone-600" size={24} />
                            <div>
                                <p className="text-stone-900 font-bold text-sm">오후 2시 이전 주문 시 당일 발송</p>
                                <p className="text-stone-500 text-xs">안전하게 포장하여 빠르게 보내드립니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
