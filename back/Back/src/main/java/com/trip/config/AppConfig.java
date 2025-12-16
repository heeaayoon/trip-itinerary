package com.trip.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration // Spring의 설정 파일
public class AppConfig {

    @Bean // 이 메소드가 반환하는 객체를 Spring의 '부품(Bean)'으로 등록하라는 의미입니다.
    public RestTemplate restTemplate() {
        // RestTemplate 객체를 생성해서 반환합니다.
        // 이제 Spring은 'RestTemplate' 타입의 부품이 필요할 때마다 이 메소드를 호출하여 가져갑니다.
        return new RestTemplate();
    }
}