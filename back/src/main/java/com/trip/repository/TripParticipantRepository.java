package com.trip.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trip.entity.TripParticipant;
import com.trip.entity.TripParticipantId;

@Repository // 이 인터페이스가 레포지토리임을 명시
public interface TripParticipantRepository extends JpaRepository<TripParticipant, TripParticipantId> {
}