package com.trip.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trip.entity.City;
import com.trip.repository.CityRepository;

@RestController
@RequestMapping("/api/cities")
public class CityController {
	private final CityRepository cityRepository;
	
	@Autowired
	public CityController(CityRepository cityRepository) {
		this.cityRepository = cityRepository;
	}
	
	@GetMapping
	public ResponseEntity<List<City>> searchCities(
			//프론트에서 보낸 url에서 '?q=' 뒤의 값을 query라는 변수에 담음
			@RequestParam("q") String query){
		//findByCityStartingWithIgnoreCase(query)함수를 이용해서 해당값들을 찾아내서 cities 객체에 담음
		List<City> cities = cityRepository.findByCityStartingWithIgnoreCase(query);
		return ResponseEntity.ok(cities);
	}
}
