package com.trip.dto;

import com.trip.entity.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//DTO의 역할 : 데이터 담는 객체이므로(DB연결용이 아님) @Id 같은 어노테이션 작성X
//DB에 넣을 때는 Entity 사용
//클라이언트와 주고받을 때에는 DTO를 사용 -> 보여줄 것과 숨길 것을 명확히 구분할 것
//나머지 정보들은 AuthService에서 알아서 채워주도록 수정
public class AuthDto {
	
	// 회원가입 요청 DTO
	@Getter
	@Setter
	@NoArgsConstructor
	public static class SignupRequest{
		// 회원가입에 꼭 필요한 정보(메일, 비밀번호, 닉네임)만 담음
		// id, Role이나 가입일자는 사용자(클라이언트)단에서 조작할 수 없도록 입력을 받지 않음
		
		@NotBlank(message = "이메일은 필수입니다.") // 빈칸 금지
	    @Email(message = "이메일 형식이 아닙니다.") // 이메일 형식 체크
		private String email;
		@NotBlank(message = "비밀번호는 필수입니다.") // 빈칸 금지
		@Size(min = 5, message = "비밀번호는 8자 이상이어야 합니다.") // 길이 체크
		private String password;
		private String name;
	}
	
	// 로그인 요청 DTO
	@Getter
	@Setter
	@NoArgsConstructor
	public static class LoginRequest{
		// 로그인시에 꼭 필요한 정보(메일, 비밀번호)만 담음
		private String email;
		private String password;		
	}
	
	// 응답 DTO
	@Getter
	public static class UserResponse{
		//프론트에 꼭 보여줘야 하는 정보만 담음
		//보안상 위험한 정보(password)는 빼야 함
		private String email;
		private String name;
		private String token; //JWT 설정 후, 토큰을 담아서 보낼 변수 추가
		
		//조회용 생성자
		//DB에서 꺼낸 User 객체를 response DTO에 담는 작업(Entity -> DTO 변환기)
		public UserResponse(User user) {
			this.email = user.getEmail();
			this.name = user.getName();
		}

		//로그인용 생성자
		//DB에서 꺼낸 User 객체를 response DTO에 담는 작업(Entity -> DTO 변환기)
		public UserResponse(User user, String token) {
			this.email = user.getEmail();
			this.name = user.getName();
			this.token = token; //받아온 토큰 저장 부분 추가
		}
		
	}

}
