'use client';
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // 방금 만든 파일 불러오기

export default function SharedNote() {
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 1. [불러오기] 컴포넌트가 켜지면 Supabase에서 1번 글을 가져옴
  useEffect(() => {
    getNote();
  }, []);

  const getNote = async () => {
    // notes 테이블에서 id가 1인 데이터를 가져와라
    const { data, error } = await supabase
      .from('notes')
      .select('content')
      .eq('id', 1)
      .single();

    if (data) {
      setNote(data.content);
    }
    if (error) {
      console.error("불러오기 실패:", error);
    }
  };

  // 2. [저장하기] 버튼을 누르면 Supabase에 덮어씌움
  const saveNote = async () => {
    setLoading(true);
    // notes 테이블의 id가 1인 데이터를 지금 내용으로 업데이트해라
    const { error } = await supabase
      .from('notes')
      .update({ content: note })
      .eq('id', 1);

    if (error) {
      alert("저장 실패 ㅠㅠ");
    } else {
      alert("저장 완료! 친구들도 볼 수 있어요 🎉");
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 shadow-md relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 border border-red-600 shadow-sm"></div>
        
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-yellow-800 flex items-center gap-2">
            🌏 함께 쓰는 공유 메모
          </h3>
          <button 
            onClick={getNote}
            className="text-xs text-yellow-600 hover:text-yellow-800 underline"
          >
            새로고침
          </button>
        </div>
        
        <textarea
          className="w-full h-40 bg-transparent border-none resize-none focus:ring-0 text-gray-700 leading-relaxed placeholder-yellow-500/50"
          placeholder="여기에 적으면 친구들도 다 같이 볼 수 있어요!"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        
        <div className="flex justify-end mt-2">
            <button 
                onClick={saveNote}
                disabled={loading}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold text-white transition
                    ${loading ? 'bg-gray-400' : 'bg-yellow-500 hover:bg-yellow-600 shadow-sm'}`}
            >
                {loading ? "저장 중..." : "☁️ 클라우드 저장"}
            </button>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        * 저장 버튼을 눌러야 친구들에게 공유됩니다.
      </p>
    </div>
  );
}