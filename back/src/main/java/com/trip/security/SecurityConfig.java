package com.trip.security;

import java.util.Arrays;

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
import org.springframework.web.cors.UrlBasedCorsConfigurationSource; // [중요] reactive가 빠진 올바른 import

@Configuration
@EnableWebSecurity
public class SecurityConfig {
	
	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	
	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}
	
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // [1단계] CORS 설정 적용
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // CSRF 비활성화
            .csrf(csrf -> csrf.disable())
            // 세션 미사용 (JWT 사용)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 접근 권한 설정
            .authorizeHttpRequests(auth -> auth
                // [수정] 메인 화면("/")과 정적 리소스도 허용 (403 방지)
                .requestMatchers("/", "/index.html", "/static/**").permitAll()
                // [수정] 로그인 관련 경로를 좀 더 명확하게 추가
                .requestMatchers("/api/auth/**", "/api/login", "/api/signup").permitAll()
                // 도시 조회 허용
                .requestMatchers("/api/cities/**").permitAll()
                // 에러 페이지 허용
                .requestMatchers("/error").permitAll()
                // 나머지는 인증 필요
                .anyRequest().authenticated()
            )
            // JWT 필터 배치
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    // [2단계] CORS 설정 Bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 프론트엔드 주소 허용
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        
        // 모든 HTTP 메서드 허용
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // 모든 헤더 허용
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // 쿠키/인증정보 허용
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}