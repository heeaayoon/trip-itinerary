package com.trip.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trip.entity.TripPreference;

public interface TripPreferenceRepository extends JpaRepository<TripPreference, UUID> {

}
