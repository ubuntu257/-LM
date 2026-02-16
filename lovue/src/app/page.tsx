import HeroSection from "@/components/HeroSection";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      {/* Brand Philosophy Section */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-stone-500 uppercase tracking-widest text-xs font-bold mb-4 block">Our Philosophy</span>
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-8 leading-tight">
            "돈으로 근본은 살 수 없다"
          </h2>
          <p className="text-stone-600 leading-relaxed mb-6">
            로뷰는 단순한 이동수단이 아닙니다. 사랑하는 반려견 '딱지'와 함께 세상을 바라보며 느꼈던
            소중한 순간들을 모든 반려가족과 나누고 싶었습니다.
          </p>
          <p className="text-stone-600 leading-relaxed mb-10">
            화려한 기능보다 기본에 충실한 견고함, 유행을 쫓기보다 변치 않는 가치를 담았습니다.
            가장 편안하고 안전한 산책을 선물하세요.
          </p>
          <Link href="/brand-story" className="inline-flex items-center text-stone-900 font-medium hover:underline decoration-stone-400 underline-offset-4">
            로뷰의 이야기 더 보기 <ArrowRight size={16} className="ml-2" />
          </Link>
        </div>
      </section>

      {/* Product Highlight */}
      <section className="py-24 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative h-96 bg-stone-300 rounded-2xl overflow-hidden shadow-xl">
              {/* Product Image Placeholder */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1623387641168-d9803ddd3f3e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="font-serif text-3xl md:text-4xl text-stone-900">
                Kimer's Shellwego
              </h2>
              <p className="text-stone-600 text-lg">
                혁신적인 쉘 디자인과 안락함의 조화.<br />
                어디든 안전하게, 쉘위고와 함께하세요.
              </p>
              <ul className="space-y-3 text-stone-600">
                <li className="flex items-center"><span className="w-2 h-2 bg-stone-800 rounded-full mr-3"></span>프리미엄 충격 흡수 서스펜션</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-stone-800 rounded-full mr-3"></span>가볍고 견고한 항공 알루미늄 프레임</li>
                <li className="flex items-center"><span className="w-2 h-2 bg-stone-800 rounded-full mr-3"></span>원버튼 폴딩 시스템</li>
              </ul>
              <div className="pt-4">
                <Link href="/product" className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors inline-block">
                  자세히 보기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community / Review / YouTube */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-12">
            Happy Moments with Lovue
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-stone-50 p-6 rounded-xl text-left border border-stone-100 hover:shadow-lg transition-shadow">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, idx) => <Star key={idx} size={16} fill="currentColor" />)}
                </div>
                <p className="text-stone-600 mb-4 text-sm leading-relaxed">
                  "딱지가 너무 좋아해요! 산책이 더 즐거워졌습니다. 튼튼해서 믿음이 가요."
                </p>
                <p className="text-stone-900 font-medium text-sm">- Lovue Family Review</p>
              </div>
            ))}
          </div>

          <div className="bg-stone-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-serif mb-4">딱지의 산책 일기</h3>
              <p className="text-stone-300 mb-8 max-w-xl mx-auto">
                매일매일 새로운 세상을 만나는 딱지의 브이로그.<br />유튜브 채널에서 더 많은 이야기를 만나보세요.
              </p>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-6 py-3 bg-white text-stone-900 rounded-full font-bold hover:bg-stone-100 transition-colors">
                Youtube 보러가기
              </a>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-stone-800 rounded-full opacity-50 blur-3xl"></div>
          </div>
        </div>
      </section>
    </div>
  );
}
