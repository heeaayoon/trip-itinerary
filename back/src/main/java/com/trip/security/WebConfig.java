package com.trip.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer { // 클래스 이름을 WebMvcConfig로 변경 (더 일반적)

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // [수정] "/api/**" 대신 "/**"로 변경하여 모든 경로를 허용
                .allowedOrigins("http://localhost:3000")
                // [추가] allowedMethods에 "OPTIONS"를 명시적으로 추가
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600); // Preflight 요청 결과를 1시간 동안 캐시
    }
}