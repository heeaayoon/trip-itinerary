package com.trip.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trip.entity.Schedule;

public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {
	// Day 객체를 통해 -> Trip 객체에 접근해서 -> Id를 찾아서
	// order순 정렬-> time순 정렬
    List<Schedule> findByDay_Trip_IdOrderByDisplayOrderAscTimeAsc(UUID tripId);
}
