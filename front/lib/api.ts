//API 요청을 체계적으로 관리하기 위한 설정 파일
import axios from "axios";

//API 클라이언트 인스턴스 생성
//모든 API 요청에 공통적으로 적용될 설정을 담은 규격폼
//baseURL: 모든 통신의 기본이 되는 서버 주소라는 규칙
//headers: 모든 통신은 기본적으로 JSON으로 한다는 규칙
//interceptors: 모든 통신은 보내기 전에 '인증'이라는 절차를 자동으로 거친다는 규칙
const apiClient = axios.create({
  baseURL: "http://localhost:8080", //기본 URL 설정
  headers: { //기본 헤더 설정
    "Content-Type": "application/json", //요청 본문 타입(json) 설정
  },
});

//요청 인터셉터 설정
//apiClient에서 모든 요청을 보내기 전에 실행됨
apiClient.interceptors.request.use(
  (config) => {
    //브라우저의 저장 공간(localStorage)에서 'accessToken'이라는 이름으로 저장된 값 찾음
    //로그인 성공시에 발급된 토큰을 저장해둔 것
    const token = localStorage.getItem("accessToken");
    if (token) {
      //토큰이 존재하면 요청 헤더에 인증 토큰 추가해서
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    //내보냄
    return config;
    },
    //요청 보내기 전 에러가 발생한 경우
    (error) => {
    return Promise.reject(error);
  }
);
export default apiClient;