package com.trip.security;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

//토큰을 생성하고, 들어온 토큰이 위조되었는지 검사하는 클래스

@Component
public class JwtUtil {
	//서버만 알고 있는 비밀키
	//토큰 서명에 사용됨
//	@Value("${jwt.secret}")
//	private String secretKey;
//	
//	//토큰 유효 시간
//	@Value("${jwt.expiration}")
//	private long expirationTime;

	
	 private String secretKey;
	    private long expirationTime;

	    // [추가] 생성자를 만들어서 값이 들어오는지 찍어보기
	    // @Value는 필드 주입보다 생성자 주입이 더 안전합니다.
	    @Autowired
	    public JwtUtil(@Value("${jwt.secret}") String secretKey,
	                   @Value("${jwt.expiration}") long expirationTime) {
	        this.secretKey = secretKey;
	        this.expirationTime = expirationTime;
	        
	        System.out.println("============== JWT 키 확인 ==============");
	        System.out.println("Secret Key: " + this.secretKey);
	        System.out.println("Expiration Time: " + this.expirationTime);
	        System.out.println("========================================");
	    }	
	//1.토큰 생성 함수
	//로그인 성공 시, 토큰을 만드는 함수
	public String generateToken(String email) {
		return JWT.create()
				.withSubject(email) //토큰의 주인 기록(email)
				.withIssuedAt(new Date()) //토큰 발급시간 기록
				.withExpiresAt(new Date(System.currentTimeMillis()+expirationTime)) //언제 만료되는지 기록
				.sign(Algorithm.HMAC256(secretKey)); //비밀키를 이용해 암호화 서명
	}
	
	//2.신원검사용 함수(누구의 토큰인가?-email 추출)
	public String getEmailByToken(String token) {
		return JWT.require(Algorithm.HMAC256(secretKey)) //비밀키로 서명을 풀 준비
				.build()
				.verify(token) //토큰 검증
				.getSubject(); //이메일 추출
	}
	
	//3.유효성 검사 함수
	//토큰이 위조되거나 만료되지 않았는지 확인
	public boolean validateToken(String token) {
		try {
			JWT.require(Algorithm.HMAC256(secretKey))
				.build()
				.verify(token);
			return true;
		}catch(Exception e) {
			return false; 
		}
	}
}
