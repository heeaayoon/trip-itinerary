import { getSubtypes } from "./utils";
import { X, Sparkles, Check, MapPin, Utensils, Coffee, Beer, Camera } from 'lucide-react';

export default function StepInput({ tags, setTags, handleSearch, existingCount }: any) {
  return (
    <div className="absolute inset-0 p-6 pb-10 flex flex-col overflow-y-auto">
      <div className="w-full max-w-md mx-auto space-y-8 mt-4">
        {/* 상태 표시 */}
        <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-start gap-3">
            <div className="bg-gray-200 p-2 rounded-full shrink-0"><MapPin className="w-4 h-4 text-gray-600" /></div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Current Schedule</p>
              <p className="text-sm font-bold text-gray-800">
                {existingCount > 0 ? `기존 일정 ${existingCount}개 + 경로 표시` : "위치 기반 탐색"}
              </p>
            </div>
        </div>

        {/* 1. 누구와? */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">1. 누구와 함께하시나요?</h3>
            <div className="grid grid-cols-4 gap-2">
            {['혼자', '친구', '연인', '가족'].map(who => (
                <button 
                key={who} 
                onClick={() => setTags({...tags, who})} 
                className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                    tags.who === who ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}>
                {who}
                </button>
            ))}
            </div>
        </section>

        {/* 2. 장소 유형 (대분류) */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">2. 어떤 장소를 찾으세요?</h3>
            <div className="grid grid-cols-4 gap-2">
            {[
                { label: '식사', icon: <Utensils className="w-4 h-4" /> }, 
                { label: '카페', icon: <Coffee className="w-4 h-4" /> }, 
                { label: '술집', icon: <Beer className="w-4 h-4" /> },
                { label: '명소', icon: <Camera className="w-4 h-4" /> }
            ].map(item => (
                <button 
                key={item.label} 
                onClick={() => setTags({ ...tags, type: item.label, subtype: '' })} // 대분류 변경시 소분류 초기화
                className={`py-4 rounded-xl text-sm font-bold border flex flex-col items-center gap-2 transition-all ${
                    tags.type === item.label ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {item.icon}
                {item.label}
                </button>
            ))}
            </div>
        </section>

        {/* 3. 상세 유형 (소분류 - 조건부 렌더링) */}
        {tags.type && (
            <section className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex flex-wrap gap-2">
                {getSubtypes(tags.type).map((sub: string) => (
                <button 
                    key={sub} 
                    onClick={() => setTags({...tags, subtype: sub})} 
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                    tags.subtype === sub ? 'bg-rose-500 text-white border-rose-500 shadow-sm' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {sub}
                </button>
                ))}
            </div>
            </section>
        )}

        {/* 4. 분위기 */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">3. 선호하는 분위기</h3>
            <div className="flex flex-wrap gap-2">
            {['조용한', '활기찬', '뷰가 좋은', '가성비', '럭셔리'].map(mood => (
                <button 
                key={mood} 
                onClick={() => setTags({...tags, mood})} 
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                    tags.mood === mood ? 'bg-amber-500 text-white border-amber-500 shadow-sm' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {mood}
                </button>
            ))}
            </div>
        </section>

        <div className="pt-4">
            <button 
                onClick={handleSearch} 
                disabled={!tags.type} 
                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl
                        hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
                AI 추천 시작하기
            </button>
        </div>
        </div>
    </div>
    );
}
