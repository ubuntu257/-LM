import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Shop() {
    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-8">
                <h1 className="font-serif text-4xl text-stone-900">Shop</h1>
                <div className="p-8 bg-white rounded-2xl shadow-sm border border-stone-100">
                    <p className="text-stone-600 mb-6">
                        현재 공식 온라인 스토어를 준비 중입니다.<br />
                        빠른 시일 내에 만나보실 수 있습니다.
                    </p>
                    <div className="h-1 w-20 bg-stone-200 mx-auto rounded-full mb-6"></div>
                    <p className="text-stone-500 text-sm">
                        문의 사항은 <a href="mailto:contact@lovue.com" className="text-stone-900 underline">contact@lovue.com</a>으로 연락주세요.
                    </p>
                </div>

                <Link href="/" className="inline-flex items-center text-stone-500 hover:text-stone-900 transition-colors">
                    <ArrowLeft size={16} className="mr-2" /> 메인으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
