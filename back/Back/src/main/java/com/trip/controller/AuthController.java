package com.trip.controller;
//Controller : 클라이언트의 URL을 보고 요청을 받아 Service에 전달함
//인증 관련 컨트롤러
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trip.dto.AuthDto;
import com.trip.service.AuthService;

import jakarta.validation.Valid;

@RestController // 이 클래스가 REST API의 Controller임을 알려줌
@RequestMapping("/api/auth") // 이 Controller의 모든 API는 "/api/auth" 라는 주소로 시작함
public class AuthController {

	private final AuthService authService;
	
	@Autowired
	public AuthController(AuthService authService) {
		this.authService = authService;
	}
	
	//회원가입 API
	// 1. 입력: @RequestBody로 JSON을 받아서 SignupRequest 객체로 변환
	// 2. @Valid: DTO에 적어둔 @NotBlank, @Email 같은 조건이 맞는지 검사
	@PostMapping("/signup") //클라이언트가 해당 주소로 회원가입 정보(JSON)를 보냄
	public ResponseEntity<AuthDto.UserResponse> signup(@RequestBody @Valid AuthDto.SignupRequest request){
		// [추가] 콘솔에 찍어보기 (서버 로그 창 확인)
	    System.out.println("============== 데이터 확인 ==============");
	    System.out.println("이메일: " + request.getEmail());
	    System.out.println("비번: " + request.getPassword());
	    System.out.println("========================================");
		
		AuthDto.UserResponse response = authService.signup(request); //Controller -> Service(회원가입 함수 실행)
		return ResponseEntity.ok(response); //Service -> Controller 
	}
	
	//로그인 API
	@PostMapping("/login")
	public ResponseEntity<AuthDto.UserResponse> login(@RequestBody @Valid AuthDto.LoginRequest request){
		AuthDto.UserResponse response = authService.login(request);
		return ResponseEntity.ok(response);
	}
}