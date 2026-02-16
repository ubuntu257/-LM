"use client";

import { useState } from "react";
import { Headphones, Send } from "lucide-react";

export default function CustomerService() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTimeout(() => {
            setIsSubmitted(true);
        }, 1000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl text-center shadow-lg border border-stone-100">
                    <div className="w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send size={24} />
                    </div>
                    <h2 className="font-serif text-2xl text-stone-900 mb-4">접수 완료</h2>
                    <p className="text-stone-600 mb-8">
                        고객님의 문의가 안전하게 접수되었습니다.<br />
                        담당자가 확인 후 24시간 이내에 연락드리겠습니다.
                    </p>
                    <button onClick={() => window.location.href = '/'} className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors">
                        확인
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
                        <Headphones size={32} className="text-stone-900" />
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">고객 센터</h1>
                    <p className="text-stone-500">
                        불편하신 점이 있으신가요? 신속하게 도와드리겠습니다.
                    </p>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 mb-8">
                    <h3 className="font-bold text-stone-900 mb-4">운영 시간 안내</h3>
                    <div className="flex justify-between text-sm text-stone-600 border-b border-stone-100 pb-4 mb-4">
                        <span>평일 (월-금)</span>
                        <span className="font-medium">10:00 - 17:00</span>
                    </div>
                    <div className="flex justify-between text-sm text-stone-600">
                        <span>점심시간</span>
                        <span className="font-medium">12:30 - 13:30</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-stone-100 space-y-6">
                    <h3 className="font-bold text-stone-900 text-lg border-b border-stone-100 pb-2">문의 접수</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">문의 유형</label>
                        <select className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all">
                            <option>AS 신청</option>
                            <option>부품 구매 문의</option>
                            <option>배송 문의</option>
                            <option>기타</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">내용</label>
                        <textarea
                            rows={5}
                            placeholder="문의하시려는 내용을 자세히 적어주세요."
                            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all resize-none"
                        />
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10">
                            접수하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
