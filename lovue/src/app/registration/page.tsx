"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle } from "lucide-react";

export default function Registration() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate submission
        setTimeout(() => {
            setIsSubmitted(true);
        }, 1000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl text-center shadow-lg border border-stone-100">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="font-serif text-2xl text-stone-900 mb-4">정품 등록 완료</h2>
                    <p className="text-stone-600 mb-8">
                        정상적으로 등록되었습니다.<br />
                        이제 로뷰의 프리미엄 보증 서비스를 받으실 수 있습니다.
                    </p>
                    <button onClick={() => window.location.href = '/'} className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors">
                        메인으로 돌아가기
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-50 py-24 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-4 bg-white rounded-full shadow-sm mb-6">
                        <ShieldCheck size={32} className="text-stone-900" />
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">정품 등록</h1>
                    <p className="text-stone-500">
                        제품의 시리얼 넘버를 등록하고 AS 보증 혜택을 받으세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-stone-900 text-lg border-b border-stone-100 pb-2">제품 정보</h3>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">모델명</label>
                            <select className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all">
                                <option>Lovue Lumi (2026)</option>
                                <option>Kimer's Shellwego</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">시리얼 넘버 (S/N)</label>
                            <input
                                type="text"
                                required
                                placeholder="예: LV-2026-XXXX"
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all placeholder:text-stone-400"
                            />
                            <p className="text-xs text-stone-400 mt-2">* 제품 프레임 하단 또는 박스 스티커를 확인해주세요.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">구매처</label>
                            <input
                                type="text"
                                placeholder="예: 공식 홈페이지, 스마트스토어 등"
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">구매일자</label>
                            <input
                                type="date"
                                required
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-stone-900 text-lg border-b border-stone-100 pb-2">고객 정보</h3>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">이름</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">연락처</label>
                            <input
                                type="tel"
                                required
                                placeholder="010-0000-0000"
                                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10">
                            등록 완료하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
