package com.trip.security;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.trip.entity.User;

//UserDetails라는 정해진 규격에 맞춰 만든 출입증
//원하는 추가정보를 담을 수 있음

public class CustomUserDetails implements UserDetails{

	// 원본 User 엔티티 객체를 필드로 가집니다.
    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    // UserDetails 인터페이스의 메소드 구현(기본 기능)
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // 현재는 권한(Role)을 사용하지 않으므로 빈 리스트를 반환합니다.
        // 만약 user.getRole()에 "ROLE_ADMIN" 같은 값이 있다면, 그것을 GrantedAuthority로 변환해서 반환해야 합니다.
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        // UserDetails에서 'username'은 일반적으로 고유 식별자를 의미합니다.
        // 우리 시스템에서는 이메일이 그 역할을 하므로, 이메일을 반환합니다.
        return user.getEmail();
    }

    //계정 상태 관련 메소드들 (지금은 모두 true로 설정)

    @Override
    public boolean isAccountNonExpired() {
        return true; // 계정이 만료되지 않았음
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // 계정이 잠기지 않았음
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // 비밀번호가 만료되지 않았음
    }

    @Override
    public boolean isEnabled() {
        return true; // 계정이 활성화되어 있음
    }

    // 필요한 추가 정보를 가져오기 위한 커스텀 메소드들(핵심)
    public User getUser() {
        // 원본 User 엔티티 객체를 통째로 반환하는 메소드
        return user;
    }

    public UUID getId() {
        // User 엔티티에서 ID를 반환
        return user.getId();
    }
    
    public String getName() {
        // User 엔티티에서 이름을 반환
        return user.getName();
    }

    public String getEmail() {
        // User 엔티티에서 이메일을 반환
        return user.getEmail();
    }
}