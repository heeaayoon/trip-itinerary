package com.trip.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trip.entity.Day;

public interface DayRepository extends JpaRepository<Day, UUID> {

}
