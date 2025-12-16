package com.trip.controller;
import com.trip.dto.AuthDto;
import com.trip.dto.UserDto;
//이미 로그인한 사용자를 관리하는 기능
//사용자 조회, 수정, 삭제 등
import com.trip.entity.User;
import com.trip.security.CustomUserDetails;
import com.trip.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController // 이 클래스가 REST API의 Controller임을 알려줌
@RequestMapping("/api/users") // 이 Controller의 모든 API는 "/api/users" 라는 주소로 시작함
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users : 모든 사용자 목록을 조회하는 API
    // 비번 등을 숨기기 위해 AuthDTO 사용함
    @GetMapping
    public ResponseEntity<List<AuthDto.UserResponse>> getAllUsers() {
        List<User> users = userService.getAllUsers(); // UserService에게 모든 사용자 조회 함수 요청
        List<AuthDto.UserResponse> respList = users.stream()
        		.map(user->new AuthDto.UserResponse(user))
        		.collect(Collectors.toList());
    
        return ResponseEntity.ok(respList);
    }
    
    // GET /api/users/{id} : 특정 사용자 목록을 조회하는 API
    // 비번 등을 숨기기 위해 AuthDTO 사용함
    @GetMapping("/{id}")
    public ResponseEntity<AuthDto.UserResponse> getUserById(@PathVariable String id){ //@PathVariable -> URL 경로의 일부를 변수처럼 뽑아서 사용하고 싶을 때 사용
    	User user = userService.getUserById(id); // UserService에게 특정 사용자 조회 함수 요청
    	return ResponseEntity.ok(new AuthDto.UserResponse(user));
    }
    
    @GetMapping("/me") // GET 요청, 주소는 /api/users/me
    public ResponseEntity<UserDto.UserInfoResponse> getMyInfo0(
    		@AuthenticationPrincipal CustomUserDetails userDetails) {
        // @AuthenticationPrincipal: Spring Security가 JWT 토큰을 자동으로 검증하고,
        //                          그 결과로 만들어진 CustomUserDetails 객체를 여기에 넣어줍니다.
        
        // CustomUserDetails 객체에서 필요한 정보를 꺼냅니다.
        String email = userDetails.getEmail();
        String name = userDetails.getName();
        
        // 응답으로 보낼 DTO를 생성합니다.
        UserDto.UserInfoResponse response = new UserDto.UserInfoResponse(email, name);
        return ResponseEntity.ok(response);
    }

}