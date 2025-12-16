package com.trip.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.trip.entity.Trip;
import com.trip.entity.User;

public interface TripRepository extends JpaRepository<Trip, UUID> {
	//사용자 로그인 후, "내 여행 목록 보기" 기능에 필요
	List<Trip> findAllByCreator(User creator);
	
	//ID로 Trip을 조회할 때, 연관된 엔티티들을 즉시 로딩(EAGER)하도록 설정합니다.
	@Override
    @EntityGraph(attributePaths = {
    	    "creator", 
    	    "participants.user", // participants의 user 정보까지
    	    "days", 
    	    "days.schedules", 
    	    "tripNotes.user", // tripNotes의 user 정보까지
    	    "tripTips.user"     // tripTips의 user 정보까지
    	})
    Optional<Trip> findById(UUID id);
}
