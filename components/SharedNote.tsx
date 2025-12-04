'use client';
import { TripNote } from "@/types/db"; 

interface Props {
  notes: TripNote[]; 
  tripId: string;
}

// (임시) 현재 로그인한 유저 ID라고 가정합니다. 나중에 Supabase 인증으로 대체해야 합니다.
const currentUserId = "USER_ID_FROM_AUTH"; 

export default function SharedNote({ notes, tripId }: Props) {
  
  // 새 노트를 만들거나 기존 노트를 수정하는 로직이 필요합니다.
  // (이 부분은 다음 단계에서 구현합니다)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg text-gray-800">🌏 공유 노트</h3>
        <button className="px-3 py-1.5 bg-sky-500 text-white text-sm font-bold rounded-lg hover:bg-sky-600">
          + 새 노트 작성
        </button>
      </div>

      <div className="space-y-4">
        {/* ▼▼▼ [핵심] props로 받은 notes 배열을 map으로 돌려 목록을 보여줍니다. ▼▼▼ */}
        {notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-800">{note.title}</h4>
                {/* ▼▼▼ 내가 쓴 글에만 수정/삭제 버튼이 보이도록 처리 ▼▼▼ */}
                {note.user_id === currentUserId && (
                  <div className="space-x-2">
                    <button className="text-xs text-gray-500 hover:text-black">수정</button>
                    <button className="text-xs text-red-500 hover:text-red-700">삭제</button>
                  </div>
                )}
              </div>
              {/* 
                 ▼▼▼ [수정 4] content가 undefined일 수 있으므로 처리 
                 TripNote 타입에서 content는 'string | undefined'입니다.
                 내용이 없으면 빈 문자열("")을 보여주거나 안내 문구를 넣습니다.
              */}
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {note.content || "내용이 없습니다."}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg">
            <p>아직 작성된 노트가 없어요.</p>
            <p className="text-sm mt-1">첫 번째 노트를 작성해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}