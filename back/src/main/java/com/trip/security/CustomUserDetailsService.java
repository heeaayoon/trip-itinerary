package com.trip.security;
//DB에서 유저를 찾아와서 시큐리티가 이해하는 UserDatail형태로 번역

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.trip.entity.User;
import com.trip.repository.UserRepository;

@Service
public class CustomUserDetailsService implements UserDetailsService{
	private final UserRepository userRepository;
	
	@Autowired
	public CustomUserDetailsService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}
	
	// 스프링 시큐리티가 이 이메일 가지고, UserDatails 만들라고 호출하는 함수
	@Override
	public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException{
		//DB에서 유저 찾기
		User user = userRepository.findByEmail(email)
				.orElseThrow(()->new UsernameNotFoundException("사용자를 찾을 수 없습니다."));
		//유저정보(Entity)->시큐리티 유저정보(UserDatails) 옮기기
		//스프링 시큐리티가 제공하는 User 객체 대신, 새로 만든 CustomUserDetails 객체를 반환
		return new CustomUserDetails(user);
	}
}
