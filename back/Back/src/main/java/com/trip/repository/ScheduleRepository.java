package com.trip.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trip.entity.Schedule;

public interface ScheduleRepository extends JpaRepository<Schedule, UUID> {

}
