import Image from "next/image";

export default function BrandStory() {
    return (
        <div className="bg-white min-h-screen pb-24">
            <div className="relative h-[60vh] bg-stone-200">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
                    <h1 className="font-serif text-5xl md:text-6xl text-white font-bold drop-shadow-md">
                        Brand Story
                    </h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-24 space-y-24">
                {/* Philosophy */}
                <section className="text-center">
                    <span className="text-stone-500 uppercase tracking-widest text-xs font-bold mb-6 block">Our Philosophy</span>
                    <h2 className="font-serif text-3xl md:text-5xl text-stone-900 mb-10 leading-tight">
                        "Love + View = Lovue"
                    </h2>
                    <p className="text-stone-600 leading-loose text-lg mb-8">
                        로뷰는 이름 그대로 '사랑(Love)'과 '봄(View)'의 합성어입니다.<br />
                        우리는 반려동물이 바라보는 세상, 그리고 그들을 바라보는 가족의 시선을<br />
                        더 아름답고 편안하게 만들고자 합니다.
                    </p>
                </section>

                {/* Origin */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="aspect-square bg-stone-300 rounded-2xl overflow-hidden relative">
                        {/* Placeholder for Ddakji image */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center" />
                    </div>
                    <div>
                        <h3 className="font-serif text-2xl text-stone-900 mb-6">딱지와의 산책에서 시작된 이야기</h3>
                        <p className="text-stone-600 leading-relaxed mb-6">
                            주식회사 우분투의 대표이자, 사랑스러운 반려견 '딱지'의 보호자.<br />
                            매일 산책을 하며 느꼈던 작은 불편함들이 로뷰의 시작이었습니다.
                        </p>
                        <blockquote className="border-l-4 border-stone-900 pl-6 italic text-stone-700 my-8">
                            "가장 소중한 존재를 태우는 것이기에,<br />
                            타협하지 않는 견고함이 필요했습니다."
                        </blockquote>
                        <p className="text-stone-600 leading-relaxed">
                            돈으로 겉모습은 흉내 낼 수 있어도,<br />
                            근본적인 안전과 품질은 흉내 낼 수 없습니다.<br />
                            로뷰는 그 '근본'을 지킵니다.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
