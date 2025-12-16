package com.trip.service;
//Service : 실제 로직
import java.sql.Timestamp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trip.dto.AuthDto;
import com.trip.entity.User;
import com.trip.repository.UserRepository;
import com.trip.security.JwtUtil;

@Service
public class AuthService {

    private final JwtUtil jwtUtil;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	
	@Autowired
	public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
	}
	
	// 회원가입 기능
	// 입력: SignupRequest DTO -> 출력 : UserResponse DTO
	@Transactional //DB 저장 중 에러나면 롤백
	public AuthDto.UserResponse signup(AuthDto.SignupRequest request) {
		
		//1.이메일 중복 체크 로직
	    if(userRepository.existsByEmail(request.getEmail())) {
	        throw new IllegalStateException("이미 사용중인 이메일입니다.");
	    }
		
		//2.DTO->Entity변환(DB에 넣기 위해)
	    User user = new User();
	    user.setEmail(request.getEmail());
	    user.setName(request.getName());
	    //비밀번호는 암호화 필수
	    String encodedPassword = passwordEncoder.encode(request.getPassword());
	    user.setPassword(encodedPassword);
	    //그 외 사용자가 입력하지 않는 정보들 설정
	    user.setRole("ROLE_USER"); //기본은 일반 유저
	    user.setCreatedAt(new Timestamp(System.currentTimeMillis())); //가입시간은 현재시간

        //3.DB에 저장
	    User savedUser = userRepository.save(user);
	    
        //4. Entity->DTO변환(나중에 프론트에서 쓰기 유용)
	    //비번을 제외한 정보(UserResponse)만 반환됨
	    // 회원가입 직후에는 아직 토큰이 없으므로, 토큰 자리에 빈 문자열("") 혹은 null을 넣음
        return new AuthDto.UserResponse(savedUser);
	}
	
	//로그인 기능
	//입력: LoginRequest DTO -> 출력 : UserResponse DTO
	//토큰 발급 로직 추가
	public AuthDto.UserResponse login(AuthDto.LoginRequest request){
		
		//1.이메일로 사용자 찾기
		User user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(()->new RuntimeException("가입되지 않은 이메일입니다."));
		//2.비밀번호 검증
		//입력받은 비번과 DB의 암호화된 비번이 매칭되는지 검사
		if(!passwordEncoder.matches(request.getPassword(), user.getPassword()))
			throw new RuntimeException("비밀번호가 일치하지 않습니다.");
		
		//3.로그인 성공
		//토큰 발급 로직 추가
		String token = jwtUtil.generateToken(user.getEmail());
		
		//비번을 제외한 정보(UserResponse)만 반환됨
		return new AuthDto.UserResponse(user, token);
	}

}
