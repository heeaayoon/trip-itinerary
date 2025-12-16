package com.trip.security;
//모든 요청이 컨트롤러에 도착하기 전에 가로채서 
//"헤더에 토큰이 있는지", "그 토큰이 유효한지" 검사
//유효하면 통과인증됨
import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
//OncePerRequestFilter : 요청 한번당 딱 한번만 실행되는 함수
public class JwtAuthenticationFilter extends OncePerRequestFilter {
	private final JwtUtil jwtUtil;
	private final CustomUserDetailsService userDetailsService;
	
	public JwtAuthenticationFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
		this.jwtUtil = jwtUtil;
		this.userDetailsService = userDetailsService;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		//요청 헤더에서 Authorization 키의 값 가져오기
		String authHeader = request.getHeader("Authorization");
		String token = null;
		String email = null;
		//헤더가 있고, 그 값이 Bearer 로 시작하는지 확인
		if (authHeader != null && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7); //앞 7자를 자르고 토큰 가져옴
			email = jwtUtil.getEmailByToken(token); //함수로 이메일 가져옴
		}
		//이메일이 존재하고, 아직 인증되지 않은 상태(Context에 없는 상태)라면 검사 시작
		if(email != null && SecurityContextHolder.getContext().getAuthentication()==null) {
			//DB에서 유저 상세정보 가져오기
			UserDetails userDetails = this.userDetailsService.loadUserByUsername(email);
			//토큰 유효성 검사
			if(jwtUtil.validateToken(token)) {
				//인증객체 생성
				UsernamePasswordAuthenticationToken authToken = 
						new UsernamePasswordAuthenticationToken(userDetails,null, userDetails.getAuthorities());
				//요청정보 추가 세팅
				authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				//스프링 시큐리티 저장소(context holder)에 인증정보 저장
				SecurityContextHolder.getContext().setAuthentication(authToken);
			}			
		}
		filterChain.doFilter(request, response);
	}
}
