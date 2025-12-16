
import { ThumbsUp, RefreshCw } from 'lucide-react';
export default function StepResult({ likedPlace, selectedTime, setSelectedTime, handleSave, isSaving, onRetry }: any) {
  return (
   <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white z-20">
        <div className="text-center mb-6 animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-12 h-12 text-indigo-600" /> //이거부터 수정
        </div>
        <h3 className="text-2xl font-bold text-gray-900 px-4">{likedPlace.name}</h3>
        <p className="text-gray-500 mt-2 text-sm">{likedPlace.vicinity}</p>
        </div>

        {/* 시간 설정 입력창 */}
        <div className="w-full max-w-sm mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                Schedule Time
            </label>
            <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <RefreshCw className="w-4 h-4 text-gray-400" /> 
                </div>
                <input 
                    type="time" 
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 text-gray-800 text-lg font-bold rounded-lg 
                                px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"/>
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-1"> * 예상 시간을 자유롭게 수정하세요. </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
        <button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
            {isSaving ? <RefreshCw className="animate-spin" /> : "이 시간으로 일정 추가"}
        </button>
        <button onClick={onRetry} className="w-full py-3 text-gray-400 font-medium hover:text-gray-600">다른 곳 볼래요</button>
        </div>
    </div>
    )
}
