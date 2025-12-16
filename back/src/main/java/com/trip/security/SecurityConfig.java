package com.trip.security;
import java.util.Arrays;

//보안 설정 파일
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration // 이 클래스가 Spring의 설정 파일임을 알려줌
@EnableWebSecurity // 웹 보안을 활성화함
public class SecurityConfig {
	
	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	
	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}
	
	@Bean
	//비밀번호 암호화를 위한 인코더
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
        		// [1단계] CORS 설정을 Security Filter Chain에 적용합니다.
        		.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable()) // CSRF 보안 비활성화 (REST API에서는 보통 비활성화)
                // [중요] 세션 사용 안 함 설정 (STATELESS)
                .sessionManagement(session->session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))// JWT 토큰을 쓰기 때문에 서버에 세션을 저장하지 않음
                // HTTP 요청에 대한 접근 권한 설정
                .authorizeHttpRequests(auth -> auth
                	    .requestMatchers("/api/auth/**").permitAll() //로그인, 회원가입은 누구나 가능
                	    .requestMatchers("/api/cities/**").permitAll() //도시 조회도 누구나 가능
                	    .requestMatchers("/error").permitAll() // 스프링 부트가 에러 났을 때 보내는 곳(/error)도 허용
                	    .anyRequest().authenticated() //나머지는 인증 필요
                )
                // [중요] 만든 "JWT 필터"를 "기본 로그인 필터"보다 먼저 실행되게 배치함
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    // [2단계] 구체적인 CORS 정책을 설정하는 Bean을 새롭게 등록합니다.
    // WebConfig 대신, 이제 Spring Security가 이 설정을 사용하게 됩니다.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 허용할 출처(프론트엔드 주소)를 설정합니다.
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        
        // 허용할 HTTP 메소드를 설정합니다. ("*"는 모든 메소드를 의미)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // 허용할 헤더를 설정합니다.
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // 인증 정보(쿠키, 토큰 등)를 포함한 요청을 허용합니다.
        configuration.setAllowCredentials(true);
        
        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        // 모든 경로("/**")에 대해 위에서 만든 CORS 정책을 적용합니다.
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}