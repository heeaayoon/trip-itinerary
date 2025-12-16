package com.trip.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import com.trip.util.JsonListConverter;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "trip_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripPreference {
	
	@Id
	@GeneratedValue
	@Column(name = "id", columnDefinition = "BINARY(16)")
	private UUID id;
	
	 @OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name="trip_id", nullable = false, unique = true) //foreign key로 연결
	private Trip trip;
	
	@Column(name="pace_preference")
	private String pace;
	@Column(name="accommodation_type")
	private String accommodation; 
	@Column(name="companion_type")
	private String companion;
	@Column(name="budget_level")
	private String budget;
	
	// [중요] DB의 JSON 타입 <-> 자바의 List<String> 자동 변환
	// JsonListConverter 클래스 작성 필요
	@Column(name = "interests", columnDefinition = "json")
	@Convert(converter = JsonListConverter.class)
	private List<String> interests; //여기 문자열(배열)저장 할거임
	
	@Column(name="created_at", updatable = false)
	@CreationTimestamp // INSERT 시 자동으로 현재 시간 저장
	private LocalDateTime createdAt;

}
