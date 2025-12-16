package com.trip.repository;

import java.util.Optional;
import java.util.OptionalLong;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.trip.entity.User;


@Repository // 이 인터페이스가 Repository임을 Spring에게 알려줌
//JpaRepository를 상속받았으므로 기본적인 CRUD는 자동으로 만들어짐
public interface UserRepository extends JpaRepository<User, UUID> {

    //이메일 중복 검사용 쿼리 생성 함수
	//existsBy...로 시작하면 JPA가 자동으로 "존재 여부 확인 쿼리"를 날림
	boolean existsByEmail(String email);

	//로그인용(이메일로 사용자 찾기) 쿼리 생성 함수
	//findBy...로 시작하면 JPA가 자동으로 "조회 쿼리"를 날림
	Optional<User> findByEmail(String email);
}