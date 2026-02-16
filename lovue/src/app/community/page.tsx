export default function Community() {
    return (
        <div className="bg-white min-h-screen">
            <div className="bg-stone-900 py-24 text-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h1 className="font-serif text-5xl md:text-6xl mb-6">Love Community</h1>
                    <p className="text-stone-400 max-w-2xl mx-auto">
                        로뷰와 함께하는 행복한 순간들을 공유합니다.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-24">
                <h2 className="font-serif text-3xl text-stone-900 mb-12 text-center">Instagram @Lovue_Official</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <div key={item} className="aspect-square bg-stone-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity cursor-pointer relative group">
                            <div className="absolute inset-0 bg-stone-300 animate-pulse" /> {/* Placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity text-white font-medium">
                                View Post
                            </div>
                        </div>
                    ))}
                </div>

                <div className="aspect-video bg-stone-100 mt-24 rounded-2xl flex items-center justify-center border border-stone-200">
                    <div className="text-center">
                        <h3 className="font-serif text-2xl text-stone-900 mb-4">Youtube Channel Coming Soon</h3>
                        <p className="text-stone-500">딱지의 브이로그가 곧 공개됩니다!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
