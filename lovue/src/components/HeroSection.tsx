import Link from "next/link";

const HeroSection = () => {
    return (
        <div className="relative h-[80vh] w-full bg-stone-200 overflow-hidden flex items-center justify-center">
            {/* Background - Placeholder for Video/Image */}
            <div className="absolute inset-0 bg-stone-300">
                {/* In production, this would be <video> or <Image> */}
                <div className="w-full h-full object-cover opacity-50 bg-[url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center" />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/10" />

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-md">
                    함께 보는 세상의 즐거움
                </h1>
                <p className="text-white/90 text-lg md:text-xl font-light mb-10 tracking-wide drop-shadow-sm">
                    사랑하는 아이의 눈에 담길 세상을 디자인합니다, <span className="font-semibold">Lovue</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/product"
                        className="px-8 py-3 bg-white text-stone-900 rounded-full font-medium hover:bg-stone-100 transition-all transform hover:scale-105"
                    >
                        제품 보러가기
                    </Link>
                    <Link
                        href="/brand-story"
                        className="px-8 py-3 bg-transparent border border-white text-white rounded-full font-medium hover:bg-white/10 transition-all"
                    >
                        브랜드 이야기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
