package com.trip.service;
import com.trip.entity.User;
import com.trip.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service // 이 클래스가 비즈니스 로직을 담당하는 Service임을 Spring에게 알려줌
public class UserService {

    private final UserRepository userRepository;

    @Autowired // Spring이 UserRepository의 구현체를 자동으로 주입해줌
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // 모든 사용자 조회 함수
    public List<User> getAllUsers() {
        return userRepository.findAll(); // UserRepository의 기본 기능인 findAll() 호출
    }

    // 특정 ID로 사용자 조회 함수
    public User getUserById(String idString) {
    	UUID id = UUID.fromString(idString);//문자열로 들어온 ID를 UUID 객체로 변환
        return userRepository.findById(id) //UUID 객체로 DB 조회
        		.orElseThrow(()-> new RuntimeException("User not Found!"));
    }
    
    //사용자 정보 수정, 삭제 추가
}