package com.trip.controller;
//인증된 사용자를 넘긴 후, 여행 정보 작성하는 서비스와 연결 

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trip.dto.TripDto;
import com.trip.entity.Trip;
import com.trip.entity.User;
import com.trip.security.CustomUserDetails;
import com.trip.service.TripService;

@RestController
@RequestMapping("/api/trips")
public class TripController {
	private final TripService tripService;
	
	@Autowired
	public TripController(TripService tripService) {
		this.tripService = tripService;
	}
	
	//여행 생성 API
	@PostMapping
	public ResponseEntity<TripDto.TripResponse> createTrip(
			@RequestBody TripDto.TripRequest request,
			@AuthenticationPrincipal UserDetails userDetails){
		TripDto.TripResponse response = tripService.createTrip(request, userDetails.getUsername());
		
		return ResponseEntity.ok(response);
	}
	
	//내 여행 목록 가져오는 API
	@GetMapping("/my")
	public ResponseEntity<List<TripDto.TripResponse>> getMyTrips(
			@AuthenticationPrincipal CustomUserDetails userDetails) {
        // 현재 로그인된 사용자의 정보를 통째로 가져옵니다.
        User currentUser = userDetails.getUser();
        
        // TripService를 통해 해당 사용자가 생성한 여행 목록을 조회합니다.
        List<Trip> myTrips = tripService.findTripsByUser(currentUser);
        
        // 조회된 엔티티 목록을 응답용 DTO 목록으로 변환합니다.
        List<TripDto.TripResponse> response = myTrips.stream()
                .map(TripDto.TripResponse::new) // .map(trip -> new TripDto.TripResponse(trip)) 과 동일
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
	
	//여행 상세정보를 가져오는 API
    @GetMapping("/{tripId}")
    public ResponseEntity<TripDto.TripDetailResponse> getTripDetail(
            @PathVariable UUID tripId) {
        //getTripDetail 함수로 상세 정보를 조회하고 DTO로 가공
        TripDto.TripDetailResponse response = tripService.getTripDetail(tripId);
        return ResponseEntity.ok(response);
    }
}
