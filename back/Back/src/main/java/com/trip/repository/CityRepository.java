package com.trip.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trip.entity.City;
import java.util.List;


public interface CityRepository extends JpaRepository<City, Long>{

	//city 필드의 값이 특정 문자열(query)로 시작하는 모든 도시를 대소문자 구분 없이 찾아달라는 쿼리
	List<City> findByCityStartingWithIgnoreCase(String query);
}
